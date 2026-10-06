import React, { useEffect } from 'react';

// 1. In-Page Push (Zone: 11954976)
export const MonetagInPagePush: React.FC = () => {
  useEffect(() => {
    const purgeMpesa = () => {
      document.querySelectorAll('[class*="asb-"], .monetag-ipp, div[id^="asb-"]').forEach((el) => {
        if (/m-?pesa/i.test(el.textContent || '')) {
          el.remove();
        }
      });
    };
    const observer = new MutationObserver(purgeMpesa);
    observer.observe(document.body, { childList: true, subtree: true });

    if (document.querySelector('script[data-zone="11954976"]')) return;
    const script = document.createElement('script');
    script.dataset.zone = '11954976';
    script.src = 'https://nap5k.com/tag.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      observer.disconnect();
      script.remove();
      document.querySelectorAll('[class*="asb-"], .monetag-ipp').forEach((el) => el.remove());
    };
  }, []);

  return null;
};

// 2. Push Notifications (Zone: 11954199)
export const MonetagPushNotifications: React.FC = () => {
  useEffect(() => {
    if (document.querySelector('script[src*="z=11954199"]')) return;
    const script = document.createElement('script');
    script.src = 'https://5gvci.com/act/files/tag.min.js?z=11954199';
    script.setAttribute('data-cfasync', 'false');
    script.async = true;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
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
