import React from 'react';
import { X, Sparkles, Send, Share2 } from 'lucide-react';
import { CompactDirectBanner } from '../../ads/CompactDirectBanner';
import { MonetagTopRightAd } from '../../ads/MonetagTopRightAd';

interface CreatorPartnerModalProps {
  onClose: () => void;
}

const PARTNER_FORM_URL = 'https://forms.gle/Dq3HTRXE1iGfCWWD7';

export const CreatorPartnerModal: React.FC<CreatorPartnerModalProps> = ({ onClose }) => {
  const handleOpenForm = () => {
    window.open(PARTNER_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      'Egerton Sports Network is partnering with journalists, bloggers, and content creators! Apply here: https://forms.gle/Dq3HTRXE1iGfCWWD7'
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn"
      data-testid="creator-partner-modal"
    >
      <MonetagTopRightAd forceShow={true} />

      <div className="relative w-full max-w-[360px] sm:max-w-md rounded-2xl border border-emerald-500/40 bg-[#0e1c2b] p-4 sm:p-5 text-center text-white shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-[#14263b] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Badge & Icon */}
        <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shadow-inner">
          <Sparkles className="h-5 w-5" />
        </div>

        <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
          Partner With Egerton Sports Network
        </h2>

        {/* Description with Reach Out Link */}
        <p className="mt-2 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
          We are finding journalists, bloggers and content creators to partner.
          If you can create content around any of the above,{' '}
          <a
            href={PARTNER_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline font-black hover:text-emerald-300 transition-colors"
          >
            reach out
          </a>{' '}
          to us.
        </p>

        {/* 3 Action Buttons */}
        <div className="mt-4 space-y-2">
          {/* Main Primary Button: Apply / Reach Out */}
          <button
            type="button"
            onClick={handleOpenForm}
            data-testid="partner-apply-btn"
            className="w-full min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs sm:text-sm font-black uppercase tracking-wider text-black hover:bg-emerald-400 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Apply to Partner</span>
          </button>

          {/* Secondary Smaller Button: Invite Another Person (WhatsApp Share) */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            data-testid="partner-invite-btn"
            className="w-full min-h-[34px] flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#14263b] text-[11px] font-bold text-slate-200 hover:bg-[#1a3452] hover:text-white transition-all active:scale-[0.98] cursor-pointer"
          >
            <Share2 className="h-3 w-3 text-emerald-400" />
            <span>Invite Another Person to Apply</span>
          </button>

          {/* Tertiary Button: Close / Dismiss */}
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[30px] text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>

        {/* Embedded Ad at Extreme End of Popup */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <CompactDirectBanner
            variant="purple"
            label="Campus Creator Grant"
            tagline="Sponsored Journalism Program & Rewards"
            ctaText="Explore"
            className="!my-0 !px-0"
          />
        </div>
      </div>
    </div>
  );
};
