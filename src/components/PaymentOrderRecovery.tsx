import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orderService';
import { clearPendingPaidOrder, getPendingPaidOrder } from '@/lib/pendingPaidOrder';
import { useCartStore } from '@/lib/cart';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Max age for a pending paid order before we give up recovering it
const MAX_PENDING_AGE_MS = 30 * 60 * 1000; // 30 minutes

export function PaymentOrderRecovery() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const running = useRef(false);

  useEffect(() => {
    // Skip recovery if the user is in the active checkout, processing, success, or fail screens.
    // The active page flow (e.g. useRazorpayCheckout) handles these pages directly.
    if (['/checkout', '/processing', '/order-success', '/payment-failed'].includes(location.pathname)) {
      return;
    }

    // Don't run while auth is resolving or if not logged in
    if (loading || !isAuthenticated || running.current) return;

    const pendingOrder = getPendingPaidOrder();

    // No pending order at all
    if (!pendingOrder?.razorpayPaymentId) return;

    // Check if the pending order is too old (stale) — clear it silently
    const ageMs = Date.now() - (pendingOrder.savedAt || 0);
    if (ageMs > MAX_PENDING_AGE_MS) {
      console.warn('[PaymentOrderRecovery] Stale pending order, discarding:', pendingOrder.razorpayPaymentId);
      clearPendingPaidOrder();
      return;
    }

    running.current = true;

    (async () => {
      let createdOrderId: string | null = null;

      for (const delay of [0, 1500, 3000, 6000, 10000]) {
        if (delay) await wait(delay);
        try {
          const result = await orderService.createOrder(pendingOrder);
          createdOrderId = result.order.orderId;
          break;
        } catch (error: unknown) {
          const axiosErr = error as { response?: { status?: number } };
          // 409 Conflict = order already exists (idempotency key hit) — treat as success
          if (axiosErr?.response?.status === 409) {
            break;
          }
          // 401 = auth token expired. Stop retrying.
          if (axiosErr?.response?.status === 401) {
            console.warn('[PaymentOrderRecovery] Auth expired, stopping recovery');
            break;
          }
          console.error('Pending paid order recovery attempt failed:', error);
        }
      }

      if (!createdOrderId) {
        try {
          const recentOrders = await orderService.getOrders({ limit: 1 });
          const latestOrder = Array.isArray(recentOrders?.orders)
            ? recentOrders.orders[0]
            : Array.isArray(recentOrders)
              ? recentOrders[0]
              : null;
          const isMatch = latestOrder && (
            latestOrder.razorpayPaymentId === pendingOrder.razorpayPaymentId ||
            latestOrder.razorpayOrderId === pendingOrder.razorpayOrderId
          );
          // Only use this order if it was created very recently (within last 5 min) and matches the pending transaction
          if (latestOrder?.orderId && latestOrder?.createdAt && isMatch) {
            const createdAgo = Date.now() - new Date(latestOrder.createdAt).getTime();
            if (createdAgo < 5 * 60 * 1000) {
              createdOrderId = latestOrder.orderId;
            }
          }
        } catch (error) {
          console.error('Pending paid order reconciliation failed:', error);
        }
      }

      if (createdOrderId) {
        clearPendingPaidOrder();
        useCartStore.getState().clearCart();
        toast.success(`Order ${createdOrderId} placed successfully.`);
        navigate('/orders', { replace: true });
      } else {
        // Could not recover — clear the stale data so we stop retrying
        clearPendingPaidOrder();
        toast.error('We could not confirm your order. Please check your orders page or contact support.', {
          duration: 8000,
        });
      }

      running.current = false;
    })();
  }, [isAuthenticated, loading, navigate]);

  return null;
}
