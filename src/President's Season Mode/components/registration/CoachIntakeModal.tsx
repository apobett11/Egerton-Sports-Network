import React, { useState } from 'react';
import { X, UserPlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CoachIntakePayload } from '../../types/seasonMode';
import { normalizeTeamName } from '../../lib/normalization';
import { COMPETITIONS } from '../../constants/seasonConstants';

interface CoachIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CoachIntakePayload) => Promise<{ success: boolean; error: string | null }>;
  isDark: boolean;
}

export const CoachIntakeModal: React.FC<CoachIntakeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [teamName, setTeamName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [competitionId, setCompetitionId] = useState<string>(COMPETITIONS.PREMIER_LEAGUE.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalizedPreview = teamName.trim() ? normalizeTeamName(teamName) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !teamName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Please fill in all required operational fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await onSubmit({
      official_first_name: firstName.trim(),
      official_last_name: lastName.trim(),
      nickname: nickname.trim() || undefined,
      team_name: teamName.trim(),
      phone_number: phone.trim(),
      email: email.trim(),
      competition_id: competitionId,
    });

    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    } else {
      // Reset form
      setFirstName('');
      setLastName('');
      setNickname('');
      setTeamName('');
      setPhone('');
      setEmail('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-modal-title"
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="coach-modal-title" className="text-lg font-black tracking-tight">
                Coach & Team Intake Registration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Register coach credentials and team identity for pre-season review.
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
          {/* Competition Selector */}
          <div>
            <label className="block text-slate-400 uppercase font-bold text-[11px] mb-1.5">
              Assigned Competition Tier *
            </label>
            <select
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none font-bold ${
                isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value={COMPETITIONS.PREMIER_LEAGUE.id}>Egerton Premier League (Tier 1)</option>
              <option value={COMPETITIONS.CHAMPIONSHIP.id}>Egerton Championship (Tier 2)</option>
            </select>
          </div>

          {/* Coach Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="coach-first-name" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Official First Name *
              </label>
              <input
                id="coach-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
                required
              />
            </div>
            <div>
              <label htmlFor="coach-last-name" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Official Last Name *
              </label>
              <input
                id="coach-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Omondi"
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
              <label htmlFor="coach-nickname" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Nickname / Alias (Optional)
              </label>
              <input
                id="coach-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Coach Zico"
                className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label htmlFor="coach-phone" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
                Phone Number *
              </label>
              <input
                id="coach-phone"
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
            <label htmlFor="coach-email" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
              Official Email Address *
            </label>
            <input
              id="coach-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@egerton.ac.ke"
              className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              required
            />
          </div>

          {/* Team Name Input */}
          <div>
            <label htmlFor="coach-team-name" className="block text-slate-400 uppercase font-bold text-[11px] mb-1">
              Registered Team Name *
            </label>
            <input
              id="coach-team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. eagles, Mighty Blacks, Sharklets"
              className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              required
            />
          </div>

          {/* REAL-TIME TEAM NAME NORMALIZATION PREVIEW */}
          {normalizedPreview && (
            <div
              className={`p-3.5 rounded-2xl border space-y-1.5 ${
                isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Live Normalization Preview
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Input: &quot;{normalizedPreview.raw_input}&quot;</span>
                <span className="text-emerald-500 font-black">
                  Canonical Display: {normalizedPreview.canonical_display_name}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                System Key: {normalizedPreview.normalized_comparison_key}
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px] transition-all shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:opacity-50"
          >
            {isSubmitting ? 'Validating & Normalizing Registration...' : 'Submit & Normalize Coach Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};
