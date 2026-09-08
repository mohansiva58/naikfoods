import mongoose from 'mongoose';
import Product from '../models/Product';
import StockReservation, { IStockReservation } from '../models/StockReservation';
import InventoryEvent from '../models/InventoryEvent';
import { generateOrderId } from '../utils/helpers';
import { getIO } from '../socket';
import { getRedisClient } from '../config/redis';
import { cacheDel, cacheInvalidatePrefix } from '../utils/cache';

const DEFAULT_RESERVATION_TTL_SECONDS = Number(process.env.INVENTORY_RESERVATION_TTL_SECONDS || 5 * 60);
const PAYMENT_RESERVATION_TTL_SECONDS = Number(process.env.INVENTORY_PAYMENT_RESERVATION_TTL_SECONDS || 30 * 60);
const LOCK_TTL_MS = 10_000;

export interface ReserveLineInput {
    productId: string;
    size: string;
    quantity: number;
    color?: string;
}

export interface ReservationGroupResult {
    reservationGroupId: string;
    reservationIds: string[];
    expiresAt: Date;
    ttlSeconds: number;
    reservations: IStockReservation[];
}

const positiveQuantity = (quantity: number): number => {
    const normalized = Math.floor(Number(quantity));
    if (!Number.isFinite(normalized) || normalized <= 0) {
        throw new Error('Quantity must be a positive integer');
    }
    return normalized;
};

const mapToObject = (value: unknown): Record<string, number> => {
    if (!value) return {};
    if (value instanceof Map) return Object.fromEntries(value);
    return value as Record<string, number>;
};

const getStockFields = (size: string) => ({
    totalPath: `sizeCounts.${size}`,
    reservedPath: `sizeReservedCounts.${size}`,
});

const lockKey = (productId: string, size: string, color?: string) =>
    `inventory:lock:${productId}:${size}:${color || 'default'}`;

const buildIdempotencyFilter = (
    idempotencyKey: string,
    productId: string,
    size: string,
    color?: string
) => ({
    idempotencyKey,
    productId,
    size,
    ...(color
        ? { color }
        : { $or: [{ color: null }, { color: { $exists: false } }] }),
});

async function clearInactiveIdempotencyReservations(
    idempotencyKey: string,
    productId: string,
    size: string,
    color?: string
) {
    await StockReservation.deleteMany({
        ...buildIdempotencyFilter(idempotencyKey, productId, size, color),
        status: { $in: ['expired', 'released', 'cancelled', 'completed'] },
    });
}

async function withRedisLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const redis = getRedisClient();
    const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    if (redis) {
        const locked = await redis.set(key, token, { NX: true, PX: LOCK_TTL_MS });
        if (!locked) {
            throw new Error('Stock is being reserved by another checkout. Please try again.');
        }
    }

    try {
        return await fn();
    } finally {
        if (redis) {
            const current = await redis.get(key).catch(() => null);
            if (current === token) {
                await redis.del(key).catch(() => undefined);
            }
        }
    }
}

async function writeInventoryEvent(data: {
    eventType: 'reserved' | 'released' | 'confirmed' | 'cancelled' | 'expired' | 'adjusted';
    productId: string;
    size?: string;
    color?: string;
    quantity: number;
    reservationId?: string;
    reservationGroupId?: string;
    orderId?: string;
    paymentId?: string;
    userId?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
}, session?: mongoose.ClientSession) {
    await InventoryEvent.create([data], session ? { session } : undefined).catch((error) => {
        console.warn('Inventory audit event failed:', error);
    });
}

export class StockReservationService {
    static async getProductStock(productId: string) {
        const product = await Product.findOne({ productId }).lean();
        if (!product) throw new Error('Product not found');

        const sizeCounts = mapToObject(product.sizeCounts);
        const reservedCounts = mapToObject(product.sizeReservedCounts);
        const sizes = Array.isArray(product.sizes) ? product.sizes : Object.keys(sizeCounts);
        const bySize = sizes.reduce((acc, size) => {
            const total = Number(sizeCounts[size] || 0);
            const reserved = Number(reservedCounts[size] || 0);
            acc[size] = {
                totalStock: total,
                reservedStock: reserved,
                availableStock: Math.max(0, total - reserved),
                soldStock: 0,
                lowStockThreshold: Number(product.lowStockThreshold || 3),
            };
            return acc;
        }, {} as Record<string, { totalStock: number; reservedStock: number; availableStock: number; soldStock: number; lowStockThreshold: number }>);

        return {
            productId: product.productId,
            totalStock: Object.values(bySize).reduce((sum, item) => sum + item.totalStock, 0),
            reservedStock: Object.values(bySize).reduce((sum, item) => sum + item.reservedStock, 0),
            availableStock: Object.values(bySize).reduce((sum, item) => sum + item.availableStock, 0),
            bySize,
            expiresInSeconds: DEFAULT_RESERVATION_TTL_SECONDS,
        };
    }

