import React, { useEffect } from 'react';

const DIRECT_LINK_URL = 'https://omg10.com/4/11954980';

// 1. IN-PAGE PUSH (Zone: 11954976, Domain: nap5k.com)
// Floats unobtrusively like a native system notification. Counts genuine impressions per visitor.
export const MonetagInPagePush: React.FC = () => {
  useEffect(() => {
    if (document.querySelector('script[data-zone="11954976"]')) return;

    const script = document.createElement('script');
    script.dataset.zone = '11954976';
    script.src = 'https://nap5k.com/tag.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep script persistent during client-side navigation
    };
  }, []);

  return null;
};

// 2. VIGNETTE BANNER (Zone: 11954979, Domain: n6wxm.com)
// Session-capped dialog modal. Max once per browsing session.
export const MonetagVignette: React.FC = () => {
  useEffect(() => {
    const SESSION_KEY = 'esn_vignette_session_viewed';
    if (sessionStorage.getItem(SESSION_KEY)) return;

    if (document.querySelector('script[data-zone="11954979"]')) return;

    const script = document.createElement('script');
    script.dataset.zone = '11954979';
    script.src = 'https://n6wxm.com/vignette.min.js';
    script.async = true;
    document.body.appendChild(script);

    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  return null;
};

// 3. STEALTH 24-HOUR CAPPED POPUNDER
// Highest CPM format in East Africa ($1.00+). Strictly locked to ONCE every 24 hours per device.
export const StealthCappedPopunder: React.FC = () => {
  useEffect(() => {
    const STORAGE_KEY = 'esn_popunder_last_fired';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const lastFired = localStorage.getItem(STORAGE_KEY);

    // If already triggered within the past 24 hours, terminate early
    if (lastFired && Date.now() - parseInt(lastFired, 10) < ONE_DAY_MS) {
      return;
    }

    const handleFirstTap = (event: MouseEvent) => {
      // Do not interrupt critical admin or login interactions
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, button[type="submit"], #auth-container')) {
        return;
      }

      localStorage.setItem(STORAGE_KEY, Date.now().toString());

      // Open Monetag SmartLink in background tab
      window.open(DIRECT_LINK_URL, '_blank', 'noopener,noreferrer');

      // Immediately detach listener so no further clicks fire popunders
      window.removeEventListener('click', handleFirstTap);
    };

    window.addEventListener('click', handleFirstTap, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstTap);
    };
  }, []);

  return null;
};

// Legacy stub to prevent breaking external imports if any
export const MonetagPushNotifications: React.FC = () => null;
