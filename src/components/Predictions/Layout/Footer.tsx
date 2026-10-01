import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-[#16283d] bg-[#070e17] py-6 text-center text-xs text-slate-500">
      <div className="mx-auto max-w-4xl px-4 space-y-3">
        <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
          <ShieldCheck className="h-4 w-4 text-[#00b04f]" />
          <span>EgerScore EPL Matchday Prediction & Fan Banter Community</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 max-w-xl mx-auto">
          For the love of football. No money, no bets — just your club and this matchday.
        </p>
        <p className="text-[10px] text-slate-600">
          © 2026 EgerScore. Built with high-performance low-CPU architecture for Kenyan and Global EPL supporters.
        </p>
      </div>
    </footer>
  );
};
