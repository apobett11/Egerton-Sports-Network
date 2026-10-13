import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  MessageCircle, 
  Send,
  Building2
} from 'lucide-react';
import { getStoredBusinessContact } from '../data/adminSettings';

interface DepotGuidanceSectionProps {
  theme?: 'dark' | 'light';
}

export const DepotGuidanceSection: React.FC<DepotGuidanceSectionProps> = ({
  theme = 'dark',
}) => {
  const [courierStatusMessage, setCourierStatusMessage] = useState<string>('');

  const handleCheckCourierStatus = () => {
    setCourierStatusMessage('Dispatch Active: Depot runner on standby at Gate B Pavilion Locker #14. Campus hostel deliveries dispatching every 45 mins.');
    setTimeout(() => {
      setCourierStatusMessage('');
    }, 7000);
  };

  const isDark = theme === 'dark';

  return (
    <section className="w-full py-1 sm:py-1.5">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Unified Section Card */}
        <div className={`rounded-2xl shadow-sm p-4 sm:p-6 transition-colors ${
          isDark
            ? 'bg-[#13273e] border border-[#234568]'
            : 'bg-white border border-slate-200/90'
        }`}>
          
          {/* Section Head */}
          <div className={`flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs mb-5 transition-colors ${
            isDark
              ? 'bg-[#1b3654] border border-[#284d73] text-white'
              : 'bg-slate-100 border border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#ff0046] text-white shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <h2 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Depot Pickup & Gate Guidance
                </h2>
                <p className={`text-[10px] font-medium hidden sm:block ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Fast campus dispatch from Egerton Gate B Sports Pavilion directly to hostels & pitches
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs border ${
              isDark
                ? 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              Live Depot Desk
            </span>
          </div>

          {/* Two-column layout: Depot Guidance + Contact Store Concierge */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Card: Depot Pickup & Gate Guidance */}
            <div className={`rounded-xl p-4 sm:p-5 border transition-colors flex flex-col justify-between ${
              isDark 
                ? 'bg-[#102235] border-[#254668] text-slate-200' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-[#ff0046]" />
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    Depot Pickup & Gate Guidance
                  </h3>
                </div>
                
                <p className={`text-xs leading-relaxed mb-4 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Fast depot pickup starts at <strong className={isDark ? 'text-white' : 'text-slate-950'}>Egerton Gate B Sports Pavilion</strong> and dispatches directly to varsity hostels and team dressing rooms. Verified kit tags are inspected before handover.
                </p>

                <div className={`p-3 rounded-lg border text-xs space-y-1.5 mb-4 ${
                  isDark ? 'bg-[#162d46] border-[#294c72] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#ff0046] shrink-0" />
                    <span><strong>Pickup Gate:</strong> Egerton Main Campus - Gate B Depot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Store Station:</strong> Pavilion Locker #14 - Egerscore Gear Desk</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      isDark
                        ? 'border-[#335982] bg-[#1a3654] text-white hover:bg-[#234568]'
                        : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>View Route on Google Maps</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCheckCourierStatus}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Check Depot Courier Status</span>
                  </button>
                </div>

                {courierStatusMessage && (
                  <div className="mt-3 p-2.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 animate-in fade-in">
                    {courierStatusMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Contact Store Concierge */}
            <div className={`rounded-xl p-4 sm:p-5 border transition-colors flex flex-col justify-between ${
              isDark 
                ? 'bg-[#102235] border-[#254668] text-slate-200' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-[#ff0046]" />
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    Contact Store Concierge
                  </h3>
                </div>

                {/* 4 Quick Action Channels */}
                {(() => {
                  const contact = getStoredBusinessContact();
                  const phone = contact.callPhoneNumber;
                  const whatsapp = contact.whatsappNumber || contact.callPhoneNumber;
                  const email = contact.businessEmail;
                  const location = contact.depotLocation || 'Main Campus Depot';
                  const hours = contact.operatingHours || 'Mon - Sat: 8:00 AM - 7:00 PM';

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        <a
                          href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hi%2C%20I%20am%20inquiring%20about%20gear` : '#'}
                          target={whatsapp ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-[11px] font-bold">WhatsApp</span>
                        </a>

                        <a
                          href={phone ? `tel:${phone}` : '#'}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="text-[11px] font-bold">Call Desk</span>
                        </a>

                        <a
                          href={email ? `mailto:${email}` : '#'}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          <span className="text-[11px] font-bold">Email Desk</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('products-section') || document.querySelector('main');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-[#ff0046]/15 hover:bg-[#ff0046]/25 text-[#ff0046] border border-[#ff0046]/30 transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span className="text-[11px] font-bold">In-App Catalog</span>
                        </button>
                      </div>

                      {/* Key Details List */}
                      <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        isDark ? 'bg-[#162d46] border-[#294c72] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Direct Phone:</span>
                          <span className="font-bold text-[#ff0046]">{phone || 'Available via WhatsApp / In-App'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Email Desk:</span>
                          <span className="font-bold">{email || 'store@egerscore.co.ke'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Location:</span>
                          <span className="font-semibold text-right">{location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Depot Hours:
                          </span>
                          <span className="font-semibold text-right">{hours}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Social Follow Links */}
              <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Follow Egerscore Gear
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors"
                    aria-label="Twitter / X"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    aria-label="Telegram"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
