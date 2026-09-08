import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Cart from '../models/Cart';
import PaymentClaim from '../models/PaymentClaim';
import PaymentIntent from '../models/PaymentIntent';
import Coupon from '../models/Coupon';
import { generateOrderId, validatePhone, validatePincode } from '../utils/helpers';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../config/email';
import { cacheDel } from '../utils/cache';
import {
    resolveOrderLines,
    incrementStockForLines,
    decrementStockForLines,
    RawOrderItemInput,
} from '../services/orderLineItems';
import { StockReservationService } from '../services/StockReservationService';
import StockReservation from '../models/StockReservation';
import {
    verifyRazorpaySignature,
} from '../config/razorpay';

function normalizeShippingAddress(raw: Record<string, unknown>) {
    const pincode = String(raw.pincode || raw.postalCode || '').trim();
    const address = String(raw.address || raw.addressLine1 || '').trim();
    return {
        fullName: String(raw.fullName || '').trim(),
        phone: String(raw.phone || '').trim(),
        email: raw.email ? String(raw.email).trim() : undefined,
        address,
        city: String(raw.city || '').trim(),
        state: String(raw.state || '').trim(),
        pincode,
    };
}

function validateShippingAddress(addr: ReturnType<typeof normalizeShippingAddress>): string | null {
    if (!addr.fullName || !addr.phone || !addr.address || !addr.city || !addr.pincode) {
        return 'Missing required shipping address fields';
    }
    if (!validatePincode(addr.pincode)) {
        return 'Invalid pincode (6 digits required)';
    }
    if (!validatePhone(addr.phone)) {
        return 'Invalid phone number';
    }
    return null;
}

function buildLineQuantityMap(lines: Array<{ productId: string; size: string; quantity: number }>): Record<string, number> {
    return lines.reduce((acc, line) => {
        const key = `${line.productId}:${line.size}`;
        acc[key] = (acc[key] || 0) + line.quantity;
        return acc;
    }, {} as Record<string, number>);
}

