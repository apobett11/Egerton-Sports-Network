import React from 'react';
import { 
  X, 
  Phone, 
  MessageCircle, 
  Mail, 
  Building2, 
  Clock, 
  Navigation, 
  Send, 
  Headphones, 
  CheckCircle2,
  ExternalLink 
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
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const contact = getStoredBusinessContact();
  const phone = contact.callPhoneNumber;
  const whatsapp = contact.whatsappNumber || contact.callPhoneNumber;
  const email = contact.businessEmail || 'store@egerscore.co.ke';
  const location = contact.depotLocation || 'Egerton Gate B Sports Pavilion Locker Depot';
  const hours = contact.operatingHours || 'Mon - Sat: 8:00 AM - 7:00 PM';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      {/* Bottom Popup Dialog */}
      <div 
        className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border transition-all duration-300 z-10 animate-bottom-sheet max-h-[90vh] flex flex-col ${
          isDark 
            ? 'bg-[#0f1d2e] border-slate-700 text-white shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/40 mx-auto mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#ff0046] text-white shadow-sm">
              <Headphones className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  Contact Store Concierge
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Depot Desk
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct dispatch helplines, station pickups & customer support
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

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          {/* 4 Quick Action Channels (Exactly like homepage bottom) */}
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-2">
              Instant Contact Channels
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi%2C%20I%20am%20inquiring%20about%20gear` : '#'}
                target={whatsapp ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all touch-spring text-center cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">WhatsApp</span>
                <span className="text-[9px] text-emerald-300/80">Instant reply</span>
              </a>

              <a
                href={phone ? `tel:${phone}` : '#'}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-all touch-spring text-center cursor-pointer shadow-xs"
              >
                <Phone className="w-5 h-5 text-sky-400" />
                <span className="text-xs font-bold">Call Desk</span>
                <span className="text-[9px] text-sky-300/80">Toll-free line</span>
              </a>

              <a
                href={email ? `mailto:${email}` : '#'}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all touch-spring text-center cursor-pointer shadow-xs"
              >
                <Mail className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">Email Desk</span>
                <span className="text-[9px] text-amber-300/80">Official orders</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBrowseCatalog?.();
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#ff0046]/15 hover:bg-[#ff0046]/25 text-[#ff0046] border border-[#ff0046]/30 transition-all touch-spring text-center cursor-pointer shadow-xs"
              >
                <Send className="w-5 h-5 text-[#ff0046]" />
                <span className="text-xs font-bold">In-App Help</span>
                <span className="text-[9px] text-rose-300/80">Shop products</span>
              </button>
            </div>
          </div>

          {/* Key Contact & Depot Details (Exactly like homepage bottom) */}
          <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
            isDark ? 'bg-[#14263b] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/40">
              <span className="text-slate-400 font-medium">Direct Hotline:</span>
              <span className="font-bold text-[#ff0046]">{phone || '+254 700 000 000'}</span>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/40">
              <span className="text-slate-400 font-medium">Email Desk:</span>
              <span className="font-bold">{email}</span>
            </div>

            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-700/40">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Campus Depot:
              </span>
              <span className="font-semibold text-right">{location}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Depot Operating Hours:
              </span>
              <span className="font-semibold text-right">{hours}</span>
            </div>
          </div>

          {/* Campus Delivery Guidance Note */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            isDark ? 'bg-[#182b42] border-slate-700/60 text-slate-300' : 'bg-blue-50 border-blue-200 text-blue-950'
          }`}>
            <Navigation className="w-4 h-4 text-[#ff0046] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-white">Campus Hostel & Pitch Dispatch:</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Depot runners dispatch every 45 mins directly from Egerton Gate B Sports Pavilion to varsity hostels, pitches, and dressing rooms.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-700/60">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-center active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Close Helplines
          </button>
        </div>

      </div>
    </div>
  );
};
