import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import { orderService, CreateOrderData } from '@/services/orderService';
import { clearPendingPaidOrder, savePendingPaidOrder } from '@/lib/pendingPaidOrder';
import { toast } from 'sonner';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => { open: () => void };
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    method: {
        card: boolean;
        netbanking: boolean;
        wallet: boolean;
        upi: boolean;
    };
    config: {
        display: {
            blocks: Record<string, {
                name: string;
                instruments: Array<{
                    method: string;
                    flow?: string;
                }>;
            }>;
            sequence: string[];
            preferences: {
                show_default_blocks: boolean;
            };
        };
    };
    handler: (response: RazorpayResponse) => Promise<void>;
    modal: {
        ondismiss: () => void;
    };
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayCheckoutProps {
    amount: number;
    orderData: CreateOrderData;
    onSuccess: (orderId: string, orderDetails: CreateOrderData & { total: number; subtotal: number; discount: number; shipping: number }) => void;
    onFailure: (error: unknown) => void;
    onPaymentAuthorized?: () => void;
    onReservationExtended?: (expiresAt: Date) => void;
    total: number;
    subtotal: number;
    discountAmount: number;
    shippingCharge: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useRazorpayCheckout = () => {
    const { user } = useAuth();
    const inFlight = useRef(false);
    const navigate = useNavigate();

    const initiatePayment = async ({ amount, orderData, onSuccess, onFailure, onPaymentAuthorized, onReservationExtended, total, subtotal, discountAmount, shippingCharge }: RazorpayCheckoutProps) => {
        try {
            if (!user) {
                throw new Error('Please login to continue');
            }
            if (inFlight.current) {
                toast.message('Payment already in progress');
                return;
            }
            inFlight.current = true;

            // Create Razorpay order
            const razorpayOrder = await paymentService.createRazorpayOrder(amount, orderData);

            // Guard: if keyId is missing, Razorpay SDK will load `build/undefined` and throw a 403
            if (!razorpayOrder.keyId) {
                throw new Error('Payment gateway is not configured. Please contact support.');
            }

            if (razorpayOrder.reservationExpiresAt) {
                onReservationExtended?.(new Date(razorpayOrder.reservationExpiresAt));
            }

            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Naikfoods',
                description: 'Purchase Order',
                order_id: razorpayOrder.orderId,
                prefill: {
                    name: orderData.shippingAddress.fullName,
                    email: orderData.shippingAddress.email || user.email || '',
                    contact: orderData.shippingAddress.phone,
                },
                theme: {
                    color: '#66021F',
                },
                method: {
                    card: true,
                    netbanking: true,
                    wallet: true,
                    upi: true,
                },
                config: {
                    display: {
                        blocks: {
                            cards: {
                                name: 'Cards',
                                instruments: [{ method: 'card' }],
                            },
                            upi: {
                                name: 'UPI',
                                instruments: [
                                    { method: 'upi', flow: 'collect' },
                                    { method: 'upi', flow: 'intent' },
                                ],
                            },
                            banks: {
                                name: 'Netbanking',
                                instruments: [{ method: 'netbanking' }],
                            },
                            wallets: {
                                name: 'Wallets',
                                instruments: [{ method: 'wallet' }],
                            },
                        },
                        sequence: ['block.cards', 'block.upi', 'block.banks', 'block.wallets'],
                        preferences: {
                            show_default_blocks: true,
                        },
                    },
                },
                handler: async function (response: RazorpayResponse) {
                    try {
                        // ──────────────────────────────────────────────────────────
                        // Payment succeeded in Razorpay — navigate to /processing
                        // immediately so user NEVER sees checkout page again
                        // ──────────────────────────────────────────────────────────
                        onPaymentAuthorized?.();
                        navigate('/processing', { replace: true });

                        // Verify payment signature with backend
                        await paymentService.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            reservationIds: orderData.reservationIds,
                        });

                        const paidOrderData = {
                            ...orderData,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        };
                        savePendingPaidOrder(paidOrderData);

                        let orderRes: Awaited<ReturnType<typeof orderService.createOrder>> | null = null;
                        let lastCreateError: unknown = null;

                        // Retry up to 3 times with exponential backoff
                        for (const delay of [0, 1000, 2500]) {
                            if (delay) await wait(delay);
                            try {
                                orderRes = await orderService.createOrder(paidOrderData);
                                break;
                            } catch (createError) {
                                lastCreateError = createError;
                                console.error('Create paid order attempt failed:', createError);
                            }
                        }

                        if (!orderRes) {
                            throw lastCreateError || new Error('Failed to create order after payment');
                        }

                        clearPendingPaidOrder();

                        // Navigate to the order success page with full order details
                        const orderDetails = {
                            ...paidOrderData,
                            orderId: orderRes.order.orderId,
                            orderStatus: orderRes.order.orderStatus,
                            paymentStatus: orderRes.order.paymentStatus,
                            total,
                            subtotal,
                            discount: discountAmount,
                            shipping: shippingCharge,
                        };

                        onSuccess(orderRes.order.orderId, orderDetails);
                    } catch (error) {
                        console.error('Payment verification/order creation failed:', error);
                        
                        // Try to recover from recent orders
                        try {
                            const recentOrders = await orderService.getOrders({ limit: 1 });
                            const latestOrder = Array.isArray(recentOrders?.orders)
                                ? recentOrders.orders[0]
                                : Array.isArray(recentOrders)
                                    ? recentOrders[0]
                                    : null;

                            const isMatch = latestOrder && (
                                latestOrder.razorpayPaymentId === response.razorpay_payment_id ||
                                latestOrder.razorpayOrderId === response.razorpay_order_id
                            );

                            if (latestOrder?.orderId && isMatch) {
                                const recoveredOrderDetails = {
                                    ...orderData,
                                    orderId: latestOrder.orderId,
                                    total,
                                    subtotal,
                                    discount: discountAmount,
                                    shipping: shippingCharge,
                                };
                                onSuccess(latestOrder.orderId, recoveredOrderDetails);
                                return;
                            }
                        } catch (reconcileError) {
                            console.error('Order reconciliation failed:', reconcileError);
                        }

                        toast.error('Payment received but order creation failed. Contact support.');
                        onFailure(error);
                    } finally {
                        inFlight.current = false;
                    }
                },
                modal: {
                    ondismiss: function () {
                        inFlight.current = false;
                        toast.info('Payment cancelled');
                        onFailure(new Error('Payment cancelled by user'));
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            inFlight.current = false;
            console.error('Razorpay error:', error);
            toast.error('Failed to initiate payment');
            onFailure(error);
        }
    };

    return { initiatePayment };
};
