import React, { useState } from 'react';
import { X, UserPlus, Shield } from 'lucide-react';
import { registerPlayerToTeam } from '../../lib/supabaseClient';

interface InvitePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onPlayerAdded?: () => void;
  onShowToast: (msg: string) => void;
}

export const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onPlayerAdded,
  onShowToast,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [position, setPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [preferredFoot, setPreferredFoot] = useState<'right' | 'left' | 'both'>('right');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      onShowToast('Please provide the player first name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerPlayerToTeam({
        teamId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jerseyNumber: Number(jerseyNumber),
        position,
        preferredFoot,
        studentId: studentId.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (res.error) {
        onShowToast(`Notice: ${res.error}`);
      } else {
        onShowToast(`Successfully registered #${jerseyNumber} ${firstName} ${lastName}!`);
      }

      if (onPlayerAdded) onPlayerAdded();
      onClose();
    } catch (err: any) {
      onShowToast(`Player intake note: ${err.message || 'Saved'}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] to-[#00b04f]" />

        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                Direct Squad Intake
              </h3>
              <p className="text-[11px] text-slate-400">
                Register an authentic varsity athlete to the active roster
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                First Name <span className="text-[#ff0046]">*</span>
              </label>
              <input
                type="text"
                id="invite-player-firstname"
                placeholder="e.g. Victor"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Last Name <span className="text-[#ff0046]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ouma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Jersey Number <span className="text-[#ff0046]">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold font-mono text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
              >
                <option value="GK">Goalkeeper (GK)</option>
                <option value="DEF">Defender (DEF)</option>
                <option value="MID">Midfielder (MID)</option>
                <option value="FWD">Forward (FWD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Preferred Foot
              </label>
              <select
                value={preferredFoot}
                onChange={(e) => setPreferredFoot(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="both">Both / Dual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Student ID # <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. S13/12345/23"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Phone Contact <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              placeholder="+254 700 000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-[#1a324e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#ff0046] hover:bg-[#e0003c] text-white font-bold text-xs cursor-pointer shadow-xs hover:shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvitePlayerModal;
