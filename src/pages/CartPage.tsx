import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, ChevronLeft, Clock, AlertTriangle, RefreshCw, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore, getProductId, getCartItemImage, getCartLineKey } from '@/lib/cart';
import { useAuth } from '@/hooks/useAuth';
import { cartService, CartAvailabilityItem } from '@/services/cartService';
import { applyServerCartToLocalWithStock, notifyCartChangedAcrossTabs, refreshLocalCartFromServer } from '@/lib/cartServerSync';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import { toast } from 'sonner';

// ─── Reservation countdown hook ────────────────────────────────────────────────
function useReservationCountdown(expiresAt: string | undefined) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) { setSeconds(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return seconds;
}

// ─── Countdown badge component ─────────────────────────────────────────────────
function ReservationBadge({ expiresAt }: { expiresAt: string }) {
  const seconds = useReservationCountdown(expiresAt);
  if (seconds <= 0) return null;

  const color =
    seconds > 120 ? 'text-green-700 border-green-200 bg-green-50'
    : seconds > 30  ? 'text-amber-700 border-amber-200 bg-amber-50'
    :                 'text-red-700 border-red-200 bg-red-50 animate-pulse';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      <Clock size={10} />
      Reserved {mins}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart, reservationIds } = useCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useRealTimeStock();

  // availabilityMap: productId-size -> CartAvailabilityItem (backend source of truth)
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, CartAvailabilityItem>>({});
  const [loadingStock, setLoadingStock] = useState(false);
  const [checkoutValidating, setCheckoutValidating] = useState(false);
  const [adjustedBanner, setAdjustedBanner] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  // Earliest reservation expiry across all cart lines (for top banner)
  const earliestExpiry = Object.values(availabilityMap)
    .map((a) => (a as CartAvailabilityItem & { reservationExpiresAt?: string }).reservationExpiresAt)
    .filter(Boolean)
    .sort()[0];

  const refreshAvailability = useCallback(async () => {
    if (!isAuthenticated || items.length === 0 || refreshingRef.current) return;
    refreshingRef.current = true;
    setLoadingStock(true);
    try {
      const avail = await cartService.getAvailability();

      if (avail._error) {
        // Soft failure — don't crash the page, show inline retry
        return;
      }

      const map: Record<string, CartAvailabilityItem> = {};
      for (const row of avail.items) {
        map[`${row.productId}-${row.size}`] = row;
      }
      setAvailabilityMap(map);

      // Auto-correct quantities that exceed availableToBuy
      let anyAdjusted = false;
      for (const row of avail.items) {
        if (row.available) continue;
        if (row.soldOut) continue; // handled by UI card
        // Reduce quantity to what's available
        if (row.availableToBuy > 0 && row.quantity > row.availableToBuy) {
          try {
            const cart = await cartService.updateCartItem(
              row.productId, row.size, row.availableToBuy, row.color
            );
            await applyServerCartToLocalWithStock(cart);
            notifyCartChangedAcrossTabs();
            anyAdjusted = true;
          } catch { /* silent */ }
        }
      }

      if (anyAdjusted) {
        setAdjustedBanner('Some quantities were adjusted to match available stock.');
        setTimeout(() => setAdjustedBanner(null), 6000);
      }

      // If expired reservations, refresh the cart from server silently
      if (avail.hasExpiredReservations) {
        await refreshLocalCartFromServer();
        notifyCartChangedAcrossTabs();
      }
    } catch {
      // Network error — don't block the page
    } finally {
      setLoadingStock(false);
      refreshingRef.current = false;
    }
  }, [isAuthenticated, items.length]);

  useEffect(() => { refreshAvailability(); }, [refreshAvailability]);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, []);

  // ── Cart actions ─────────────────────────────────────────────────────────────

  const handleRemoveItem = async (productId: string, size: string, variantImage?: string, color?: string) => {
    if (!isAuthenticated) {
      removeItem(productId, size, variantImage, color);
      return;
    }
    try {
      const cart = await cartService.removeFromCart(productId, size, color, variantImage);
      await applyServerCartToLocalWithStock(cart);
      notifyCartChangedAcrossTabs();
      await refreshAvailability();
    } catch {
      toast.error('Failed to remove item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (
    productId: string, size: string, newQty: number, variantImage?: string, color?: string
  ) => {
    if (newQty <= 0) {
      await handleRemoveItem(productId, size, variantImage, color);
      return;
    }

    const lineKey = `${productId}-${size}`;
    const avail = availabilityMap[lineKey];

    // Immediately block if we know max from backend
    if (avail && newQty > avail.availableToBuy) {
      toast.error(`Only ${avail.availableToBuy} item${avail.availableToBuy === 1 ? '' : 's'} available.`);
      return;
    }

    if (!isAuthenticated) {
      updateQuantity(productId, size, newQty, variantImage, color);
      return;
    }

    try {
      const cart = await cartService.updateCartItem(productId, size, newQty, color, variantImage);
      const meta = (cart as typeof cart & { _meta?: { adjusted?: boolean; adjustedMessage?: string } })._meta;
      await applyServerCartToLocalWithStock(cart);
      notifyCartChangedAcrossTabs();

      if (meta?.adjusted && meta.adjustedMessage) {
        setAdjustedBanner(meta.adjustedMessage);
        setTimeout(() => setAdjustedBanner(null), 6000);
      }

      await refreshAvailability();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Unable to update quantity. Please try again.');
      await refreshAvailability();
    }
  };

  const handleClearCart = async () => {
    if (!isAuthenticated) { clearCart(); return; }
    try {
      await cartService.clearCart();
      clearCart();
      notifyCartChangedAcrossTabs();
    } catch {
      toast.error('Failed to clear cart. Please try again.');
    }
  };

  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/', { state: { from: '/checkout', requireAuth: true } });
      return;
    }

    setCheckoutValidating(true);
    try {
      const validation = await cartService.validateForCheckout();
      if (!validation.valid) {
        toast.error(validation.message || 'Please review your cart before checking out.');
        await refreshAvailability();
        return;
      }
      navigate('/checkout');
    } catch {
      toast.error('Unable to validate your cart. Please refresh and try again.');
    } finally {
      setCheckoutValidating(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────────

  const subtotal = getTotalPrice();
  const hasOutOfStockItems = Object.values(availabilityMap).some((a) => a.soldOut);
  const hasUnavailableItems = Object.values(availabilityMap).some((a) => !a.available && !a.soldOut);
  const checkoutBlocked = hasOutOfStockItems;
  // Use the hook so the countdown updates every second via interval (not stale per-render)
  const expiryCountdown = useReservationCountdown(earliestExpiry);

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart size={40} className="text-muted-foreground" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Your cart is empty</h1>
              <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
              <Link to="/shop">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary inline-flex items-center gap-2">
                  Start Shopping <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Back link */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={18} /> Continue Shopping
            </Link>
          </motion.div>

          {/* ── Auto-adjusted banner ─────────────────────────────────────── */}
          <AnimatePresence>
            {adjustedBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200"
              >
                <RefreshCw size={16} className="mt-0.5 flex-shrink-0" />
                <span><strong>Cart updated.</strong> {adjustedBanner}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Reservation countdown banner ─────────────────────────────── */}
          {expiryCountdown > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={`mb-4 flex items-center gap-3 rounded-xl border px-5 py-4 text-sm font-medium ${
                expiryCountdown > 120
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200'
                  : expiryCountdown > 30
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200'
                  : 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/20 dark:text-red-200 animate-pulse'
              }`}
            >
              <Clock size={16} className="flex-shrink-0" />
              <span>
                {expiryCountdown > 120
                  ? <>Items reserved for you — <strong>{Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, '0')}</strong> remaining.</>
                  : expiryCountdown > 30
                  ? <>⚠️ Your reservation expires in <strong>{Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, '0')}</strong> — proceed to checkout now.</>
                  : <>🔴 Reservation expires in <strong>{expiryCountdown}s</strong>. Complete checkout immediately or items will be released.</>
                }
              </span>
            </motion.div>
          )}

          {/* ── Out-of-stock warning ─────────────────────────────────────── */}
          {hasOutOfStockItems && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200"
            >
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
              <span>
                <strong>Some items sold out.</strong> Remove them to proceed to checkout.
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <h1 className="font-serif text-4xl font-bold text-foreground">
              Shopping Cart ({items.length})
            </h1>

            <button
              onClick={handleClearCart}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-100 hover:border-red-300 hover:text-red-800"
            >
              <Trash2 size={16} />
              Clear Cart
            </button>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Cart Items ────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const productId = getProductId(item.product);
                  const itemImage = getCartItemImage(item);
                  const lineKey = `${productId}-${item.size}`;
                  const avail = availabilityMap[lineKey];
                  const availableToBuy = avail?.availableToBuy;
                  const soldOut = avail?.soldOut ?? false;
                  const atMax = availableToBuy !== undefined && item.quantity >= availableToBuy;
                  const lowStock = availableToBuy !== undefined && availableToBuy > 0 && availableToBuy <= 5;
                  const reservationExpiry = (avail as (CartAvailabilityItem & { reservationExpiresAt?: string }) | undefined)?.reservationExpiresAt;

                  return (
                    <motion.div
                      key={getCartLineKey(productId, item.size, itemImage)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={`rounded-xl p-4 shadow-sm border transition-colors ${
                        soldOut ? 'bg-red-50 border-red-200 dark:bg-red-950/10 dark:border-red-800'
                        : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <Link to={`/product/${productId}`}>
                          <div className={`w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 ${soldOut ? 'opacity-50 grayscale' : 'bg-secondary'}`}>
                            <img src={itemImage} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.product.category}</p>
                              <Link to={`/product/${productId}`}>
                                <h3 className="font-serif font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                                  {item.product.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">Size: {item.size}</p>
                              {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}

                              {/* Stock / reservation status */}
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {soldOut && (
                                  <span className="text-xs font-semibold text-red-600">⚠️ This item sold out while in your cart</span>
                                )}
                                {!soldOut && lowStock && (
                                  <span className="text-xs font-medium text-amber-600">Only {availableToBuy} left</span>
                                )}
                                {!soldOut && reservationExpiry && (
                                  <ReservationBadge expiresAt={reservationExpiry} />
                                )}
                              </div>
                            </div>

                            {/* Remove button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRemoveItem(productId, item.size, itemImage, item.color)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 font-medium text-sm whitespace-nowrap flex-shrink-0"
                            >
                              <Trash2 size={14} />
                              <span className="hidden sm:inline">Remove</span>
                            </motion.button>
                          </div>

                          {/* Sold-out action row */}
                          {soldOut ? (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleRemoveItem(productId, item.size, itemImage, item.color)}
                                className="flex-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors"
                              >
                                Remove Item
                              </button>
                              <Link
                                to="/shop"
                                className="flex-1 text-xs font-semibold text-center border border-border rounded-lg py-2 hover:bg-secondary transition-colors"
                              >
                                Continue Shopping
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-4">
                              {/* Quantity stepper */}
                              <div className="flex items-center gap-2 bg-secondary rounded-full p-1">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleUpdateQuantity(productId, item.size, item.quantity - 1, itemImage, item.color)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
                                >
                                  <Minus size={14} />
                                </motion.button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleUpdateQuantity(productId, item.size, item.quantity + 1, itemImage, item.color)}
                                  disabled={atMax || loadingStock}
                                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={atMax ? `Maximum available: ${availableToBuy}` : undefined}
                                >
                                  <Plus size={14} />
                                </motion.button>
                              </div>
                              <p className="font-semibold text-foreground">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

            </div>

            {/* ── Order Summary ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <div className="bg-secondary rounded-2xl p-6 sticky top-28">
                <h2 className="font-serif text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <motion.span key={subtotal} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
                        ₹{subtotal.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: checkoutBlocked ? 1 : 1.02 }}
                  whileTap={{ scale: checkoutBlocked ? 1 : 0.98 }}
                  onClick={handleProceedToCheckout}
                  disabled={checkoutBlocked || checkoutValidating || items.length === 0}
                  className="w-full btn-primary mt-6 py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkoutValidating ? (
                    <><RefreshCw size={16} className="animate-spin" /> Checking availability…</>
                  ) : checkoutBlocked ? (
                    'Remove sold-out items to checkout'
                  ) : (
                    <><ShoppingBag size={16} /> Proceed to Checkout</>
                  )}
                </motion.button>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Secure Payment</p>
                  <div className="flex justify-center gap-2 text-muted-foreground text-xs">
                    <span className="px-2 py-1 bg-background rounded">UPI</span>
                    <span className="px-2 py-1 bg-background rounded">Cards</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
