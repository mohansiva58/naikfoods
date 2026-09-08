import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { getCartSyncSignalKey, mergeLocalCartToServer, refreshLocalCartFromServer } from '@/lib/cartServerSync';

/**
 * When user signs in: prefer server cart if non-empty; otherwise push local cart to API.
 */
export function CartServerSync() {
  const { user, isAuthenticated, loading } = useAuth();
  const ranForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      ranForUid.current = null;
      return;
    }
    if (loading) return;

    if (ranForUid.current === user.uid) return;

    (async () => {
      try {
        await mergeLocalCartToServer();
        ranForUid.current = user.uid;
      } catch (e) {
        console.warn('Cart server sync skipped:', e);
      }
    })();
  }, [isAuthenticated, loading, user?.uid]);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid || loading) return;

    let refreshing = false;
    let pauseUntil = 0;
    let lastRefreshAt = 0;

    const refresh = async () => {
      if (refreshing || Date.now() < pauseUntil) return;
      if (Date.now() - lastRefreshAt < 5000) return;

      refreshing = true;
      lastRefreshAt = Date.now();
      try {
        await refreshLocalCartFromServer();
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 503)
        ) {
          pauseUntil = Date.now() + 30000;
        }
        console.warn('Cart refresh skipped:', error);
      } finally {
        refreshing = false;
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getCartSyncSignalKey()) {
        refresh();
      }
    };

    const handleFocus = () => {
      refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, loading, user?.uid]);

  return null;
}
