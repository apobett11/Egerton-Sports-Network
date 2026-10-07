import { useCallback } from 'react';

const DIRECT_LINK_URL = 'https://omg10.com/4/11954980';
const SESSION_POPS_KEY = 'esn_news_tactical_pops';
const LAST_POP_TIME_KEY = 'esn_news_last_tactical_time';
const MAX_POPS_LIMIT = 3;
const COOLDOWN_INTERVAL_MS = 45 * 1000; // 45-second spacing minimum

export function useNewsTacticalPopunder() {
  const triggerTacticalPause = useCallback((eventContext: string) => {
    if (typeof window === 'undefined') return;

    const count = parseInt(sessionStorage.getItem(SESSION_POPS_KEY) || '0', 10);
    const lastTrigger = parseInt(sessionStorage.getItem(LAST_POP_TIME_KEY) || '0', 10);
    const now = Date.now();

    // Verification check: Respect limit and spacing
    if (count >= MAX_POPS_LIMIT) return;
    if (now - lastTrigger < COOLDOWN_INTERVAL_MS) return;

    sessionStorage.setItem(SESSION_POPS_KEY, (count + 1).toString());
    sessionStorage.setItem(LAST_POP_TIME_KEY, now.toString());

    // Execute background tab cleanly on legitimate user intent
    try {
      const openedTab = window.open(DIRECT_LINK_URL, '_blank', 'noopener,noreferrer');
      if (openedTab) {
        openedTab.blur();
        window.focus();
      }
    } catch {
      // Graceful fallback if suppressed by aggressive local browser policies
    }
  }, []);

  return { triggerTacticalPause };
}
