import api from './api';

export interface ServerCartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    variantImage?: string;
    color?: string;
}

export interface CartMeta {
    adjusted: boolean;
    availableToBuy: number;
    adjustedMessage?: string;
    previousQuantity?: number;
    newQuantity?: number;
    reservationId?: string;
    reservationExpiresAt?: string;
}

export interface Cart {
    _id: string;
    userId: string;
    items: ServerCartItem[];
    updatedAt: string;
    _meta?: CartMeta;
}

export interface CartAvailabilityItem {
    productId: string;
    size: string;
    color?: string;
    quantity: number;
    available: boolean;
    availableToBuy: number;   // Backend source of truth — use this for + button disabling
    soldOut: boolean;
    message?: string;
    reservationExpiresAt?: string;
}

export interface CartAvailability {
    available: boolean;
    items: CartAvailabilityItem[];
    hasExpiredReservations: boolean;
    _error?: string;
}

type SizeQuantityPayload =
    | Array<{ size: string; quantity: number }>
    | Record<string, number>
    | string;

export const cartService = {
    getCart: async (): Promise<Cart> => {
        const response = await api.get('/cart');
        return response.data;
    },

    getAvailability: async (): Promise<CartAvailability> => {
        const response = await api.get('/cart/availability');
        return response.data;
    },

    addToCart: async (
        productId: string,
        size: string,
        quantity: number = 1,
        variantImage?: string,
        color?: string,
        sizeQuantities?: SizeQuantityPayload,
        sizeCounts?: SizeQuantityPayload
    ): Promise<Cart> => {
        const response = await api.post('/cart/add', {
            productId, size, quantity, variantImage, color, sizeQuantities, sizeCounts,
        });
        return response.data;
    },

    updateCartItem: async (
        productId: string,
        size: string,
        quantity: number,
        color?: string,
        variantImage?: string,
        sizeQuantities?: SizeQuantityPayload,
        sizeCounts?: SizeQuantityPayload
    ): Promise<Cart> => {
        const response = await api.put('/cart/update', {
            productId, size, quantity, color, variantImage, sizeQuantities, sizeCounts,
        });
        return response.data;
    },

    removeFromCart: async (productId: string, size: string, color?: string, variantImage?: string): Promise<Cart> => {
        const params = new URLSearchParams();
        if (color) params.set('color', color);
        if (variantImage) params.set('variantImage', variantImage);
        const query = params.toString();
        const url = `/cart/remove/${productId}/${size}${query ? `?${query}` : ''}`;
        const response = await api.delete(url);
        return response.data;
    },

    clearCart: async (): Promise<void> => {
        await api.delete('/cart/clear');
    },

    /** Validate cart before checkout. Returns false + message if invalid. */
    validateForCheckout: async (): Promise<{ valid: boolean; message?: string }> => {
        try {
            const availability = await cartService.getAvailability();
            if (availability._error) {
                return { valid: false, message: availability._error };
            }
            if (availability.hasExpiredReservations) {
                return { valid: false, message: 'Some of your reservations have expired. Your cart has been refreshed.' };
            }
            if (!availability.available) {
                const soldOut = availability.items.find((i) => i.soldOut);
                const unavailable = availability.items.find((i) => !i.available);
                if (soldOut) return { valid: false, message: 'A sold-out item is in your cart. Please remove it before checking out.' };
                if (unavailable) return { valid: false, message: unavailable.message || 'Some items have insufficient stock.' };
                return { valid: false, message: 'Some items in your cart are no longer available.' };
            }
            return { valid: true };
        } catch {
            return { valid: false, message: 'We could not verify your cart. Please refresh and try again.' };
        }
    },
};
