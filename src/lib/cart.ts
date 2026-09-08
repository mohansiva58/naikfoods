import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from './products';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color?: string; // Selected color name
  variantImage?: string;
}

interface CartStore {
  items: CartItem[];
  sessionId: string;
  reservationIds: string[];
  addItem: (product: Product, size: string, quantity?: number, variantImage?: string, color?: string) => boolean;
  removeItem: (productId: string, size: string, variantImage?: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, variantImage?: string, color?: string) => boolean;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setReservationIds: (ids: string[]) => void;
  clearReservations: () => void;
}

export const getProductId = (product: Product): string => {
  return product.productId || product.id || product._id || '';
};

const generateSessionId = () => `sess_${Math.random().toString(36).substring(2, 15)}`;

export const getCartItemImage = (item: CartItem): string => {
  return item.variantImage || item.product.image;
};

export const getCartLineKey = (productId: string, size: string, variantImage?: string, color?: string): string => {
  return `${productId}-${size}-${color || 'default'}-${variantImage || 'default'}`;
};

const getAvailableStockForSize = (product: Product, size: string): number | undefined => {
  if (product.sizeCounts && Object.prototype.hasOwnProperty.call(product.sizeCounts, size)) {
    const total = Number(product.sizeCounts[size] || 0);
    const reserved = Number(product.sizeReservedCounts?.[size] || 0);
    return Math.max(0, total - reserved);
  }

  // Without per-size counts, do not fall back to total stock — that allows
  // ordering more than one size's availability (e.g. 2× M when only 1 M left).
  return undefined;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),
      reservationIds: [],

      addItem: (product, size, quantity = 1, variantImage, color) => {
        const availableForSize = getAvailableStockForSize(product, size);
        if (availableForSize === undefined || availableForSize <= 0) {
          return false;
        }

        set((state) => {
          const productId = getProductId(product);
          const existingItem = state.items.find(
            (item) =>
              getProductId(item.product) === productId &&
              item.size === size &&
              item.color === color &&
              getCartItemImage(item) === (variantImage || product.image)
          );

          const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

          if (totalQuantity > availableForSize) {
            return state;
          }

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                getProductId(item.product) === productId &&
                item.size === size &&
                item.color === color &&
                getCartItemImage(item) === (variantImage || product.image)
                  ? { ...item, quantity: totalQuantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, size, quantity, color, variantImage }],
          };
        });
        return true;
      },

      removeItem: (productId, size, variantImage, color) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                getProductId(item.product) === productId &&
                item.size === size &&
                item.color === color &&
                (!variantImage || getCartItemImage(item) === variantImage)
              )
          ),
        }));
      },

      updateQuantity: (productId, size, quantity, variantImage, color) => {
        const state = get();
        const item = state.items.find(
          (item) =>
            getProductId(item.product) === productId &&
            item.size === size &&
            item.color === color &&
            (!variantImage || getCartItemImage(item) === variantImage)
        );

        if (!item) return false;

        const availableForSize = getAvailableStockForSize(item.product, size);
        if (availableForSize === undefined || quantity > availableForSize) {
          return false;
        }

        set((state) => ({
          items: state.items.map((item) =>
            getProductId(item.product) === productId &&
            item.size === size &&
            item.color === color &&
            (!variantImage || getCartItemImage(item) === variantImage)
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
        return true;
      },

      clearCart: () => {
        set({ items: [], reservationIds: [] });
      },

      setReservationIds: (ids: string[]) => {
        set({ reservationIds: ids });
      },

      clearReservations: () => {
        set({ reservationIds: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'sw_cart_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
