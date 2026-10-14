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
  Pencil,
  X,
  PhoneCall,
  Globe2,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { BusinessContactSettings } from '../../types';

interface AdminContactsTabProps {
  contactSettings: BusinessContactSettings;
  onSaveContactSettings: (settings: BusinessContactSettings) => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
}

const COUNTRY_CODES = [
  { code: '+254', label: '🇰🇪 Kenya (+254)' },
  { code: '+256', label: '🇺🇬 Uganda (+256)' },
  { code: '+255', label: '🇹🇿 Tanzania (+255)' },
  { code: '+250', label: '🇷🇼 Rwanda (+250)' },
  { code: '+1', label: '🇺🇸 USA / Canada (+1)' },
  { code: '+44', label: '🇬🇧 UK (+44)' },
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function extractPhoneParts(raw: string, fallbackCode = '+254') {
  if (!raw) return { code: fallbackCode, local: '' };
  const clean = raw.trim();
  const matched = COUNTRY_CODES.find((c) => clean.startsWith(c.code));
  if (matched) {
    return {
      code: matched.code,
      local: clean.slice(matched.code.length).replace(/\D/g, '').slice(0, 9),
    };
  }
  if (clean.startsWith('+')) {
    const parts = clean.split(' ');
    const code = parts[0] || fallbackCode;
    const local = clean.slice(code.length).replace(/\D/g, '').slice(0, 9);
    return { code, local };
  }
  // If starts with 07..., strip 0 and use +254
  const digits = clean.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length >= 12) {
    return { code: '+254', local: digits.slice(3, 12) };
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return { code: '+254', local: digits.slice(1, 10) };
  }
  return { code: fallbackCode, local: digits.slice(0, 9) };
}

