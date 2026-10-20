import React, { useEffect, useState, useRef } from 'react';

const VIGNETTE_ZONE = '11954979';
const VIGNETTE_SCRIPT_URL = 'https://n6wxm.com/vignette.min.js';
const DWELL_TIME_MS = 2500;       // 2.5 seconds auto-dismissal after new page load
const MAX_FALLBACK_MS = 5200;     // 5.2 seconds hard safety timeout
const VIGNETTE_INTERVAL_MS = 90 * 1000; // 1.5 minutes (90 seconds) interval
const LAST_VIGNETTE_TIME_KEY = 'esn_last_vignette_time';

// Paced Vignette Pacing: Exactly one every 1.5 minutes (90,000 ms)
export const isPacedVignetteTarget = (lastFiredTime: number, now: number): boolean => {
  return now - lastFiredTime >= VIGNETTE_INTERVAL_MS;
};

export const TransitionVignetteManager: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTransitionTimeRef = useRef<number>(0);
  const lastRouteKeyRef = useRef<string>('');

  useEffect(() => {
    // Inject custom styling for Monetag vignette overlays to match ESN dark aesthetic
    const styleId = 'esn-vignette-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        div[id*="vignette"],
        div[class*="vignette"],
        div[class*="vignette-overlay"],
        div[class*="vignette-container"] {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          transition: opacity 0.25s ease-in-out !important;
        }
        div[id*="vignette"] > div,
        div[class*="vignette"] > div {
          border-radius: 16px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 24px rgba(59, 130, 246, 0.15) !important;
          overflow: hidden !important;
        }
        iframe[src*="n6wxm"] {
          border-radius: 12px !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Helper: Purge vignette overlays and restore document scroll
    const autoDismissVignette = () => {
      // 1. Programmatically trigger Monetag native close buttons if rendered
      const closeButtons = document.querySelectorAll<HTMLElement>(
        '[class*="vignette"] button, [class*="vignette"] [class*="close"], [id*="vignette"] button, button[aria-label="Close"], [class*="close-btn"], [class*="close_button"]'
      );
      if (closeButtons.length > 0) {
        closeButtons.forEach((btn) => {
          try {
            btn.click();
          } catch {}
        });
      }

      // 2. Remove injected overlay cards, backdrop divs, and Monetag iframes
      document.querySelectorAll(
        'div[id*="vignette"], [class*="vignette-overlay"], [class*="vignette-container"], iframe[src*="n6wxm"], div[class*="backdrop"]'
      ).forEach((node) => {
        try {
          node.remove();
        } catch {}
      });

      // 3. Remove script tag so subsequent paced triggers can cleanly reload
      const script = document.querySelector<HTMLScriptElement>(`script[data-zone="${VIGNETTE_ZONE}"]`);
      if (script) {
        try {
          script.remove();
        } catch {}
      }

      // 4. Unlock document body scroll and restore page responsiveness
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('pointer-events');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      setIsActive(false);

      // Trigger fresh In-Page Push for the new route
      window.dispatchEvent(new CustomEvent('esn_refresh_inpage_push'));
    };

    const isAdminActive = (): boolean => {
      if (typeof document === 'undefined') return false;
      if (document.body.getAttribute('data-admin-product-active') === 'true') return true;
      if (document.querySelector('[data-admin-modal="true"], [data-admin-product="true"]')) return true;
      if (sessionStorage.getItem('egerscore_store_current_admin') || localStorage.getItem('egerscore_store_current_admin')) return true;
      if (typeof window !== 'undefined' && (window.location.hash.includes('admin') || window.location.pathname.includes('admin'))) return true;
      return false;
    };

    const firePacedVignette = (force: boolean = false) => {
      if (isAdminActive()) {
        autoDismissVignette();
        return false;
      }

      const now = Date.now();
      const lastFired = parseInt(sessionStorage.getItem(LAST_VIGNETTE_TIME_KEY) || '0', 10);

      // Enforce 1.5-minute (90-second) pacing between vignette popups
      if (!force && lastFired > 0 && !isPacedVignetteTarget(lastFired, now)) {
        return false;
      }

      sessionStorage.setItem(LAST_VIGNETTE_TIME_KEY, now.toString());
      setIsActive(true);

      // Invoke Monetag vignette ad
      if (typeof (window as any)[`show_${VIGNETTE_ZONE}`] === 'function') {
        try {
          (window as any)[`show_${VIGNETTE_ZONE}`]();
        } catch {}
      } else {
        let script = document.querySelector<HTMLScriptElement>(`script[data-zone="${VIGNETTE_ZONE}"]`);
        if (script) {
          try {
            script.remove();
          } catch {}
        }
        script = document.createElement('script');
        script.dataset.zone = VIGNETTE_ZONE;
        script.src = VIGNETTE_SCRIPT_URL;
        script.async = true;
        document.body.appendChild(script);
      }

      // Clear any prior timers
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

      // Dismiss automatically 2.5 seconds after page reload / trigger
      activeTimerRef.current = setTimeout(() => {
        autoDismissVignette();
      }, DWELL_TIME_MS);

      // Safety watchdog: Guaranteed hard auto-dismissal at 5.2 seconds
      fallbackTimerRef.current = setTimeout(() => {
        autoDismissVignette();
      }, MAX_FALLBACK_MS);

      return true;
    };

    // Initialize session timer if not set
    if (!sessionStorage.getItem(LAST_VIGNETTE_TIME_KEY)) {
      sessionStorage.setItem(LAST_VIGNETTE_TIME_KEY, Date.now().toString());
    }

    // Set recurring timer: Exactly one vignette popup every 1.5 minutes (90 seconds)
    const intervalTimer = setInterval(() => {
      firePacedVignette(true);
    }, VIGNETTE_INTERVAL_MS);

    const handleTransition = (routeKey?: string) => {
      const now = Date.now();
      const currentKey = routeKey || window.location.hash || window.location.pathname;

      // Debounce rapid duplicate trigger events within 350ms or identical route keys
      if (now - lastTransitionTimeRef.current < 350 || (routeKey && currentKey === lastRouteKeyRef.current)) {
        return;
      }
      lastTransitionTimeRef.current = now;
      lastRouteKeyRef.current = currentKey;

      // Check if 1.5 minutes have passed since the last vignette popup
      const lastFired = parseInt(sessionStorage.getItem(LAST_VIGNETTE_TIME_KEY) || '0', 10);
      if (isPacedVignetteTarget(lastFired, now)) {
        firePacedVignette();
      }
    };

    const handleHashChange = () => {
      handleTransition(window.location.hash);
    };

    const handleCustomRouteTransition = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const key = detail?.subRouteKey || detail?.route || detail?.activeTab || window.location.hash;
      handleTransition(key);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('esn_route_transition', handleCustomRouteTransition);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('esn_route_transition', handleCustomRouteTransition);
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      autoDismissVignette();
    };
  }, []);

  if (!isActive) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[2147483647] pointer-events-none flex flex-col items-center select-none"
    >
      <div className="w-full h-1 overflow-hidden bg-slate-900/40">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
          style={{
            width: '100%',
            animation: `vignetteProgressBar ${DWELL_TIME_MS}ms linear forwards`,
          }}
        />
      </div>
      <div className="mt-2 animate-fadeIn pointer-events-none">
        <div className="bg-[#09111c]/90 border border-emerald-500/35 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xl shadow-black/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
            Syncing Live Matchday Feed
          </span>
          <span className="text-[9px] text-slate-400 font-mono">2.5s</span>
        </div>
      </div>
      <style>{`
        @keyframes vignetteProgressBar {
          0% { width: 0%; opacity: 1; }
          90% { width: 95%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TransitionVignetteManager;
