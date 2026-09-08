import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './products';

interface WishlistStore {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
}

const getProductId = (product: Product): string => {
    return product.productId || product.id || product._id || '';
};

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product) => {
                const productId = getProductId(product);
                const exists = get().items.some((item) => getProductId(item) === productId);

                if (!exists) {
                    set((state) => ({
                        items: [...state.items, product],
                    }));
                }
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => getProductId(item) !== productId),
                }));
            },

            isInWishlist: (productId) => {
                return get().items.some((item) => getProductId(item) === productId);
            },

            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: 'wishlist-storage',
        }
    )
);
