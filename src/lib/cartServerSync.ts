import { cartService, Cart, ServerCartItem } from '@/services/cartService';
import { productService } from '@/services/productService';
import { useCartStore, getProductId, getCartItemImage, type CartItem } from '@/lib/cart';
import type { Product } from '@/lib/products';
import axios from 'axios';

const CART_SYNC_SIGNAL_KEY = 'sw_cart_sync_signal';

function serverLineKey(productId: string, size: string, color?: string, image?: string) {
  return `${productId}:${size}:${color || ''}:${image || 'default'}`;
}

function collectProductIds(product: Product): string[] {
  const ids = new Set<string>();
  if (product.productId) ids.add(product.productId);
  if (product.id) ids.add(product.id);
  if (product._id) ids.add(String(product._id));
  return [...ids];
}

function serverLineMatchesLocal(serverItem: ServerCartItem, localRow: CartItem): boolean {
  const localIds = collectProductIds(localRow.product);
  if (!localIds.includes(serverItem.productId)) return false;
  if (serverItem.size !== localRow.size) return false;
  return (serverItem.color || '') === (localRow.color || '');
}

function getServerQuantityForLocal(serverItems: ServerCartItem[], localRow: CartItem): number {
  return serverItems
    .filter((item) => serverLineMatchesLocal(item, localRow))
    .reduce((sum, item) => sum + item.quantity, 0);
}

function serverLineToProduct(line: ServerCartItem, maxAvailable?: number): Product {
  const available = maxAvailable ?? line.quantity;
  return {
    productId: line.productId,
    id: line.productId,
    name: line.name,
    price: line.price,
    image: line.image,
    category: 'Catalog',
    sizes: [line.size],
    description: '',
    rating: 0,
    reviews: 0,
    stock: available,
    sizeCounts: { [line.size]: available },
    sizeReservedCounts: { [line.size]: 0 },
  };
}

async function fetchStockLimits(items: ServerCartItem[]) {
  const limits = new Map<string, number>();
  if (!items.length) return limits;

  try {
    const availability = await cartService.getAvailability();
    if (!availability._error) {
      for (const row of availability.items) {
        limits.set(`${row.productId}-${row.size}`, row.availableToBuy);
      }
      return limits;
    }
  } catch {
    // Guest carts or auth failures — fall back to public stock check.
  }

  try {
    const result = await productService.checkStockAvailability(
      items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      }))
    );
    for (const row of result.items) {
      limits.set(`${row.productId}-${row.size}`, row.maxAvailable);
    }
  } catch {
    // No limits available — caller falls back gracefully.
  }

  return limits;
}

export function applyServerCartToLocal(cart: Cart | null | undefined, stockLimits?: Map<string, number>) {
  const store = useCartStore.getState();
  store.clearCart();

  for (const item of cart?.items || []) {
    const maxAvailable = stockLimits?.get(`${item.productId}-${item.size}`);
    const safeQuantity =
      maxAvailable !== undefined ? Math.min(item.quantity, Math.max(0, maxAvailable)) : item.quantity;

    if (safeQuantity <= 0) continue;

    store.addItem(
      serverLineToProduct(item, maxAvailable),
      item.size,
      safeQuantity,
      item.variantImage || item.image,
      item.color
    );
  }
}

export async function applyServerCartToLocalWithStock(cart: Cart | null | undefined) {
  const stockLimits = await fetchStockLimits(cart?.items || []);
  applyServerCartToLocal(cart, stockLimits);
  return stockLimits;
}

function buildServerQuantityMap(items: ServerCartItem[] = []) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    const key = serverLineKey(item.productId, item.size, item.color, item.variantImage || item.image);
    quantities.set(key, (quantities.get(key) || 0) + item.quantity);
  }
  return quantities;
}

export async function mergeLocalCartToServer() {
  const localItems = useCartStore.getState().items;
  const serverCart = await cartService.getCart();
  const serverQuantities = buildServerQuantityMap(serverCart.items);

  if (!localItems.length) {
    if (serverCart.items?.length) {
      await applyServerCartToLocalWithStock(serverCart);
    }
    return serverCart;
  }

  for (const row of localItems) {
    const pid = getProductId(row.product);
    const image = getCartItemImage(row);
    const serverQty = getServerQuantityForLocal(serverCart.items, row);
    const delta = row.quantity - serverQty;

    if (delta > 0) {
      try {
        await cartService.addToCart(pid, row.size, delta, image, row.color);
        const key = serverLineKey(pid, row.size, row.color, image);
        serverQuantities.set(key, serverQty + delta);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            useCartStore.getState().removeItem(pid, row.size, image, row.color);
            continue;
          }
          if (error.response?.status === 400) {
            continue;
          }
        }
        throw error;
      }
    } else if (delta < 0) {
      try {
        await cartService.updateCartItem(pid, row.size, row.quantity, row.color, image);
        const key = serverLineKey(pid, row.size, row.color, image);
        serverQuantities.set(key, row.quantity);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          continue;
        }
        throw error;
      }
    }
  }

  const refreshed = await cartService.getCart();
  await applyServerCartToLocalWithStock(refreshed);
  return refreshed;
}

/** @deprecated Use mergeLocalCartToServer */
export async function ensureLocalCartSyncedToServer() {
  return mergeLocalCartToServer();
}

export async function refreshLocalCartFromServer() {
  const cart = await cartService.getCart();
  await applyServerCartToLocalWithStock(cart);
  return cart;
}

export function notifyCartChangedAcrossTabs() {
  try {
    localStorage.setItem(CART_SYNC_SIGNAL_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures; the active tab still updates immediately.
  }
}

export function getCartSyncSignalKey() {
  return CART_SYNC_SIGNAL_KEY;
}
