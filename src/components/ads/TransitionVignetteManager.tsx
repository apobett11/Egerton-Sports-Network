import React, { useEffect, useState, useRef } from 'react';

const VIGNETTE_ZONE = '11954979';
const VIGNETTE_SCRIPT_URL = 'https://n6wxm.com/vignette.min.js';
const DWELL_TIME_MS = 2500;       // 2.5 seconds auto-dismissal after new page load
const MAX_FALLBACK_MS = 5200;     // 5.2 seconds hard safety timeout
const COUNTER_KEY = 'esn_vignette_nav_count';

// Psychological Pacing: 2nd transition, then every 4th transition thereafter (2, 6, 10, 14, ...)
// Balances user comfort with monetization, engaging the viewer at the optimal psychological moment.
export const isPacedVignetteTarget = (count: number): boolean => {
  return count >= 2 && (count - 2) % 4 === 0;
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

    const firePacedVignette = () => {
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
    };

    const handleTransition = (routeKey?: string) => {
      const now = Date.now();
      const currentKey = routeKey || window.location.hash || window.location.pathname;

      // Debounce rapid duplicate trigger events within 350ms or identical route keys
      if (now - lastTransitionTimeRef.current < 350 || (routeKey && currentKey === lastRouteKeyRef.current)) {
        return;
      }
      lastTransitionTimeRef.current = now;
      lastRouteKeyRef.current = currentKey;

      // Read & increment transition counter
      const currentCount = parseInt(sessionStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
      sessionStorage.setItem(COUNTER_KEY, currentCount.toString());

      // Pacing check: 2nd transition, then every 4th after that (2, 6, 10, ...)
      if (isPacedVignetteTarget(currentCount)) {
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
