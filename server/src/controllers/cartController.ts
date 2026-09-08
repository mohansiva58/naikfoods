/**
 * cartController.ts
 *
 * Thin controller layer — validates request, delegates to CartReservationService,
 * maps errors to user-friendly messages.  No business logic here.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CartReservationService } from '../services/CartReservationService';
import { resolveSizeQuantities } from '../utils/sizeQuantities';
import Cart from '../models/Cart';
import { cacheSet, CACHE_TTL } from '../utils/cache';

const getCacheKey = (userId: string) => `cart:${userId}`;

/** Convert a service error to a user-friendly response — never expose internals. */
function handleServiceError(error: unknown, res: Response): void {
    const err = error as { code?: string; message?: string };
    const code = err.code || 'UNKNOWN';

    const messages: Record<string, { status: number; message: string }> = {
        PRODUCT_NOT_FOUND:   { status: 404, message: 'This product is no longer available.' },
        OUT_OF_STOCK:        { status: 400, message: 'This item is currently out of stock.' },
        INSUFFICIENT_STOCK:  { status: 400, message: err.message || 'Not enough stock available.' },
        CART_NOT_FOUND:      { status: 404, message: 'Your cart was not found. Please refresh and try again.' },
        UNKNOWN:             { status: 500, message: 'Something went wrong. Please try again.' },
    };

    const mapped = messages[code] ?? messages.UNKNOWN;
    console.error(`[cartController] ${code}:`, err.message);
    res.status(mapped.status).json({ error: mapped.message, code });
}

// ─── GET /cart ───────────────────────────────────────────────────────────────
// Read-only: never writes. Cleanup is done by background workers.
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Please log in to view your cart.' }); return; }

        let cart = await Cart.findOne({ userId }).lean();
        if (!cart) {
            const created = await Cart.create({ userId, items: [] });
            // Use toObject() to get a plain object consistent with .lean()
            res.json(created.toObject());
            return;
        }
        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Unable to load your cart. Please refresh.' });
    }
};

// ─── POST /cart/add ──────────────────────────────────────────────────────────
export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Please log in to add items to your cart.' }); return; }

        const { productId, size, quantity = 1, variantImage, color, sizeQuantities, sizeCounts } = req.body;

        if (!productId) { res.status(400).json({ error: 'Product ID is required.' }); return; }

        const sizeItems = resolveSizeQuantities({ size, quantity, sizeQuantities, sizeCounts });
        if (sizeItems.length === 0) { res.status(400).json({ error: 'Please select a size.' }); return; }

        const sessionId = (req as AuthRequest & { sessionId?: string }).sessionId
            || req.headers['x-session-id'] as string
            || `sess_${userId}`;

        // Process each size item (usually just one)
        let lastResult: Awaited<ReturnType<typeof CartReservationService.addToCart>> | null = null;
        for (const sizeItem of sizeItems) {
            try {
                lastResult = await CartReservationService.addToCart({
                    userId, sessionId,
                    productId, size: sizeItem.size,
                    quantity: sizeItem.quantity,
                    variantImage, color,
                });
            } catch (err) {
                handleServiceError(err, res);
                return;
            }
        }

        if (!lastResult) { res.status(500).json({ error: 'Something went wrong. Please try again.' }); return; }

        res.json({
            ...lastResult.cart.toObject(),
            _meta: {
                adjusted: lastResult.adjusted,
                availableToBuy: lastResult.availableToBuy,
                reservationId: lastResult.reservationId,
                reservationExpiresAt: lastResult.reservationExpiresAt,
                ...(lastResult.adjusted ? {
                    adjustedMessage: `Only ${lastResult.availableToBuy} item${lastResult.availableToBuy === 1 ? '' : 's'} available. Your cart has been updated.`
                } : {}),
            },
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};

// ─── PUT /cart/update ────────────────────────────────────────────────────────
export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Please log in to update your cart.' }); return; }

        const { productId, size, quantity, color, variantImage, sizeQuantities, sizeCounts } = req.body;
        if (!productId) { res.status(400).json({ error: 'Product ID is required.' }); return; }

        const sizeItems = resolveSizeQuantities({ size, quantity, sizeQuantities, sizeCounts });
        if (sizeItems.length === 0 || sizeItems.length > 1) {
            res.status(400).json({ error: 'Please provide a single size and quantity.' }); return;
        }

        const sessionId = (req as AuthRequest & { sessionId?: string }).sessionId
            || req.headers['x-session-id'] as string
            || `sess_${userId}`;

        try {
            const result = await CartReservationService.updateCartItem({
                userId, sessionId,
                productId, size: sizeItems[0].size,
                newQuantity: sizeItems[0].quantity,
                color, variantImage,
            });

            res.json({
                ...result.cart.toObject(),
                _meta: {
                    adjusted: result.adjusted,
                    previousQuantity: result.previousQuantity,
                    newQuantity: result.newQuantity,
                    availableToBuy: result.availableToBuy,
                    ...(result.adjusted ? {
                        adjustedMessage: `Quantity updated to ${result.newQuantity}. Only ${result.availableToBuy} item${result.availableToBuy === 1 ? '' : 's'} available.`
                    } : {}),
                },
            });
        } catch (err) {
            handleServiceError(err, res);
        }
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Something went wrong updating your cart. Please try again.' });
    }
};

// ─── DELETE /cart/remove/:productId/:size ────────────────────────────────────
export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Please log in.' }); return; }

        const { productId, size } = req.params;
        const color = req.query.color as string | undefined;
        const variantImage = req.query.variantImage as string | undefined;

        try {
            const result = await CartReservationService.removeFromCart({ userId, productId, size, color, variantImage });
            res.json(result.cart.toObject());
        } catch (err) {
            handleServiceError(err, res);
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove item. Please try again.' });
    }
};

// ─── DELETE /cart/clear ──────────────────────────────────────────────────────
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Please log in.' }); return; }

        await CartReservationService.clearCart({ userId });
        res.json({ success: true, message: 'Cart cleared.' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart. Please try again.' });
    }
};

// ─── GET /cart/availability ───────────────────────────────────────────────────
// Single efficient query — backend is source of truth, no N+1.
export const getCartAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) { res.status(401).json({ error: 'Please log in.' }); return; }

        const result = await CartReservationService.getCartAvailability(userId);
        res.json(result);
    } catch (error) {
        console.error('Cart availability error:', error);
        // Return a safe response so frontend can retry rather than crashing
        res.status(200).json({
            available: false,
            items: [],
            hasExpiredReservations: false,
            _error: 'We\'re refreshing inventory information. Please try again in a moment.',
        });
    }
};
