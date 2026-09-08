import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getRazorpayInstance, verifyRazorpaySignature } from '../config/razorpay';
import { generateOrderId } from '../utils/helpers';
import Coupon from '../models/Coupon';
import PaymentIntent from '../models/PaymentIntent';
import { resolveOrderLines, RawOrderItemInput } from '../services/orderLineItems';
import { StockReservationService } from '../services/StockReservationService';

type RazorpayApiError = {
    statusCode?: number;
    status?: number;
    code?: string;
    message?: string;
    error?: {
        code?: string;
        description?: string;
    };
    response?: {
        status?: number;
        data?: {
            error?: {
                code?: string;
                description?: string;
            };
        };
    };
};

const getRazorpayErrorDetails = (error: unknown) => {
    const err = error as RazorpayApiError;
    const statusCode = err.statusCode || err.status || err.response?.status;
    const apiError = err.error || err.response?.data?.error;

    return {
        statusCode,
        code: apiError?.code || err.code,
        description: apiError?.description || err.message,
    };
};

export const createRazorpayOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { amount, currency = 'INR', orderData } = req.body;
        let numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            res.status(400).json({ error: 'Valid amount is required' });
            return;
        }

        if (orderData?.items) {
            const resolved = await resolveOrderLines(orderData.items as RawOrderItemInput[]);
            let discount = 0;
            const couponCode = orderData.couponCode ? String(orderData.couponCode).toUpperCase() : '';

            if (couponCode) {
                const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
                if (coupon) {
                    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                    const isMinAmountMet = !coupon.minOrderAmount || resolved.subtotal >= coupon.minOrderAmount;

                    if (!isExpired && isMinAmountMet) {
                        discount = coupon.discountType === 'percentage'
                            ? Math.round((resolved.subtotal * coupon.discountValue) / 100)
                            : Math.min(coupon.discountValue, resolved.subtotal);
                    }
                }
            }

            const SHIPPING_CHARGE = 50; // Fixed shipping cost — must match frontend CheckoutPage
            const serverTotal = resolved.subtotal - discount + SHIPPING_CHARGE;
            if (Math.round(serverTotal * 100) !== Math.round(numericAmount * 100)) {
                res.status(409).json({ error: 'Your cart total has changed. Please review your cart and try again.' });
                return;
            }

            numericAmount = serverTotal;
        }

        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
            res.status(503).json({ error: 'Payment gateway is not configured. Please contact support.' });
            return;
        }

        // Validate that keyId looks like a real Razorpay key (not a placeholder)
        if (!keyId.startsWith('rzp_')) {
            console.error('[Razorpay] Invalid RAZORPAY_KEY_ID format:', keyId.substring(0, 10));
            res.status(503).json({ error: 'Payment gateway key is invalid. Please contact support.' });
            return;
        }

        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(numericAmount * 100), // Convert to paise
            currency,
            receipt: generateOrderId(),
            notes: {
                userId: String(userId),
            },
        };

        const order = await razorpay.orders.create(options);

        await PaymentIntent.create({
            razorpayOrderId: order.id,
            userId: String(userId),
            amountPaise: Number(order.amount),
            status: 'created',
        });

        let reservationExpiresAt: string | undefined;
        const reservationIds = orderData?.reservationIds;
        if (Array.isArray(reservationIds) && reservationIds.length > 0) {
            const expiresAt = await StockReservationService.extendReservations(
                reservationIds.map(String),
                String(userId)
            );
            reservationExpiresAt = expiresAt.toISOString();
        }

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
            reservationExpiresAt,
        });
    } catch (error) {
        const details = getRazorpayErrorDetails(error);
        console.error('Create Razorpay order error:', details);

        if (details.statusCode === 401) {
            res.status(502).json({ error: 'Payment gateway authentication failed. Check Razorpay key ID and secret.' });
            return;
        }

        if (details.statusCode) {
            res.status(502).json({ error: details.description || 'Payment gateway rejected the order request' });
            return;
        }

        res.status(503).json({ error: 'Unable to reach payment gateway. Please try again.' });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, reservationIds } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400).json({ error: 'Missing payment verification parameters' });
            return;
        }

        const isValid = verifyRazorpaySignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            if (Array.isArray(reservationIds)) {
                await Promise.all(reservationIds.map((id) =>
                    StockReservationService.releaseStock(String(id), 'payment_verification_failed').catch(() => undefined)
                ));
            }
            res.status(400).json({ error: 'Invalid payment signature' });
            return;
        }

        if (Array.isArray(reservationIds) && reservationIds.length > 0 && req.user?.uid) {
            await StockReservationService.extendReservations(
                reservationIds.map(String),
                String(req.user.uid)
            ).catch(() => undefined);
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            razorpayOrderId,
            razorpayPaymentId
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};
