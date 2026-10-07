import React, { useEffect } from 'react';

export const DIRECT_LINK_URL = 'https://omg10.com/4/11954980';
const STORAGE_CLICK_COUNT = 'esn_popunder_clicks';
const STORAGE_LAST_FIRED_CLICK = 'esn_popunder_last_fired_click';
const STORAGE_LAST_FIRED_TIME = 'esn_popunder_last_fired_time';
const CLICKS_PER_POPUNDER = 10; // Exactly 1 popunder per 10 clicks
const MIN_COOLDOWN_MS = 45 * 1000; // 45-second spacing minimum

/**
 * Centrally manages popunder ads strictly adhering to:
 * 1. 1 popunder every 10 clicks.
 * 2. Minimum 45-second cooldown (no firing each second).
 * 3. Never interrupts typing in inputs, textareas, auth gates, or clicking close buttons.
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

  const rawClicks = parseInt(sessionStorage.getItem(STORAGE_CLICK_COUNT) || '0', 10);
  const currentClicks = rawClicks + 1;
  sessionStorage.setItem(STORAGE_CLICK_COUNT, currentClicks.toString());

  const lastFiredClick = parseInt(sessionStorage.getItem(STORAGE_LAST_FIRED_CLICK) || '0', 10);
  const lastFiredTime = parseInt(sessionStorage.getItem(STORAGE_LAST_FIRED_TIME) || '0', 10);
  const now = Date.now();

  // Rule 1: Exactly 1 per 10 clicks
  const clicksSinceLast = currentClicks - lastFiredClick;
  if (clicksSinceLast < CLICKS_PER_POPUNDER) {
    return false;
  }

  // Rule 2: Cooldown check to prevent rapid firing in the same second/minute
  if (lastFiredTime > 0 && now - lastFiredTime < MIN_COOLDOWN_MS) {
    return false;
  }

  // Record fired markers
  sessionStorage.setItem(STORAGE_LAST_FIRED_CLICK, currentClicks.toString());
  sessionStorage.setItem(STORAGE_LAST_FIRED_TIME, now.toString());

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
