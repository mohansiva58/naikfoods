import api from './api';

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    variantImage?: string;
    color?: string;
}

export interface ShippingAddress {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
}

export interface CreateOrderData {
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    paymentMethod: 'razorpay' | 'cod';
    couponCode?: string;
    reservationIds?: string[];
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
}

export interface Order {
    orderId: string;
    userId: string;
    userEmail: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    subtotal: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    estimatedDelivery?: string;
}

export const orderService = {
    createOrder: async (data: CreateOrderData): Promise<{ success: boolean; order: Order }> => {
        const response = await api.post('/orders', data);
        return response.data;
    },

    getOrders: async (params?: { status?: string; limit?: number; page?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.page) queryParams.append('page', params.page.toString());

        const response = await api.get(`/orders?${queryParams.toString()}`);
        return response.data;
    },

    getOrderById: async (orderId: string): Promise<Order> => {
        const response = await api.get(`/orders/${orderId}`);
        return response.data;
    },

    cancelOrder: async (orderId: string, reason: string): Promise<{ success: boolean }> => {
        const response = await api.post(`/orders/${orderId}/cancel`, { reason });
        return response.data;
    },
};