export const AdminContactsTab: React.FC<AdminContactsTabProps> = ({
  contactSettings,
  onSaveContactSettings,
  onShowToast,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [email, setEmail] = useState(contactSettings.businessEmail || 'store@egerscore.co.ke');
  
  // Call Desk phone states
  const initialCall = extractPhoneParts(contactSettings.callPhoneNumber || '+254 700 000 000');
  const [callCode, setCallCode] = useState(contactSettings.callCountryCode || initialCall.code);
  const [callLocal, setCallLocal] = useState(contactSettings.callLocalNumber || initialCall.local || '700000000');

  // WhatsApp phone states
  const initialWa = extractPhoneParts(contactSettings.whatsappNumber || '+254 700 000 000');
  const [waCode, setWaCode] = useState(contactSettings.whatsappCountryCode || initialWa.code);
  const [waLocal, setWaLocal] = useState(contactSettings.whatsappLocalNumber || initialWa.local || '700000000');

  // Operating hours states
  const [isOpen24Hours, setIsOpen24Hours] = useState(Boolean(contactSettings.isOpen24Hours));
  const [startDay, setStartDay] = useState(contactSettings.startDay || 'Monday');
  const [startHour, setStartHour] = useState(contactSettings.startHour || '08:00');
  const [endDay, setEndDay] = useState(contactSettings.endDay || 'Saturday');
  const [endHour, setEndHour] = useState(contactSettings.endHour || '19:00');

  // Depot location
  const [depotLocation, setDepotLocation] = useState(
    contactSettings.depotLocation || 'Egerton Gate B Sports Pavilion Locker Depot'
  );

  const formatDisplayTime = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hourNum = parseInt(h, 10);
    if (isNaN(hourNum)) return time24;
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${displayHour}:${m || '00'} ${period}`;
  };

  const computeOperatingHoursString = () => {
    if (isOpen24Hours) {
      return 'Open 24 Hours (Always Available 24/7)';
    }
    return `${startDay} ${formatDisplayTime(startHour)} – ${endDay} ${formatDisplayTime(endHour)} (EAT)`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedCall = `${callCode} ${callLocal.replace(/\D/g, '').slice(0, 9)}`.trim();
    const formattedWa = `${waCode} ${waLocal.replace(/\D/g, '').slice(0, 9)}`.trim();
    const computedHours = computeOperatingHoursString();

    const updatedSettings: BusinessContactSettings = {
      businessEmail: email.trim(),
      callPhoneNumber: formattedCall,
      whatsappNumber: formattedWa,
      operatingHours: computedHours,
      depotLocation: depotLocation.trim(),
      callCountryCode: callCode,
      callLocalNumber: callLocal.replace(/\D/g, '').slice(0, 9),
      whatsappCountryCode: waCode,
      whatsappLocalNumber: waLocal.replace(/\D/g, '').slice(0, 9),
      startDay,
      startHour,
      endDay,
      endHour,
      isOpen24Hours,
    };

    onSaveContactSettings(updatedSettings);
    setIsEditing(false);
    setSavedSuccess(true);
    if (onShowToast) {
      onShowToast('Business point of contact updated successfully!');
    }
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCancel = () => {
    // Reset to current saved prop values
    setEmail(contactSettings.businessEmail || 'store@egerscore.co.ke');
    const cParts = extractPhoneParts(contactSettings.callPhoneNumber);
    setCallCode(contactSettings.callCountryCode || cParts.code);
    setCallLocal(contactSettings.callLocalNumber || cParts.local);
    const wParts = extractPhoneParts(contactSettings.whatsappNumber);
    setWaCode(contactSettings.whatsappCountryCode || wParts.code);
    setWaLocal(contactSettings.whatsappLocalNumber || wParts.local);
    setIsOpen24Hours(Boolean(contactSettings.isOpen24Hours));
    setStartDay(contactSettings.startDay || 'Monday');
    setStartHour(contactSettings.startHour || '08:00');
    setEndDay(contactSettings.endDay || 'Saturday');
    setEndHour(contactSettings.endHour || '19:00');
    setDepotLocation(contactSettings.depotLocation || 'Egerton Gate B Sports Pavilion Locker Depot');
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header Card */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="h-2 bg-[#00b04f] w-full" />
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00b04f]" />
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Business Point of Contact
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Customer helplines, WhatsApp desk, operating hours, and physical pickup locker depot.
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="Edit contact information"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Contact</span>
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-spring-pop">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Business point of contact updated successfully!</span>
        </div>
      )}

      {/* ================= 1. VIEW MODE (Not on inputs) ================= */}
      {!isEditing ? (
        <div className="space-y-3">
          {/* Email View Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#122336] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-500/15 text-[#ff0046] border border-rose-500/20">
                <Mail className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Official Support Email
                </span>
                <span className="text-sm font-black font-mono">
                  {contactSettings.businessEmail || 'store@egerscore.co.ke'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-700/60">
              mailto: official orders
            </span>
          </div>

          {/* Call Desk Line View Card (Dialpad) */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#122336] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
                <PhoneCall className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Call Desk Line (Toll-free / Direct Line)
                </span>
                <span className="text-sm font-black font-mono">
                  {contactSettings.callPhoneNumber || '+254 700 000 000'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>Goes to Dialpad</span>
            </span>
          </div>

          {/* WhatsApp Line View Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#122336] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <MessageCircle className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Official WhatsApp Support Line
                </span>
                <span className="text-sm font-black font-mono">
                  {contactSettings.whatsappNumber || '+254 700 000 000'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>Instant Chat</span>
            </span>
          </div>

          {/* Working Hours View Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#122336] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Business Working Hours
                </span>
                <span className="text-sm font-black">
                  {contactSettings.operatingHours || computeOperatingHoursString()}
                </span>
              </div>
            </div>
            {contactSettings.isOpen24Hours && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                24/7 Available
              </span>
            )}
          </div>

          {/* Physical Depot Location View Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#122336] border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                <MapPin className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Physical Depot Pickup Point
                </span>
                <span className="text-xs sm:text-sm font-semibold">
                  {contactSettings.depotLocation || 'Egerton Gate B Sports Pavilion Locker Depot'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-700/60 hidden sm:inline">
              Self Pickup
            </span>
          </div>

          {/* Bottom Edit Bar */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-400" />
              <span>Modify Contact Settings</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= 2. EDIT FORM MODE (Inputs active) ================= */
        <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
          
          {/* Field 1: Email */}
          <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Mail className="w-4 h-4 text-[#ff0046]" />
                <label htmlFor="businessEmail">Official Support Email</label>
                <span className="text-[#ff0046]">*</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Opens mailto directly</span>
            </div>
            <input
              id="businessEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. store@egerscore.co.ke"
              className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark 
                  ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
              }`}
            />
          </div>

          {/* Field 2: Call Desk Line with country code pre-filled + 9 remaining digits */}
          <div className={`p-4 sm:p-5 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Phone className="w-4 h-4 text-sky-400" />
                <label>Call Desk Line (Direct Dialpad)</label>
                <span className="text-[#ff0046]">*</span>
              </div>
              <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-bold">
                Taps open dialpad
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Prefilled with Kenyan code with change options. Enter the 9 remaining digits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Country Code Selector */}
              <div className="relative">
                <select
                  value={callCode}
                  onChange={(e) => setCallCode(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-mono font-bold appearance-none cursor-pointer focus:outline-hidden ${
                    isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 9 Remaining Digits Input */}
              <div className="sm:col-span-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={9}
                  value={callLocal}
                  onChange={(e) => setCallLocal(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="e.g. 712345678 (9 digits)"
                  className={`w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border tracking-wider focus:outline-hidden ${
                    isDark 
                      ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-sky-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
                  }`}
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
              <span>Preview dialed:</span>
              <span className="font-mono font-bold text-sky-400">{callCode} {callLocal || 'XXXXXXXXX'}</span>
            </div>
          </div>

          {/* Field 3: WhatsApp Support Line with country code pre-filled + 9 remaining digits */}
          <div className={`p-4 sm:p-5 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <label>WhatsApp Support Line (Instant Reply)</label>
                <span className="text-[#ff0046]">*</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                Direct WhatsApp chat
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Prefilled with Kenyan code with change options. Enter the 9 remaining digits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Country Code Selector */}
              <div className="relative">
                <select
                  value={waCode}
                  onChange={(e) => setWaCode(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-mono font-bold appearance-none cursor-pointer focus:outline-hidden ${
                    isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 9 Remaining Digits Input */}
              <div className="sm:col-span-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={9}
                  value={waLocal}
                  onChange={(e) => setWaLocal(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="e.g. 700000000 (9 digits)"
                  className={`w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border tracking-wider focus:outline-hidden ${
                    isDark 
                      ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-emerald-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
                  }`}
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
              <span>Preview WhatsApp:</span>
              <span className="font-mono font-bold text-emerald-400">{waCode} {waLocal || 'XXXXXXXXX'}</span>
            </div>
          </div>

          {/* Field 4: Business Working Hours (Separate Day & Hour for Opening and Closing, with 24 Hours Open toggle) */}
          <div className={`p-4 sm:p-5 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <label>Business Working Hours</label>
              </div>
              <span className="text-[10px] text-slate-400">Separate day & hour</span>
            </div>

            {/* Separate Opening and Closing Pickers (when not 24h open) */}
            {!isOpen24Hours ? (
              <div className="space-y-2.5">
                {/* Start (Opening) Day & Hour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Opening / Start Day
                    </label>
                    <select
                      value={startDay}
                      onChange={(e) => setStartDay(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border font-bold cursor-pointer focus:outline-hidden ${
                        isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Opening / Start Hour
                    </label>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border font-bold font-mono focus:outline-hidden ${
                        isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* End (Closing) Day & Hour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Closing / End Day
                    </label>
                    <select
                      value={endDay}
                      onChange={(e) => setEndDay(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border font-bold cursor-pointer focus:outline-hidden ${
                        isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                      Closing / End Hour
                    </label>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border font-bold font-mono focus:outline-hidden ${
                        isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Store customer support is marked open 24 hours / 7 days continuous coverage.</span>
              </div>
            )}

            {/* BENEATH: 24 Hours Open Checkbox */}
            <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between">
              <label htmlFor="toggle24Hours" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                <input
                  id="toggle24Hours"
                  type="checkbox"
                  checked={isOpen24Hours}
                  onChange={(e) => setIsOpen24Hours(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Store is open 24 Hours (Always Open)</span>
              </label>

              <span className="text-[10px] font-mono text-slate-400">
                {computeOperatingHoursString()}
              </span>
            </div>
          </div>

          {/* Field 5: Physical Pickup Depot */}
          <div className={`p-4 sm:p-5 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <label htmlFor="depotLocation">Physical Depot & Gate Pickup Location</label>
            </div>
            <input
              id="depotLocation"
              type="text"
              value={depotLocation}
              onChange={(e) => setDepotLocation(e.target.value)}
              placeholder="e.g. Egerton Gate B Sports Pavilion Locker Depot"
              className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark 
                  ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-500 focus:border-[#00b04f]' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#0b1522]'
              }`}
            />
          </div>

          {/* Form Actions: Save & Cancel */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00b04f] hover:bg-[#00b04f]/90 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Contact Details</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
