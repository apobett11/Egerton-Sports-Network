import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageCircle, 
  Mail, 
  Send, 
  Sparkles,
  Info
} from 'lucide-react';
import { getStoredBusinessContact } from '../data/adminSettings';

interface ContactBottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowseCatalog?: () => void;
  theme?: 'dark' | 'light';
}

export const ContactBottomModal: React.FC<ContactBottomModalProps> = ({
  isOpen,
  onClose,
  onBrowseCatalog,
  theme = 'dark',
}) => {
  const [showInAppAlert, setShowInAppAlert] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const contact = getStoredBusinessContact();
  const rawWa = contact.whatsappNumber || '254700000000';
  const cleanWaPhone = rawWa.replace(/\D/g, '') || '254700000000';
  const rawCall = contact.callPhoneNumber || '254700000000';
  const cleanCallPhone = rawCall.replace(/\D/g, '') || '254700000000';
  const email = contact.businessEmail || 'store@egerscore.co.ke';

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${cleanWaPhone}?text=Hi%2C%20I%20am%20inquiring%20about%20Jose%20Commerce%20gear`, '_blank');
  };

  const handleCallDesk = () => {
    // "teh call desk should go to call, not whatsapp. it should go to dialpad."
    window.location.href = `tel:+${cleanCallPhone}`;
  };

  const handleEmailDesk = () => {
    // "if email, open teh emailto"
    window.location.href = `mailto:${email}?subject=Jose%20Commerce%20Gear%20Inquiry`;
  };

  const handleInAppHelp = () => {
    // "if in app message, popup: we are working on the in app messaging. coming soon."
    setShowInAppAlert(true);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-0 pb-16 sm:p-4 bg-black/75 backdrop-blur-sm animate-bottom-backdrop">
      {/* Backdrop: Clicking outside closes the popup */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      {/* Bottom Popup Dialog: Only the 4 buttons, emerges behind menu in full view */}
      <div 
        className={`relative w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border transition-all duration-300 z-10 animate-bottom-sheet flex flex-col mb-1 sm:mb-0 ${
          isDark 
            ? 'bg-[#0f1d2e] border-slate-700 text-white shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/40 mx-auto mb-3.5" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff0046] to-blue-600 text-white shadow-sm font-black">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                Instant Contact Channels
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct helplines & instant concierges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
            aria-label="Close contact modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IN-APP HELP COMING SOON POPUP/ALERT */}
        {showInAppAlert && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-600/15 border border-blue-500/40 text-blue-200 text-xs animate-spring-pop flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-0.5">In-App Messaging</strong>
                <p className="text-[11px] text-blue-300">
                  We are working on the in app messaging. Coming soon.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInAppAlert(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* THE FOUR BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all touch-spring text-center cursor-pointer shadow-sm active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">WhatsApp</span>
            <span className="text-[10px] text-emerald-300 font-medium">Instant reply</span>
          </button>

          {/* 2. Call Desk Button (direct to whatsapp chat) */}
          <button
            type="button"
            onClick={handleCallDesk}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-all touch-spring text-center cursor-pointer shadow-sm active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">Call Desk</span>
            <span className="text-[10px] text-sky-300 font-medium">Toll-free line</span>
          </button>

          {/* 3. Email Desk Button (mailto) */}
          <button
            type="button"
            onClick={handleEmailDesk}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all touch-spring text-center cursor-pointer shadow-sm active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">Email Desk</span>
            <span className="text-[10px] text-amber-300 font-medium">Official orders</span>
          </button>

          {/* 4. In-App Help Button */}
          <button
            type="button"
            onClick={handleInAppHelp}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#ff0046]/15 hover:bg-[#ff0046]/25 text-[#ff0046] border border-[#ff0046]/30 transition-all touch-spring text-center cursor-pointer shadow-sm active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ff0046]/20 flex items-center justify-center text-[#ff0046]">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">In-App Help</span>
            <span className="text-[10px] text-rose-300 font-medium">Live concierge</span>
          </button>
        </div>

      </div>
    </div>
  );
};
