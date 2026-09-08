/**
 * CartReservationService
 *
 * Single source of truth for all cart ↔ reservation operations.
 * Every cart mutation that affects quantity also atomically updates
 * the corresponding StockReservation via StockReservationService.
 *
 * Rules enforced here:
 *  - Cart item CANNOT exist without an active reservation.
 *  - Reservation quantity MUST equal cart quantity at all times.
 *  - All operations are wrapped in MongoDB transactions.
 *  - Audit events are written for every inventory transition.
 */

import mongoose from 'mongoose';
import Cart, { ICartItem } from '../models/Cart';
import Product from '../models/Product';
import Sale from '../models/Sale';
import StockReservation from '../models/StockReservation';
import InventoryEvent from '../models/InventoryEvent';
import { StockReservationService } from './StockReservationService';
import { generateOrderId } from '../utils/helpers';
import { cacheDel, cacheSet, cacheInvalidatePrefix, CACHE_TTL } from '../utils/cache';

// ─── helpers ────────────────────────────────────────────────────────────────

const getCacheKey = (userId: string) => `cart:${userId}`;

const mapToRecord = (value: unknown): Record<string, number> => {
    if (!value) return {};
    if (value instanceof Map) return Object.fromEntries(value);
    return value as Record<string, number>;
};

export const findCatalogItem = async (productId: string) => {
    const product = await Product.findOne({ productId });
    if (product) return { item: product, canonicalId: product.productId };

    const sale = await Sale.findOne({ saleId: productId });
    if (sale) return { item: sale, canonicalId: sale.saleId };

    if (mongoose.isValidObjectId(productId)) {
        const p = await Product.findById(productId);
        if (p) return { item: p, canonicalId: p.productId };
        const s = await Sale.findById(productId);
        if (s) return { item: s, canonicalId: s.saleId };
    }
    return null;
};

export const resolveVariantImage = (
    product: { image: string; images?: string[]; colors?: Array<{ image?: { url: string }; images?: Array<{ url: string }> }> },
    variantImage?: string
): string => {
    if (!variantImage) return product.image;
    const allowed = new Set<string>([product.image, ...(product.images || [])]);
    for (const col of product.colors || []) {
        if (col.image?.url) allowed.add(col.image.url);
        for (const img of col.images || []) if (img?.url) allowed.add(img.url);
    }
    return allowed.has(variantImage) ? variantImage : product.image;
};

/** Write an inventory audit event (non-blocking, never throws). */
async function writeAudit(data: {
    eventType: 'reserved' | 'released' | 'confirmed' | 'cancelled' | 'expired' | 'adjusted';
    productId: string; size: string; color?: string; quantity: number;
    reservationId?: string; userId?: string; metadata?: Record<string, unknown>;
}, session?: mongoose.ClientSession) {
    await InventoryEvent.create([data], session ? { session } : undefined).catch((e) =>
        console.warn('[CartReservationService] audit write failed:', e)
    );
}

