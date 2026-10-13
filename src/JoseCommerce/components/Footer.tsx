import React from 'react';
import { Trophy, ArrowLeft, Phone, Mail, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onBackToLiveScore: () => void;
  onSelectCategory?: (category: string) => void;
  theme?: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({
  onBackToLiveScore,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <footer className={`w-full py-4 px-4 sm:px-6 border-t transition-colors ${
      isDark
        ? 'bg-[#0a1420] text-slate-400 border-[#1f3c5b]/60'
        : 'bg-slate-100 text-slate-600 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Brand & Mini Tag */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff0046] text-white shadow-2xs">
            <Trophy className="h-3.5 w-3.5" />
          </span>
          <span className={`font-black tracking-tight text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
            EGERSCORE STORE
          </span>
          <span className="text-slate-400">• Official Sports Outfitter</span>
        </div>

        {/* Quick Contacts & Link */}
        <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-[#ff0046]" />
            <span>+254 712 345 678</span>
          </span>
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-[#ff0046]" />
            <span>support@egerscore.ke</span>
          </span>
          <button
            onClick={onBackToLiveScore}
            className="inline-flex items-center gap-1 text-[#ff0046] hover:underline font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>LiveScore Home</span>
          </button>
        </div>

        {/* Copyright */}
        <div className="text-[10px] text-slate-400">
          © {new Date().getFullYear()} Egerscore. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
