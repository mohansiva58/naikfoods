import api from './api';
import { CreateOrderData } from './orderService';

export interface RazorpayOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    reservationExpiresAt?: string;
}

export interface PaymentVerificationData {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    reservationIds?: string[];
}

export const paymentService = {
    createRazorpayOrder: async (amount: number, orderData?: CreateOrderData): Promise<RazorpayOrderResponse> => {
        const response = await api.post('/payment/create-order', { amount, orderData });
        return response.data;
    },

    verifyPayment: async (data: PaymentVerificationData): Promise<{ success: boolean }> => {
        const response = await api.post('/payment/verify', data);
        return response.data;
    },
};
