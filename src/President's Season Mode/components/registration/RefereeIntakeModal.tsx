import React, { useState } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import type { RefereeIntakePayload } from '../../types/seasonMode';
import { REFEREE_BADGES } from '../../constants/seasonConstants';

interface RefereeIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RefereeIntakePayload) => Promise<{ success: boolean; error: string | null }>;
  isDark: boolean;
}

export const RefereeIntakeModal: React.FC<RefereeIntakeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [badgeLevel, setBadgeLevel] = useState<string>(REFEREE_BADGES[1]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Please fill in all required referee fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await onSubmit({
      official_first_name: firstName.trim(),
      official_last_name: lastName.trim(),
      nickname: nickname.trim() || undefined,
      phone_number: phone.trim(),
      email: email.trim(),
      badge_level: badgeLevel,
    });

    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Referee registration failed.');
    } else {
      setFirstName('');
      setLastName('');
      setNickname('');
      setPhone('');
      setEmail('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ref-modal-title"
    >
      <div
        className={`w-full max-w-lg border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl transition-all ${
          isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ref-modal-title" className="text-lg font-black tracking-tight">
                Center Referee Intake Registration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Add verified official referee credentials to the active pool.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR DISPLAY */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Referee Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ref-first-name" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Official First Name *
              </label>
              <input
                id="ref-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Peter"
                className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
                required
              />
            </div>
            <div>
              <label htmlFor="ref-last-name" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Official Last Name *
              </label>
              <input
                id="ref-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Ndambuki"
                className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
                required
              />
            </div>
          </div>

          {/* Nickname & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ref-nickname" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Nickname / Alias (Optional)
              </label>
              <input
                id="ref-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Ref. Pierluigi"
                className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label htmlFor="ref-phone" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Phone Number *
              </label>
              <input
                id="ref-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
                required
              />
            </div>
          </div>

          {/* Email Identity */}
          <div>
            <label htmlFor="ref-email" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
              Official Email Address *
            </label>
            <input
              id="ref-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="referee@egerton.ac.ke"
              className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              required
            />
          </div>

          {/* Badge Level */}
          <div>
            <label htmlFor="ref-badge" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
              Official Badge Level Accreditation
            </label>
            <select
              id="ref-badge"
              value={badgeLevel}
              onChange={(e) => setBadgeLevel(e.target.value)}
              className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none font-bold ${
                isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {REFEREE_BADGES.map((badge, i) => (
                <option key={i} value={badge}>
                  {badge}
                </option>
              ))}
            </select>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px] transition-all shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:opacity-50"
          >
            {isSubmitting ? 'Registering Referee...' : 'Save & Register Referee to Active Pool'}
          </button>
        </form>
      </div>
    </div>
  );
};