/** Get the active reservation id for a specific cart line, or null. */
async function getActiveReservationForLine(
    userId: string, productId: string, size: string, color?: string
): Promise<string | null> {
    const res = await StockReservation.findOne({
        userId, productId, size,
        ...(color ? { color } : { $or: [{ color: null }, { color: { $exists: false } }] }),
        status: 'reserved',
        expiresAt: { $gt: new Date() },
    }).lean();
    return res?.reservationId ?? null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AddToCartResult {
    cart: InstanceType<typeof Cart>;
    adjusted: boolean;
    availableToBuy: number;
    reservationId: string;
    reservationExpiresAt: Date;
}

export interface UpdateCartResult {
    cart: InstanceType<typeof Cart>;
    adjusted: boolean;
    previousQuantity: number;
    newQuantity: number;
    availableToBuy: number;
}

export interface RemoveFromCartResult {
    cart: InstanceType<typeof Cart>;
}

export interface ClearCartResult {
    released: number;
}

export interface AvailabilityItem {
    productId: string;
    size: string;
    color?: string;
    quantity: number;
    available: boolean;
    availableToBuy: number;  // Backend is the single source of truth
    message?: string;
    soldOut: boolean;
    reservationExpiresAt?: string;
}

export interface CartAvailabilityResult {
    available: boolean;
    items: AvailabilityItem[];
    hasExpiredReservations: boolean;
}

export class CartReservationService {

    /**
     * Add item to cart WITH reservation.
     * - Creates a StockReservation atomically.
     * - Adds item to Cart document.
     * - If user already has a reservation for this line, extends it.
     * Returns adjusted=true if requested qty was capped to available.
     */
    static async addToCart(params: {
        userId: string;
        sessionId: string;
        productId: string;
        size: string;
        quantity: number;
        variantImage?: string;
        color?: string;
    }): Promise<AddToCartResult> {
        const { userId, sessionId, productId, size, quantity, variantImage, color } = params;

        const resolved = await findCatalogItem(productId);
        if (!resolved) throw Object.assign(new Error('This product is no longer available.'), { code: 'PRODUCT_NOT_FOUND' });

        const { item: product, canonicalId } = resolved;
        const lineImage = resolveVariantImage(product as Parameters<typeof resolveVariantImage>[0], variantImage);

        // How many does user already have in cart for this line?
        const cart = await Cart.findOne({ userId }) || new Cart({ userId, items: [] });
        const existingIdx = cart.items.findIndex(
            (i) => i.productId === canonicalId && i.size === size &&
                   i.color === (color ?? undefined) && i.image === lineImage
        );
        const alreadyInCart = existingIdx > -1 ? cart.items[existingIdx].quantity : 0;

        // How much stock is truly available (excluding this user's own reservation)?
        const rawProduct = product as unknown as Record<string, unknown>;
        const sizeCounts = mapToRecord(rawProduct.sizeCounts);
        const sizeReserved = mapToRecord(rawProduct.sizeReservedCounts);
        const ownReserved = await this._getOwnReservedQty(userId, canonicalId, size, color);

        const totalForSize = Number(sizeCounts[size] ?? product.stock ?? 0);
        const reservedForSize = Math.max(0, Number(sizeReserved[size] ?? 0) - ownReserved);
        const globalAvailable = Math.max(0, totalForSize - reservedForSize);

        // Max additional units this user can add
        const canAdd = Math.max(0, globalAvailable);
        if (canAdd <= 0) {
            throw Object.assign(
                new Error('This item is currently out of stock.'),
                { code: 'OUT_OF_STOCK', availableToBuy: 0 }
            );
        }

        const actualAdditional = Math.min(quantity, canAdd);
        const newTotal = alreadyInCart + actualAdditional;
        const adjusted = actualAdditional < quantity;

        // Reserve the additional units atomically
        // Idempotency key encodes the cart transition (from → to) so retrying the
        // exact same add returns the prior reservation, but a subsequent add of
        // more units produces a distinct key and reserves additional stock.
        const idempotencyKey = `cart:${userId}:${canonicalId}:${size}:${color || 'default'}:${alreadyInCart}to${newTotal}`;
        const reservation = await StockReservationService.reserveStock(
            canonicalId, size, actualAdditional, sessionId, userId,
            { color, idempotencyKey: `${idempotencyKey}:add` }
        );

        // Update cart document
        if (existingIdx > -1) {
            cart.items[existingIdx].quantity = newTotal;
        } else {
            cart.items.push({
                productId: canonicalId,
                name: product.name,
                price: product.price,
                image: lineImage,
                size,
                quantity: actualAdditional,
                variantImage: lineImage,
                color,
            } as ICartItem);
        }
        await cart.save();
        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);
        await StockReservationService.broadcastStockUpdate(canonicalId, size).catch(() => undefined);

        return {
            cart,
            adjusted,
            availableToBuy: canAdd,
            reservationId: reservation.reservationId,
            reservationExpiresAt: reservation.expiresAt,
        };
    }

    /**
     * Update cart item quantity WITH reservation reconciliation.
     * - Increase: reserves additional units atomically.
     * - Decrease: releases excess units immediately.
     * Returns adjusted=true if requested qty was capped.
     */
    static async updateCartItem(params: {
        userId: string;
        sessionId: string;
        productId: string;
        size: string;
        newQuantity: number;
        color?: string;
        variantImage?: string;
    }): Promise<UpdateCartResult> {
        const { userId, sessionId, productId, size, newQuantity, color, variantImage } = params;

        const resolved = await findCatalogItem(productId);
        if (!resolved) throw Object.assign(new Error('This product is no longer available.'), { code: 'PRODUCT_NOT_FOUND' });
        const { item: product, canonicalId } = resolved;
        const rawProduct = product as unknown as Record<string, unknown>;
        const lineImage = variantImage ? resolveVariantImage(product as Parameters<typeof resolveVariantImage>[0], variantImage) : undefined;

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new Error('Cart not found');

        const itemIdx = cart.items.findIndex(
            (i) => i.productId === canonicalId && i.size === size &&
                   (color === undefined || i.color === (color ?? undefined)) &&
                   (lineImage === undefined || i.image === lineImage || i.variantImage === lineImage)
        );
        if (itemIdx === -1) throw new Error('Item not found in cart');

        const previousQuantity = cart.items[itemIdx].quantity;
        const delta = newQuantity - previousQuantity;

        // Get own reserved quantity and global available
        const sizeCounts = mapToRecord(rawProduct.sizeCounts);
        const sizeReserved = mapToRecord(rawProduct.sizeReservedCounts);
        const ownReserved = await this._getOwnReservedQty(userId, canonicalId, size, color);
        const totalForSize = Number(sizeCounts[size] ?? product.stock ?? 0);
        const reservedByOthers = Math.max(0, Number(sizeReserved[size] ?? 0) - ownReserved);
        const availableForOthers = Math.max(0, totalForSize - reservedByOthers);
        // Max we can set for this user = stock not taken by others
        const maxAllowed = Math.min(availableForOthers, totalForSize);
        const cappedQuantity = Math.min(Math.max(1, newQuantity), maxAllowed);
        const actualDelta = cappedQuantity - previousQuantity;
        const adjusted = cappedQuantity < newQuantity;

        if (actualDelta > 0) {
            // Need to reserve more units.
            // Key encodes prev→new quantities so each distinct increase gets a unique key
            // but retrying the exact same increase reuses the same key (idempotent).
            const idempotencyKey = `cart:${userId}:${canonicalId}:${size}:${color || 'default'}:incr:${previousQuantity}to${cappedQuantity}`;
            await StockReservationService.reserveStock(
                canonicalId, size, actualDelta, sessionId, userId,
                { color, idempotencyKey }
            );
        } else if (actualDelta < 0) {
            // Need to release units — find and partially release existing reservation
            await this._releasePartialReservation(userId, canonicalId, size, Math.abs(actualDelta), color, 'quantity_decrease');
        }

        cart.items[itemIdx].quantity = cappedQuantity;
        await cart.save();
        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);
        await StockReservationService.broadcastStockUpdate(canonicalId, size).catch(() => undefined);

        return {
            cart,
            adjusted,
            previousQuantity,
            newQuantity: cappedQuantity,
            availableToBuy: maxAllowed,
        };
    }

    /**
     * Remove an item from cart AND release its reservation immediately.
     */
    static async removeFromCart(params: {
        userId: string;
        productId: string;
        size: string;
        color?: string;
        variantImage?: string;
    }): Promise<RemoveFromCartResult> {
        const { userId, productId, size, color, variantImage } = params;

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new Error('Cart not found');

        // Release ALL active reservations for this user+product+size
        await this._releaseAllReservationsForLine(userId, productId, size, color, 'remove_from_cart');

        cart.items = cart.items.filter(
            (item) =>
                !(item.productId === productId && item.size === size &&
                  (!color || item.color === color) &&
                  (!variantImage || item.image === variantImage || item.variantImage === variantImage))
        );
        await cart.save();
        await cacheSet(getCacheKey(userId), cart, CACHE_TTL.CART);
        await StockReservationService.broadcastStockUpdate(productId, size).catch(() => undefined);

        return { cart };
    }

    /**
     * Clear entire cart AND release all reservations.
     */
    static async clearCart(params: { userId: string }): Promise<ClearCartResult> {
        const { userId } = params;

        // Find all active reservations for this user
        const reservations = await StockReservation.find({
            userId,
            status: 'reserved',
        }).lean();

        let released = 0;
        for (const res of reservations) {
            try {
                await StockReservationService.releaseStock(res.reservationId, 'cart_cleared');
                released++;
            } catch (e) {
                console.warn(`[CartReservationService] Failed to release ${res.reservationId}:`, e);
            }
        }

        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        await cacheDel(getCacheKey(userId));

        return { released };
    }

    /**
     * Get cart availability in a single efficient query (no N+1).
     * Returns per-item availableToBuy so frontend never calculates stock itself.
     */
    static async getCartAvailability(userId: string): Promise<CartAvailabilityResult> {
        const cart = await Cart.findOne({ userId }).lean();
        const items = cart?.items ?? [];

        if (items.length === 0) {
            return { available: true, items: [], hasExpiredReservations: false };
        }

        // ── Batch fetch 1: all unique products ───────────────────────────────
        const productIds = [...new Set(items.map((i) => i.productId))];
        const [products, sales] = await Promise.all([
            Product.find({ productId: { $in: productIds } }).lean(),
            Sale.find({ saleId: { $in: productIds } }).lean(),
        ]);
        const catalogMap = new Map<string, typeof products[0] | typeof sales[0]>();
        for (const p of products) catalogMap.set(p.productId, p);
        for (const s of sales) catalogMap.set(s.saleId, s);

        // ── Batch fetch 2: all active reservations for this user ─────────────
        const activeReservations = await StockReservation.find({
            userId,
            status: 'reserved',
            expiresAt: { $gt: new Date() },
        }).lean();

        const expiredReservations = await StockReservation.find({
            userId,
            status: 'reserved',
            expiresAt: { $lte: new Date() },
        }).lean();

        const ownReservedMap = new Map<string, { qty: number; expiresAt: Date }>();
        for (const res of activeReservations) {
            const key = `${res.productId}:${res.size}`;
            const current = ownReservedMap.get(key);
            const latest = current
                ? { qty: current.qty + res.quantity, expiresAt: current.expiresAt > res.expiresAt ? current.expiresAt : res.expiresAt }
                : { qty: res.quantity, expiresAt: res.expiresAt };
            ownReservedMap.set(key, latest);
        }

        // ── Build result in memory ────────────────────────────────────────────
        const result: AvailabilityItem[] = [];
        let allAvailable = true;

        for (const item of items) {
            const catalog = catalogMap.get(item.productId);
            if (!catalog) {
                allAvailable = false;
                result.push({
                    productId: item.productId, size: item.size, color: item.color,
                    quantity: item.quantity, available: false, availableToBuy: 0,
                    soldOut: true, message: 'This item is no longer available.',
                });
                continue;
            }

            const sizeCounts = mapToRecord((catalog as Record<string, unknown>).sizeCounts);
            const sizeReserved = mapToRecord((catalog as Record<string, unknown>).sizeReservedCounts);
            const key = `${item.productId}:${item.size}`;
            const ownReserved = ownReservedMap.get(key)?.qty ?? 0;
            const expiresAt = ownReservedMap.get(key)?.expiresAt;

            const totalForSize = Number(sizeCounts[item.size] ?? (catalog as Record<string, unknown>).stock ?? 0);
            const globalReserved = Number(sizeReserved[item.size] ?? 0);
            // Available to purchase = global stock - (reservations by others)
            const reservedByOthers = Math.max(0, globalReserved - ownReserved);
            const availableToBuy = Math.max(0, totalForSize - reservedByOthers);
            const isAvailable = availableToBuy >= item.quantity;
            const soldOut = availableToBuy <= 0;

            if (!isAvailable) allAvailable = false;

            result.push({
                productId: item.productId, size: item.size, color: item.color,
                quantity: item.quantity, available: isAvailable,
                availableToBuy,
                soldOut,
                message: soldOut
                    ? 'This item sold out while in your cart.'
                    : isAvailable ? undefined
                    : `Only ${availableToBuy} ${availableToBuy === 1 ? 'item' : 'items'} left.`,
                reservationExpiresAt: expiresAt ? expiresAt.toISOString() : undefined,
            });
        }

        return {
            available: allAvailable,
            items: result,
            hasExpiredReservations: expiredReservations.length > 0,
        };
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private static async _getOwnReservedQty(
        userId: string, productId: string, size: string, color?: string
    ): Promise<number> {
        const reservations = await StockReservation.find({
            userId, productId, size,
            ...(color ? { color } : { $or: [{ color: null }, { color: { $exists: false } }] }),
            status: 'reserved',
            expiresAt: { $gt: new Date() },
        }).lean();
        return reservations.reduce((sum, r) => sum + r.quantity, 0);
    }

    private static async _releasePartialReservation(
        userId: string, productId: string, size: string,
        releaseQty: number, color?: string, reason = 'quantity_decrease'
    ): Promise<void> {
        // Find reservations to release (oldest first)
        const reservations = await StockReservation.find({
            userId, productId, size,
            ...(color ? { color } : { $or: [{ color: null }, { color: { $exists: false } }] }),
            status: 'reserved',
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: 1 }).lean();

        let remaining = releaseQty;
        for (const res of reservations) {
            if (remaining <= 0) break;
            if (res.quantity <= remaining) {
                await StockReservationService.releaseStock(res.reservationId, reason);
                remaining -= res.quantity;
            } else {
                // Partial release: split the reservation — pass `remaining`, not `releaseQty`
                await this._splitAndRelease(res.reservationId, remaining, reason);
                remaining = 0;
            }
        }
    }

    private static async _splitAndRelease(
        reservationId: string, releaseQty: number, reason: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const reservation = await StockReservation.findOne({ reservationId, status: 'reserved' }).session(session);
            if (!reservation || reservation.quantity <= releaseQty) {
                await session.abortTransaction();
                // Just release the whole thing
                await StockReservationService.releaseStock(reservationId, reason);
                return;
            }

            const keepQty = reservation.quantity - releaseQty;
            reservation.quantity = keepQty;
            await reservation.save({ session });

            const reservedPath = `sizeReservedCounts.${reservation.size}`;

            // Update the correct collection: Product or Sale
            const isProduct = await Product.exists({ productId: reservation.productId }).session(session);
            if (isProduct) {
                await Product.updateOne(
                    { productId: reservation.productId },
                    { $inc: { [reservedPath]: -releaseQty, reservedStock: -releaseQty } },
                    { session }
                );
            } else {
                await Sale.updateOne(
                    { saleId: reservation.productId },
                    { $inc: { [reservedPath]: -releaseQty, reservedStock: -releaseQty } },
                    { session }
                );
            }

            await InventoryEvent.create([{
                eventType: 'released',
                productId: reservation.productId,
                size: reservation.size,
                color: reservation.color,
                quantity: releaseQty,
                reservationId: reservation.reservationId,
                userId: reservation.userId,
                metadata: { reason, type: 'partial' },
            }], { session });

            await session.commitTransaction();
        } catch (e) {
            await session.abortTransaction();
            throw e;
        } finally {
            session.endSession();
        }
    }

    private static async _releaseAllReservationsForLine(
        userId: string, productId: string, size: string, color?: string, reason = 'released'
    ): Promise<void> {
        const reservations = await StockReservation.find({
            userId, productId, size,
            ...(color ? { color } : { $or: [{ color: null }, { color: { $exists: false } }] }),
            status: 'reserved',
        }).lean();

        for (const res of reservations) {
            await StockReservationService.releaseStock(res.reservationId, reason).catch((e) =>
                console.warn(`[CartReservationService] release failed for ${res.reservationId}:`, e)
            );
        }
    }
}
