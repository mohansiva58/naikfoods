import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StockReservationService } from '../services/StockReservationService';
import StockReservation from '../models/StockReservation';

const normalizeReservationItems = (items: unknown) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
            productId: String(raw.productId || ''),
            size: String(raw.size || ''),
            color: raw.color ? String(raw.color) : undefined,
            quantity: Number(raw.quantity || 0),
        };
    }).filter((item) => item.productId && item.size && item.quantity > 0);
};

export const getProductStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const stock = await StockReservationService.getProductStock(String(req.params.id));
        res.json(stock);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch stock';
        res.status(message === 'Product not found' ? 404 : 500).json({ error: message });
    }
};

export const reserveInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid || req.body.userId;
        const { productId, size, quantity, sessionId, color, idempotencyKey } = req.body;
        const items = normalizeReservationItems(req.body.items);

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        if (items.length > 0) {
            // ── CHECKOUT RESERVATION LOGIC ───────────────────────────────────
            // If the user already has active cart reservations covering these
            // exact items (created by CartReservationService when they added to
            // cart), we must NOT create new reservations — that would double-
            // consume the stock.  Instead, extend TTL and return the existing IDs.
            if (userId) {
                const existingReservations = await StockReservation.find({
                    userId,
                    status: 'reserved',
                    expiresAt: { $gt: new Date() },
                    productId: { $in: items.map((i) => i.productId) },
                }).lean();

                // Build a map of existing: productId:size -> [reservations]
                const existingMap = new Map<string, typeof existingReservations[0][]>();
                for (const res of existingReservations) {
                    const key = `${res.productId}:${res.size}`;
                    if (!existingMap.has(key)) existingMap.set(key, []);
                    existingMap.get(key)!.push(res);
                }

                // Check if existing reservations fully cover requested items
                const allCovered = items.every((item) => {
                    const key = `${item.productId}:${item.size}`;
                    const existing = existingMap.get(key) || [];
                    const coveredQty = existing.reduce((sum, r) => sum + r.quantity, 0);
                    return coveredQty >= item.quantity;
                });

                if (allCovered) {
                    // Extend TTL of existing reservations and return their IDs
                    const CHECKOUT_TTL_SECONDS = Number(
                        process.env.INVENTORY_RESERVATION_TTL_SECONDS || 5 * 60
                    );
                    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_SECONDS * 1000);
                    const idsToExtend = existingReservations.map((r) => r.reservationId);

                    await StockReservation.updateMany(
                        { reservationId: { $in: idsToExtend }, status: 'reserved' },
                        { $set: { expiresAt } }
                    );

                    res.status(201).json({
                        reservationGroupId: existingReservations[0]?.reservationGroupId || idsToExtend[0],
                        reservationIds: idsToExtend,
                        expiresAt: expiresAt.toISOString(),
                        ttlSeconds: CHECKOUT_TTL_SECONDS,
                        reused: true,
                    });
                    return;
                }

                // Partial coverage — only reserve the uncovered subset to avoid double-consuming stock
                const uncoveredItems = items.filter((item) => {
                    const key = `${item.productId}:${item.size}`;
                    const existing = existingMap.get(key) || [];
                    const coveredQty = existing.reduce((sum: number, r: { quantity: number }) => sum + r.quantity, 0);
                    return coveredQty < item.quantity;
                });

                if (uncoveredItems.length > 0) {
                    const result = await StockReservationService.reserveItems(
                        uncoveredItems, String(sessionId), userId, idempotencyKey
                    );
                    res.status(201).json(result);
                    return;
                }
            }

            // No userId or no reservation records — create fresh reservations for all items
            const result = await StockReservationService.reserveItems(
                items, String(sessionId), userId, idempotencyKey
            );
            res.status(201).json(result);
            return;
        }

        if (!productId || !size || !quantity) {
            res.status(400).json({ error: 'Reservation item fields are required' });
            return;
        }

        const reservation = await StockReservationService.reserveStock(
            String(productId),
            String(size),
            Number(quantity),
            String(sessionId),
            userId,
            { color: color ? String(color) : undefined, idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined }
        );

        res.status(201).json({
            reservationGroupId: reservation.reservationGroupId,
            reservationIds: [reservation.reservationId],
            reservationId: reservation.reservationId,
            expiresAt: reservation.expiresAt,
            ttlSeconds: Math.max(0, Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000)),
            reservations: [reservation],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Reservation failed';
        res.status(409).json({ error: message });
    }
};

export const releaseInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reservationId, reservationIds, reason } = req.body;
        const ids = Array.isArray(reservationIds) ? reservationIds : reservationId ? [reservationId] : [];

        if (ids.length === 0) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        await Promise.all(ids.map((id) => StockReservationService.releaseStock(String(id), reason || 'released')));
        res.json({ success: true, released: ids.length });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Release failed';
        res.status(500).json({ error: message });
    }
};

export const confirmInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reservationId, reservationIds, orderId, paymentId } = req.body;
        const ids = Array.isArray(reservationIds) ? reservationIds : reservationId ? [reservationId] : [];

        if (ids.length === 0) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        for (const id of ids) {
            const confirmed = await StockReservationService.completeReservation(String(id), {
                orderId: orderId ? String(orderId) : undefined,
                paymentId: paymentId ? String(paymentId) : undefined,
            });
            if (!confirmed) {
                res.status(409).json({ error: `Reservation ${id} is not active` });
                return;
            }
        }

        res.json({ success: true, confirmed: ids.length });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Confirmation failed';
        res.status(500).json({ error: message });
    }
};

export const getCheckoutReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reservation = await StockReservationService.getReservation(String(req.params.id), req.user?.uid);
        if (!reservation) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }
        res.json({
            ...reservation,
            ttlSeconds: Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000)),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch reservation';
        res.status(500).json({ error: message });
    }
};
