import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSlowConnection, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline && !isSlowConnection) {
    return null;
  }

  if (isOnline && wasOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-md z-50 transition-all"
      >
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-200" />
          <span>Connection restored. Syncing live state automatically...</span>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="bg-red-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-md z-50 transition-all"
      >
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-red-200" />
          <span>You are currently offline. Dangerous mutations are paused to protect data integrity.</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 bg-red-700 hover:bg-red-800 px-2.5 py-1 rounded text-white text-[11px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none min-h-[32px] cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Retry Connection
        </button>
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between shadow-xs z-50"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
          <span>Slow network connection detected. Async requests may take longer than usual.</span>
        </div>
      </div>
    );
  }

  return null;
};
