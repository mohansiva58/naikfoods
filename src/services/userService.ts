import api from './api';
import type { ShippingAddress } from './orderService';

export interface SavedAddress extends ShippingAddress {
    _id?: string;
    isDefault: boolean;
}

export interface CurrentUser {
    firebaseUid: string;
    email: string;
    displayName?: string;
    addresses: SavedAddress[];
}

export const userService = {
    getCurrentUser: async (): Promise<CurrentUser> => {
        const response = await api.get('/users/me');
        return response.data;
    },

    addAddress: async (address: ShippingAddress & { isDefault?: boolean }): Promise<CurrentUser> => {
        const response = await api.post('/users/addresses', address);
        return response.data;
    },
};
