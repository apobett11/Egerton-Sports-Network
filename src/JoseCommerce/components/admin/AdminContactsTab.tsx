import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Save, 
  Check, 
  Building2, 
  Info
} from 'lucide-react';
import { BusinessContactSettings } from '../../types';

interface AdminContactsTabProps {
  contactSettings: BusinessContactSettings;
  onSaveContactSettings: (settings: BusinessContactSettings) => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
}

export const AdminContactsTab: React.FC<AdminContactsTabProps> = ({
  contactSettings,
  onSaveContactSettings,
  onShowToast,
  theme = 'dark',
}) => {
  const [formData, setFormData] = useState<BusinessContactSettings>(contactSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContactSettings(formData);
    setSavedSuccess(true);
    if (onShowToast) {
      onShowToast('Business point of contact details saved successfully!');
    }
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      
      {/* Google Forms Header Card with Accent Bar */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="h-2.5 bg-[#00b04f] w-full" />
        <div className="p-5 sm:p-6 space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00b04f]" />
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
              Business Point of Contact
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Public contact information displayed to customers and teams. This is strictly for store inquiries and will not be used for admin login credentials.
          </p>
        </div>
      </div>

      {/* Google Forms Form Card */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* Field 1: Business Email */}
        <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
          theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Mail className="w-4 h-4 text-[#ff0046]" />
            <label htmlFor="businessEmail">Business Support Email</label>
            <span className="text-[#ff0046]">*</span>
          </div>
          <input
            id="businessEmail"
            type="email"
            required
            value={formData.businessEmail}
            onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
            placeholder="e.g. store@egerscore.co.ke"
            className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
            }`}
          />
        </div>

        {/* Field 2: Call Number */}
        <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
          theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Phone className="w-4 h-4 text-sky-400" />
            <label htmlFor="callPhoneNumber">Official Calling Line</label>
            <span className="text-[#ff0046]">*</span>
          </div>
          <input
            id="callPhoneNumber"
            type="tel"
            required
            value={formData.callPhoneNumber}
            onChange={(e) => setFormData({ ...formData, callPhoneNumber: e.target.value })}
            placeholder="e.g. +254 712 345 678"
            className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
            }`}
          />
        </div>

        {/* Field 3: WhatsApp Number */}
        <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
          theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <MessageCircle className="w-4 h-4 text-[#00b04f]" />
            <label htmlFor="whatsappNumber">Official WhatsApp Line</label>
            <span className="text-[#ff0046]">*</span>
          </div>
          <input
            id="whatsappNumber"
            type="tel"
            required
            value={formData.whatsappNumber}
            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            placeholder="e.g. +254 700 000 000"
            className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
            }`}
          />
        </div>

        {/* Field 4: Operating Hours */}
        <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
          theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <label htmlFor="operatingHours">Business Working Hours</label>
          </div>
          <input
            id="operatingHours"
            type="text"
            value={formData.operatingHours}
            onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
            placeholder="e.g. Mon - Sat: 8:00 AM - 7:00 PM (EAT)"
            className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
            }`}
          />
        </div>

        {/* Field 5: Physical Pickup Depot */}
        <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
          theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <label htmlFor="depotLocation">Physical Depot & Gate Pickup Point</label>
          </div>
          <input
            id="depotLocation"
            type="text"
            value={formData.depotLocation}
            onChange={(e) => setFormData({ ...formData, depotLocation: e.target.value })}
            placeholder="e.g. Gate 3 Sports Hub, Main Pitch Depot, Egerton"
            className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
            }`}
          />
        </div>

        {/* Action Button & Confirmation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#00b04f] hover:bg-[#00b04f]/90 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save Business Contact</span>
          </button>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00b04f] animate-spring-in">
              <Check className="w-4 h-4" />
              <span>Contact points updated!</span>
            </div>
          )}
        </div>

      </form>

    </div>
  );
};
