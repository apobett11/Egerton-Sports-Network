import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#ff0046]" />
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Direct Squad Intake
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                First Name
              </label>
              <input
                type="text"
                id="invite-player-firstname"
                placeholder="e.g. Victor"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ouma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Jersey Number
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
              >
                <option value="GK">Goalkeeper (GK)</option>
                <option value="DEF">Defender (DEF)</option>
                <option value="MID">Midfielder (MID)</option>
                <option value="FWD">Forward (FWD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Preferred Foot
              </label>
              <select
                value={preferredFoot}
                onChange={(e) => setPreferredFoot(e.target.value as any)}
                className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="both">Both / Dual</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Student ID # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. S13/12345/23"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Phone Contact (Optional)
            </label>
            <input
              type="tel"
              placeholder="+254 700 000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
            />
          </div>

          <div className="pt-3 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full bg-[#ff0046] hover:bg-[#e0003c] text-white font-black text-xs cursor-pointer shadow-xs"
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