    static async reserveStock(
        productId: string,
        size: string,
        quantity: number,
        sessionId: string,
        userId?: string,
        options?: { color?: string; reservationGroupId?: string; idempotencyKey?: string; ttlSeconds?: number }
    ): Promise<IStockReservation> {
        const normalizedQuantity = positiveQuantity(quantity);
        const idempotencyKey = options?.idempotencyKey || `${sessionId}:${productId}:${size}:${options?.color || 'default'}`;
        const idempotencyFilter = buildIdempotencyFilter(idempotencyKey, productId, size, options?.color);

        const existing = await StockReservation.findOne({
            ...idempotencyFilter,
            status: 'reserved',
            expiresAt: { $gt: new Date() },
        });

        if (existing) return existing;

        await clearInactiveIdempotencyReservations(idempotencyKey, productId, size, options?.color);

        return withRedisLock(lockKey(productId, size, options?.color), async () => {
            const activeAfterLock = await StockReservation.findOne({
                ...idempotencyFilter,
                status: 'reserved',
                expiresAt: { $gt: new Date() },
            });
            if (activeAfterLock) return activeAfterLock;

            await clearInactiveIdempotencyReservations(idempotencyKey, productId, size, options?.color);

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const expiresAt = new Date(Date.now() + (options?.ttlSeconds || DEFAULT_RESERVATION_TTL_SECONDS) * 1000);
                const { totalPath, reservedPath } = getStockFields(size);

                const updated = await Product.findOneAndUpdate(
                    {
                        productId,
                        sizes: size,
                        $expr: {
                            $gte: [
                                {
                                    $subtract: [
                                        { $ifNull: [`$${totalPath}`, 0] },
                                        { $ifNull: [`$${reservedPath}`, 0] },
                                    ],
                                },
                                normalizedQuantity,
                            ],
                        },
                    },
                    {
                        $inc: {
                            [reservedPath]: normalizedQuantity,
                            reservedStock: normalizedQuantity,
                        },
                    },
                    { new: true, session }
                );

                if (!updated) {
                    throw new Error(`Insufficient stock for ${productId} size ${size}`);
                }

                const [reservation] = await StockReservation.create([{
                    reservationId: generateOrderId(),
                    reservationGroupId: options?.reservationGroupId,
                    idempotencyKey,
                    productId,
                    size,
                    color: options?.color,
                    quantity: normalizedQuantity,
                    userId,
                    sessionId,
                    status: 'reserved',
                    expiresAt,
                }], { session });

                await writeInventoryEvent({
                    eventType: 'reserved',
                    productId,
                    size,
                    color: options?.color,
                    quantity: normalizedQuantity,
                    reservationId: reservation.reservationId,
                    reservationGroupId: options?.reservationGroupId,
                    userId,
                    idempotencyKey,
                }, session);

                await session.commitTransaction();
                await cacheDel(`product:${productId}`);
                await cacheInvalidatePrefix('products:');
                this.broadcastStockUpdate(productId, size).catch(() => undefined);
                return reservation;
            } catch (error) {
                await session.abortTransaction();

                const mongoError = error as { code?: number };
                if (mongoError.code === 11000) {
                    const duplicate = await StockReservation.findOne({
                        ...idempotencyFilter,
                        status: 'reserved',
                        expiresAt: { $gt: new Date() },
                    });
                    if (duplicate) return duplicate;
                }

                throw error;
            } finally {
                session.endSession();
            }
        });
    }

    static async reserveItems(
        items: ReserveLineInput[],
        sessionId: string,
        userId?: string,
        idempotencyKey?: string
    ): Promise<ReservationGroupResult> {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Reservation items are required');
        }

        const reservationGroupId = generateOrderId();
        const ttlSeconds = DEFAULT_RESERVATION_TTL_SECONDS;
        const reservations: IStockReservation[] = [];

        try {
            for (const item of items) {
                reservations.push(await this.reserveStock(
                    item.productId,
                    item.size,
                    item.quantity,
                    sessionId,
                    userId,
                    {
                        color: item.color,
                        reservationGroupId,
                        idempotencyKey: `${idempotencyKey || reservationGroupId}:${item.productId}:${item.size}:${item.color || 'default'}`,
                        ttlSeconds,
                    }
                ));
            }
        } catch (error) {
            await Promise.all(reservations.map((reservation) =>
                this.releaseStock(reservation.reservationId, 'reservation_failed').catch(() => undefined)
            ));
            throw error;
        }

        const expiresAt = reservations.reduce<Date>((earliest, reservation) =>
            reservation.expiresAt < earliest ? reservation.expiresAt : earliest,
        reservations[0].expiresAt);

        return {
            reservationGroupId,
            reservationIds: reservations.map((reservation) => reservation.reservationId),
            expiresAt,
            ttlSeconds,
            reservations,
        };
    }

    static async releaseStock(reservationId: string, reason = 'released'): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const reservation = await StockReservation.findOneAndUpdate(
                { reservationId, status: 'reserved' },
                {
                    $set: {
                        status: reason === 'expired' ? 'expired' : reason === 'cancelled' ? 'cancelled' : 'released',
                        releaseReason: reason,
                    },
                },
                { new: true, session }
            );

            if (!reservation) {
                await session.commitTransaction();
                return;
            }

            const { reservedPath } = getStockFields(reservation.size);
            await Product.updateOne(
                { productId: reservation.productId },
                {
                    $inc: {
                        [reservedPath]: -reservation.quantity,
                        reservedStock: -reservation.quantity,
                    },
                },
                { session }
            );

            await writeInventoryEvent({
                eventType: reason === 'expired' ? 'expired' : reason === 'cancelled' ? 'cancelled' : 'released',
                productId: reservation.productId,
                size: reservation.size,
                color: reservation.color,
                quantity: reservation.quantity,
                reservationId: reservation.reservationId,
                reservationGroupId: reservation.reservationGroupId,
                userId: reservation.userId,
                idempotencyKey: reservation.idempotencyKey,
                metadata: { reason },
            }, session);

            await session.commitTransaction();
            await cacheDel(`product:${reservation.productId}`);
            await cacheInvalidatePrefix('products:');
            this.broadcastStockUpdate(reservation.productId, reservation.size).catch(() => undefined);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async extendReservations(
        reservationIds: string[],
        userId: string,
        ttlSeconds = PAYMENT_RESERVATION_TTL_SECONDS
    ): Promise<Date> {
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        await StockReservation.updateMany(
            {
                reservationId: { $in: reservationIds },
                userId,
                status: 'reserved',
            },
            { $set: { expiresAt } }
        );
        return expiresAt;
    }

    static async completeReservation(
        reservationId: string,
        context?: { orderId?: string; paymentId?: string },
        options?: { allowExpired?: boolean }
    ): Promise<boolean> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const reservationFilter: Record<string, unknown> = {
                reservationId,
                status: 'reserved',
            };
            if (!options?.allowExpired) {
                reservationFilter.expiresAt = { $gt: new Date() };
            }

            const reservation = await StockReservation.findOneAndUpdate(
                reservationFilter,
                {
                    $set: {
                        status: 'completed',
                        confirmedOrderId: context?.orderId,
                        confirmedPaymentId: context?.paymentId,
                    },
                },
                { new: true, session }
            );

            if (!reservation) {
                await session.abortTransaction();
                return false;
            }

            const { totalPath, reservedPath } = getStockFields(reservation.size);
            const stockUpdate = await Product.updateOne(
                {
                    productId: reservation.productId,
                    [reservedPath]: { $gte: reservation.quantity },
                    [totalPath]: { $gte: reservation.quantity },
                    stock: { $gte: reservation.quantity },
                },
                {
                    $inc: {
                        [totalPath]: -reservation.quantity,
                        [reservedPath]: -reservation.quantity,
                        stock: -reservation.quantity,
                        reservedStock: -reservation.quantity,
                        soldStock: reservation.quantity,
                    },
                },
                { session }
            );

            if (stockUpdate.modifiedCount !== 1) {
                throw new Error(`Stock conflict while confirming reservation ${reservationId}`);
            }

            await writeInventoryEvent({
                eventType: 'confirmed',
                productId: reservation.productId,
                size: reservation.size,
                color: reservation.color,
                quantity: reservation.quantity,
                reservationId: reservation.reservationId,
                reservationGroupId: reservation.reservationGroupId,
                orderId: context?.orderId,
                paymentId: context?.paymentId,
                userId: reservation.userId,
                idempotencyKey: reservation.idempotencyKey,
            }, session);

            await session.commitTransaction();
            await cacheDel(`product:${reservation.productId}`);
            await cacheInvalidatePrefix('products:');
            this.broadcastStockUpdate(reservation.productId, reservation.size).catch(() => undefined);
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async getReservation(reservationId: string, userId?: string) {
        const query: Record<string, unknown> = { reservationId };
        if (userId) query.userId = userId;
        return StockReservation.findOne(query).lean();
    }

    static async cleanupExpiredReservations(): Promise<void> {
        const expired = await StockReservation.find({
            status: 'reserved',
            expiresAt: { $lte: new Date() },
        }).limit(100);

        for (const reservation of expired) {
            try {
                await this.releaseStock(reservation.reservationId, 'expired');
                console.log(`Released expired reservation: ${reservation.reservationId}`);
            } catch (err) {
                console.error(`Failed to release reservation ${reservation.reservationId}:`, err);
            }
        }
    }

    /**
     * Rebuild product reserved counts from active reservations only.
     * Fixes orphaned sizeReservedCounts when reservation documents were deleted manually.
     */
    static async reconcileReservedCounts(): Promise<number> {
        const activeReservations = await StockReservation.aggregate([
            { $match: { status: 'reserved', expiresAt: { $gt: new Date() } } },
            {
                $group: {
                    _id: { productId: '$productId', size: '$size' },
                    quantity: { $sum: '$quantity' },
                },
            },
        ]);

        const reservedByProduct = new Map<string, Record<string, number>>();
        for (const row of activeReservations) {
            const productId = row._id.productId as string;
            const size = row._id.size as string;
            const bucket = reservedByProduct.get(productId) || {};
            bucket[size] = row.quantity as number;
            reservedByProduct.set(productId, bucket);
        }

        const products = await Product.find({
            $or: [
                { reservedStock: { $gt: 0 } },
                { sizeReservedCounts: { $exists: true, $ne: {} } },
            ],
        }).select('productId sizeCounts sizeReservedCounts reservedStock sizes');

        let fixed = 0;

        for (const product of products) {
            const actual = reservedByProduct.get(product.productId) || {};
            const currentReserved = mapToObject(product.sizeReservedCounts);
            const sizeCounts = mapToObject(product.sizeCounts);
            const allSizes = new Set([
                ...Object.keys(sizeCounts),
                ...Object.keys(currentReserved),
                ...Object.keys(actual),
            ]);

            const nextReserved: Record<string, number> = {};
            let totalReserved = 0;
            let changed = false;

            for (const size of allSizes) {
                const next = Number(actual[size] || 0);
                nextReserved[size] = next;
                totalReserved += next;
                if (Number(currentReserved[size] || 0) !== next) {
                    changed = true;
                }
            }

            if (!changed && Number(product.reservedStock || 0) === totalReserved) {
                continue;
            }

            product.sizeReservedCounts = nextReserved;
            product.reservedStock = totalReserved;
            product.markModified('sizeReservedCounts');
            await product.save();
            await cacheDel(`product:${product.productId}`);
            await this.broadcastStockUpdate(product.productId).catch(() => undefined);
            fixed += 1;
        }

        if (fixed > 0) {
            await cacheInvalidatePrefix('products:');
            console.log(`Reconciled reserved stock for ${fixed} product(s)`);
        }

        return fixed;
    }

    static async broadcastStockUpdate(productId: string, size?: string) {
        const product = await Product.findOne({ productId });
        if (!product) return;

        const io = getIO();
        if (!io) return;

        const sizeCounts = mapToObject(product.sizeCounts);
        const reservedCounts = mapToObject(product.sizeReservedCounts);
        const sizesToBroadcast = size ? [size] : Object.keys(sizeCounts);

        for (const s of sizesToBroadcast) {
            const total = Number(sizeCounts[s] || 0);
            const reserved = Number(reservedCounts[s] || 0);
            io.emit('stockUpdate', {
                productId,
                size: s,
                stock: Math.max(0, total - reserved),
                totalStock: total,
                reservedStock: reserved,
            });
        }
    }
}