function sameQuantityMap(left: Record<string, number>, right: Record<string, number>): boolean {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key]);
}

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    console.log('[createOrder] Entering, req.user:', req.user);
    const userId = req.user?.uid;
    if (!userId) {
        console.warn('[createOrder] Blocked: req.user.uid is missing! Returning 401.');
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const userEmail = req.user?.email || req.body.shippingAddress?.email || `user_${userId}@example.com`;

    const {
        items,
        shippingAddress: rawShipping,
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        couponCode,
        reservationIds,
    } = req.body;

    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Order items are required' });
            return;
        }

        if (!rawShipping) {
            res.status(400).json({ error: 'Shipping address is required' });
            return;
        }

        if (!paymentMethod || !['razorpay', 'cod'].includes(paymentMethod)) {
            res.status(400).json({ error: 'Valid payment method is required' });
            return;
        }

        const shippingAddress = normalizeShippingAddress(rawShipping as Record<string, unknown>);
        const addrErr = validateShippingAddress(shippingAddress);
        if (addrErr) {
            res.status(400).json({ error: addrErr });
            return;
        }

        // Idempotent replay for same Razorpay payment
        if (paymentMethod === 'razorpay' && razorpayPaymentId) {
            const existing = await Order.findOne({ razorpayPaymentId }).lean();
            if (existing) {
                res.status(200).json({
                    success: true,
                    order: {
                        orderId: existing.orderId,
                        orderStatus: existing.orderStatus,
                        paymentStatus: existing.paymentStatus,
                        total: existing.total,
                        estimatedDelivery: existing.estimatedDelivery,
                    },
                    idempotent: true,
                });
                return;
            }
        }

        const rawItems = items as RawOrderItemInput[];
        let lines;
        let subtotal: number;
        try {
            const resolved = await resolveOrderLines(rawItems);
            lines = resolved.lines;
            subtotal = resolved.subtotal;
        } catch (e) {
            res.status(400).json({ error: (e as Error).message });
            return;
        }

        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                const isMinAmountMet = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
                
                if (!isExpired && isMinAmountMet) {
                    if (coupon.discountType === 'percentage') {
                        discount = Math.round((subtotal * coupon.discountValue) / 100);
                    } else {
                        discount = Math.min(coupon.discountValue, subtotal);
                    }
                }
            }
        }

        const SHIPPING_CHARGE = 50; // Fixed shipping cost — must match frontend and paymentController
        const total = subtotal - discount + SHIPPING_CHARGE;
        const totalPaise = Math.round(total * 100);

        let paymentStatus: 'pending' | 'paid' | 'failed' | 'cod' = 'pending';

        if (paymentMethod === 'cod') {
            paymentStatus = 'cod';
        } else if (paymentMethod === 'razorpay') {
            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
                res.status(400).json({ error: 'Razorpay payment details are required' });
                return;
            }

            if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
                res.status(400).json({ error: 'Invalid payment signature' });
                return;
            }

            const paymentIntent = await PaymentIntent.findOne({ razorpayOrderId, userId });
            if (!paymentIntent) {
                res.status(409).json({ error: 'Payment session expired. Please contact support with your Razorpay payment ID.' });
                return;
            }

            if (paymentIntent.amountPaise !== totalPaise) {
                res.status(400).json({
                    error: 'Payment amount mismatch',
                    expectedPaise: totalPaise,
                    receivedPaise: paymentIntent.amountPaise,
                });
                return;
            }

            paymentStatus = 'paid';
        }

        // Single-flight per Razorpay payment (prevents parallel double stock decrement)
        if (paymentMethod === 'razorpay' && razorpayPaymentId) {
            try {
                await PaymentClaim.create({ razorpayPaymentId, userId });
            } catch (claimErr: unknown) {
                if ((claimErr as { code?: number }).code === 11000) {
                    const ord = await Order.findOne({ razorpayPaymentId }).lean();
                    if (ord) {
                        res.status(200).json({
                            success: true,
                            order: {
                                orderId: ord.orderId,
                                orderStatus: ord.orderStatus,
                                paymentStatus: ord.paymentStatus,
                                total: ord.total,
                                estimatedDelivery: ord.estimatedDelivery,
                            },
                            idempotent: true,
                        });
                        return;
                    }
                    res.status(409).json({ error: 'Payment is being processed — please wait' });
                    return;
                }
                throw claimErr;
            }
        }

        const orderId = generateOrderId();

        let completedReservations = false;
        const isPaidRazorpay = paymentMethod === 'razorpay' && paymentStatus === 'paid';
        try {
            if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
                res.status(409).json({ error: 'Checkout reservation is required. Please refresh your cart and try again.' });
                return;
            }

            const lineMap = buildLineQuantityMap(lines);

            const activeReservations = await StockReservation.find({
                reservationId: { $in: reservationIds },
                userId,
                status: 'reserved',
                expiresAt: { $gt: new Date() },
            }).lean();

            if (activeReservations.length === reservationIds.length) {
                const reservationMap = buildLineQuantityMap(activeReservations);
                if (!sameQuantityMap(lineMap, reservationMap)) {
                    for (const resId of reservationIds) {
                        await StockReservationService.releaseStock(resId, 'reservation_mismatch').catch(() => undefined);
                    }
                    res.status(409).json({ error: 'Checkout reservation does not match your cart. Please refresh your cart.' });
                    return;
                }

                for (const resId of reservationIds) {
                    const confirmed = await StockReservationService.completeReservation(resId, {
                        orderId,
                        paymentId: razorpayPaymentId,
                    });
                    if (!confirmed) {
                        throw new Error('Checkout reservation expired. Please contact support if your payment was captured.');
                    }
                }
                completedReservations = true;
            } else if (isPaidRazorpay) {
                const staleReservations = await StockReservation.find({
                    reservationId: { $in: reservationIds },
                    userId,
                    status: 'reserved',
                }).lean();

                if (staleReservations.length === reservationIds.length) {
                    const reservationMap = buildLineQuantityMap(staleReservations);
                    if (!sameQuantityMap(lineMap, reservationMap)) {
                        throw new Error('Checkout reservation does not match your cart. Please contact support if your payment was captured.');
                    }

                    for (const resId of reservationIds) {
                        const confirmed = await StockReservationService.completeReservation(resId, {
                            orderId,
                            paymentId: razorpayPaymentId,
                        }, { allowExpired: true });
                        if (!confirmed) {
                            throw new Error('Unable to confirm stock after payment. Please contact support with your payment ID.');
                        }
                    }
                    completedReservations = true;
                } else {
                    await decrementStockForLines(lines);
                    for (const resId of reservationIds) {
                        await StockReservationService.releaseStock(resId, 'paid_order_fulfilled_directly').catch(() => undefined);
                    }
                }
            } else {
                for (const resId of reservationIds) {
                    await StockReservationService.releaseStock(resId, 'invalid_checkout').catch(() => undefined);
                }
                res.status(409).json({ error: 'Checkout reservation expired. Please return to cart and try again.' });
                return;
            }
        } catch (stockErr) {
            if (paymentMethod === 'razorpay' && razorpayPaymentId) {
                await PaymentClaim.deleteOne({ razorpayPaymentId }).catch(() => undefined);
            }
            res.status(409).json({ error: (stockErr as Error).message });
            return;
        }

        try {
            const order = await Order.create({
                orderId,
                userId,
                userEmail,
                items: lines.map((l) => ({
                    productId: l.productId,
                    name: l.name,
                    price: l.price,
                    image: l.image,
                    size: l.size,
                    quantity: l.quantity,
                    variantImage: l.variantImage,
                    color: l.color,
                })),
                shippingAddress,
                subtotal,
                discount,
                couponCode: couponCode ? couponCode.toUpperCase() : undefined,
                total,
                paymentMethod,
                paymentStatus,
                razorpayOrderId: paymentMethod === 'razorpay' ? razorpayOrderId : undefined,
                razorpayPaymentId: paymentMethod === 'razorpay' ? razorpayPaymentId : undefined,
                razorpaySignature: paymentMethod === 'razorpay' ? razorpaySignature : undefined,
                orderStatus: 'confirmed',
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            try {
                await Cart.findOneAndUpdate({ userId }, { items: [] });
                await cacheDel(`cart:${userId}`);
                if (paymentMethod === 'razorpay' && razorpayOrderId) {
                    await PaymentIntent.findOneAndUpdate({ razorpayOrderId, userId }, { status: 'completed' });
                }
            } catch (cartError) {
                console.warn('Failed to clear cart:', cartError);
            }

            res.status(201).json({
                success: true,
                order: {
                    orderId: order.orderId,
                    orderStatus: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    total: order.total,
                    estimatedDelivery: order.estimatedDelivery,
                },
            });

            sendOrderConfirmationEmail({
                customerName: shippingAddress.fullName,
                customerEmail: shippingAddress.email || userEmail,
                orderId: order.orderId,
                orderDate: order.createdAt,
                items: order.items.map((item) => ({
                    name: item.name,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: item.price * item.quantity,
                })),
                subtotal: order.subtotal,
                total: order.total,
                paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
                shippingAddress: order.shippingAddress,
            }).catch((emailError) => {
                console.error('Failed to send order confirmation email:', emailError);
            });
        } catch (createErr: unknown) {
            const code = (createErr as { code?: number }).code;
            if (!completedReservations) {
                await incrementStockForLines(lines).catch((e) => console.error('Stock rollback failed:', e));
            }
            if (paymentMethod === 'razorpay' && razorpayPaymentId) {
                await PaymentClaim.deleteOne({ razorpayPaymentId }).catch(() => undefined);
            }
            if (code === 11000 && razorpayPaymentId) {
                const existing = await Order.findOne({ razorpayPaymentId }).lean();
                if (existing) {
                    res.status(200).json({
                        success: true,
                        order: {
                            orderId: existing.orderId,
                            orderStatus: existing.orderStatus,
                            paymentStatus: existing.paymentStatus,
                            total: existing.total,
                            estimatedDelivery: existing.estimatedDelivery,
                        },
                        idempotent: true,
                    });
                    return;
                }
            }
            console.error('Create order error:', createErr);
            res.status(500).json({ error: 'Failed to create order', details: (createErr as Error).message });
        }
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order', details: (error as Error).message });
    }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { status, limit = 20, page = 1 } = req.query;

        const query: Record<string, unknown> = { userId };
        if (status && status !== 'all') {
            query.orderStatus = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip(skip),
            Order.countDocuments(query),
        ]);

        res.json({
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { orderId } = req.params;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json(order);
    } catch (error: unknown) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (['shipped', 'delivered', 'cancelled', 'returned'].includes(order.orderStatus)) {
            res.status(400).json({
                error: `Cannot cancel order with status: ${order.orderStatus}`,
            });
            return;
        }

        const lines = order.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            image: i.image,
            size: i.size,
            quantity: i.quantity,
            source: (i.productId.startsWith('SALE-') ? 'sale' : 'product') as 'sale' | 'product',
        }));

        await incrementStockForLines(lines);

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;
        await order.save();

        try {
            await sendOrderStatusUpdateEmail({
                customerName: order.shippingAddress.fullName,
                customerEmail: order.shippingAddress.email || order.userEmail,
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                estimatedDelivery: order.estimatedDelivery,
                trackingNumber: order.trackingNumber,
            });
        } catch (emailErr) {
            console.error('Failed to send cancellation status update email:', emailErr);
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};
