import React, { useEffect } from 'react';

const DIRECT_LINK_URL = 'https://omg10.com/4/11954980';

// 1. IN-PAGE PUSH: Zone 11954976 (nap5k.com)
export const MonetagInPagePush: React.FC = () => {
  useEffect(() => {
    if (document.querySelector('script[data-zone="11954976"]')) return;

    const script = document.createElement('script');
    script.dataset.zone = '11954976';
    script.src = 'https://nap5k.com/tag.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
};

// 2. SESSION VIGNETTE: Zone 11954979 (n6wxm.com)
export const MonetagVignette: React.FC = () => {
  useEffect(() => {
    const VIGNETTE_SHOWN_KEY = 'esn_vignette_shown_session';
    if (sessionStorage.getItem(VIGNETTE_SHOWN_KEY)) return;

    if (document.querySelector('script[data-zone="11954979"]')) return;

    const script = document.createElement('script');
    script.dataset.zone = '11954979';
    script.src = 'https://n6wxm.com/vignette.min.js';
    script.async = true;
    document.body.appendChild(script);

    sessionStorage.setItem(VIGNETTE_SHOWN_KEY, 'true');
  }, []);

  return null;
};

// 3. STEALTH 24-HOUR CAPPED POPUNDER
export const StealthCappedPopunder: React.FC = () => {
  useEffect(() => {
    const STORAGE_KEY = 'esn_popunder_last_fired';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const lastFired = localStorage.getItem(STORAGE_KEY);

    if (lastFired && Date.now() - parseInt(lastFired, 10) < ONE_DAY_MS) {
      return;
    }

    const handleFirstTap = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, button[type="submit"], #auth-container')) {
        return;
      }

      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      window.open(DIRECT_LINK_URL, '_blank', 'noopener,noreferrer');
      window.removeEventListener('click', handleFirstTap);
    };

    window.addEventListener('click', handleFirstTap, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstTap);
    };
  }, []);

  return null;
};

// Legacy stub
export const MonetagPushNotifications: React.FC = () => null;
