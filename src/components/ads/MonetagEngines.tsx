import React, { useEffect } from 'react';

export const DIRECT_LINK_URL = 'https://omg10.com/4/11954980';

// Per page-load tracking (resets on page open or reload)
let pageLoadClicks = 0;
let lastFiredClick = 0;
let lastFiredTime = 0;

const FIRST_POPUNDER_CLICKS = 5; // 5 clicks after opening / reloading the page
const SUBSEQUENT_INTERVAL_CLICKS = 15; // Then every 15 clicks thereafter (optimal UX & monetization balance)
const MIN_COOLDOWN_MS = 25 * 1000; // 25-second spacing minimum to prevent rapid clicks in same second

/**
 * Centrally manages popunder ads strictly adhering to:
 * 1. 1st popunder fires on the 5th click after page open/reload.
 * 2. Subsequent popunders fire every 15 clicks thereafter (e.g. click 5, 20, 35, 50...).
 * 3. Minimum 25-second cooldown (no firing each second).
 * 4. Never interrupts typing in inputs, textareas, auth gates, or clicking close buttons.
 */
export function registerUserClickAndTriggerPopunder(event?: MouseEvent): boolean {
  if (typeof window === 'undefined') return false;

  // Protect sensitive targets and close buttons
  if (event?.target) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'input, textarea, select, button[type="submit"], #auth-container, [data-prevent-popunder="true"], button[aria-label*="close" i], button[aria-label*="dismiss" i]'
      )
    ) {
      return false;
    }
  }

  pageLoadClicks += 1;
  const now = Date.now();

  // Rule 1: First popunder at 5 clicks after page open/reload
  if (lastFiredClick === 0) {
    if (pageLoadClicks < FIRST_POPUNDER_CLICKS) {
      return false;
    }
  } else {
    // Rule 2: Subsequent popunders every 15 clicks (e.g. 5 + 15 = 20, 20 + 15 = 35...)
    const clicksSinceLast = pageLoadClicks - lastFiredClick;
    if (clicksSinceLast < SUBSEQUENT_INTERVAL_CLICKS) {
      return false;
    }
  }

  // Rule 3: Cooldown check to prevent rapid firing in the same second/minute
  if (lastFiredTime > 0 && now - lastFiredTime < MIN_COOLDOWN_MS) {
    return false;
  }

  // Record fired markers
  lastFiredClick = pageLoadClicks;
  lastFiredTime = now;

  // Execute popunder cleanly in a background tab
  try {
    const openedTab = window.open(DIRECT_LINK_URL, '_blank', 'noopener,noreferrer');
    if (openedTab) {
      openedTab.blur();
      window.focus();
    }
    return true;
  } catch {
    return false;
  }
}

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

// 3. CONTROLLED 10-CLICK POPUNDER
export const StealthCappedPopunder: React.FC = () => {
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      registerUserClickAndTriggerPopunder(event);
    };

    window.addEventListener('click', handleDocumentClick, { passive: true });

    return () => {
      window.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return null;
};

// Legacy stub
export const MonetagPushNotifications: React.FC = () => null;
