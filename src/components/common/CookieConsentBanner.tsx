import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('esn_cookie_consent');
      if (!consent) {
        // Small delay to prevent layout jump on initial load
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('esn_cookie_consent', 'accepted');
      localStorage.setItem('esn_cookie_consent_timestamp', new Date().toISOString());
    } catch {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('esn_cookie_consent', 'essential_only');
      localStorage.setItem('esn_cookie_consent_timestamp', new Date().toISOString());
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
    >
      <div className="max-w-4xl mx-auto bg-white/95 dark:bg-[#0e1c2b]/95 backdrop-blur-md border border-slate-200/80 dark:border-[#1a2e45] rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-800 dark:text-slate-100">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Cookie & Data Privacy Notice
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] sm:text-xs">
              Egerton Sports Network uses cookies, device identifiers, and third-party services (including Google AdSense) to deliver live match fixtures, personalize sports content, analyze traffic, and display relevant campus advertisements in compliance with data privacy regulations. Read our{' '}
              <a
                href="#/privacy"
                className="text-[#ff0046] font-bold underline hover:text-[#e0003c]"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="#/terms"
                className="text-[#ff0046] font-bold underline hover:text-[#e0003c]"
              >
                Terms of Service
              </a>{' '}
              to learn more about our data practices and how you can manage your preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-[#ff0046] text-white text-xs font-bold hover:bg-[#e0003c] transition-colors shadow-xs cursor-pointer"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleDecline}
            aria-label="Dismiss cookie notice"
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
