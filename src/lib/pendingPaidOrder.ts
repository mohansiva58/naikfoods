import { CreateOrderData } from '@/services/orderService';

const PENDING_PAID_ORDER_KEY = 'Naikfoods_pending_paid_order_v1';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export type PendingPaidOrder = CreateOrderData & {
  savedAt: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
};

export const savePendingPaidOrder = (order: CreateOrderData) => {
  localStorage.setItem(
    PENDING_PAID_ORDER_KEY,
    JSON.stringify({ ...order, savedAt: Date.now() })
  );
};

export const getPendingPaidOrder = (): PendingPaidOrder | null => {
  try {
    const raw = localStorage.getItem(PENDING_PAID_ORDER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingPaidOrder;

    // Auto-clear if older than MAX_AGE_MS
    if (parsed.savedAt && Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(PENDING_PAID_ORDER_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(PENDING_PAID_ORDER_KEY);
    return null;
  }
};

export const clearPendingPaidOrder = () => {
  localStorage.removeItem(PENDING_PAID_ORDER_KEY);
};
