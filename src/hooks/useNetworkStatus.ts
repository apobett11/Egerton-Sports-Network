import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
  rtt: number | null;
  wasOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Auto-clear wasOffline tag after 4s banner feedback
      setTimeout(() => setWasOffline(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Network Information API if available in modern browsers
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    const updateConnectionStatus = () => {
      if (connection) {
        setEffectiveType(connection.effectiveType || null);
        setRtt(connection.rtt ?? null);
      }
    };

    if (connection) {
      updateConnectionStatus();
      connection.addEventListener?.('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener?.('change', updateConnectionStatus);
      }
    };
  }, []);

  const isSlowConnection =
    !isOnline || effectiveType === 'slow-2g' || effectiveType === '2g' || (rtt !== null && rtt > 1500);

  return {
    isOnline,
    isSlowConnection,
    effectiveType,
    rtt,
    wasOffline,
  };
}
