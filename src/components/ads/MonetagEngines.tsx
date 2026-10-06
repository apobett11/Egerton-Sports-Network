import React, { useEffect } from 'react';

// 1. In-Page Push (Disabled: Notifications channel is strictly reserved for official EgerScore alerts, never ad networks)
export const MonetagInPagePush: React.FC = () => {
  useEffect(() => {
    // Actively remove any Monetag in-page push scripts/elements if injected
    document.querySelectorAll('script[src*="nap5k.com"], script[data-zone="11954976"], [class*="asb-"], .monetag-ipp, div[id^="asb-"]').forEach((el) => {
      el.remove();
    });
  }, []);

  return null;
};

// 2. Push Notifications (Disabled: Notifications are strictly reserved for official in-app alerts, never ad networks)
export const MonetagPushNotifications: React.FC = () => {
  useEffect(() => {
    // Actively remove any Monetag push notification scripts if previously injected
    document.querySelectorAll('script[src*="z=11954199"], script[src*="5gvci.com"]').forEach((s) => s.remove());
  }, []);

  return null;
};

// 3. Vignette Banner (Zone: 11954979)
export const MonetagVignette: React.FC = () => {
  useEffect(() => {
    if (document.querySelector('script[data-zone="11954979"]')) return;
    const script = document.createElement('script');
    script.dataset.zone = '11954979';
    script.src = 'https://n6wxm.com/vignette.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
};
