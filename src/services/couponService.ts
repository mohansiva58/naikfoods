import { api } from './api';

export interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    expiryDate?: string;
    minOrderAmount?: number;
    createdAt: string;
    updatedAt: string;
}

export const couponService = {
    // Admin: Get all coupons
    getAllCoupons: async (): Promise<Coupon[]> => {
        const response = await api.get('/coupons');
        return response.data;
    },

    // Admin: Create a coupon
    createCoupon: async (couponData: Partial<Coupon>): Promise<Coupon> => {
        const response = await api.post('/coupons', couponData);
        return response.data;
    },

    // Admin: Delete a coupon
    deleteCoupon: async (id: string): Promise<void> => {
        await api.delete(`/coupons/${id}`);
    },

    // User: Validate a coupon
    validateCoupon: async (code: string, orderAmount: number): Promise<{ 
        code: string; 
        discountType: 'percentage' | 'fixed';
        discountValue: number;
    }> => {
        const response = await api.post('/coupons/validate', { code, orderAmount });
        return response.data;
    }
};
