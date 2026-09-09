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
        onShowToast(`Successfully added #${jerseyNumber} ${firstName} ${lastName} to squad!`);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161B22] border border-[#2A3441] rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#2A3441] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Squad Player Intake</h3>
              <p className="text-xs text-slate-400">Official club player intake and roster registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0D1117] border border-[#2A3441] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">First Name</label>
              <input
                type="text"
                id="invite-player-firstname"
                placeholder="e.g. Victor"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Last Name</label>
              <input
                type="text"
                id="invite-player-lastname"
                placeholder="e.g. Wanyama"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Student ID / Reg No</label>
              <input
                type="text"
                id="invite-player-studentid"
                placeholder="e.g. S13/12345/22"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Phone / WhatsApp</label>
              <input
                type="tel"
                id="invite-player-phone"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Jersey Number</label>
              <input
                type="number"
                id="invite-jersey-number"
                min={1}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number(e.target.value))}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Pitch Position</label>
              <select
                id="invite-position"
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="GK">Goalkeeper (GK)</option>
                <option value="DEF">Defender (DEF)</option>
                <option value="MID">Midfielder (MID)</option>
                <option value="FWD">Forward (FWD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Preferred Foot</label>
            <div className="grid grid-cols-3 gap-2">
              {(['right', 'left', 'both'] as const).map((foot) => (
                <button
                  type="button"
                  key={foot}
                  onClick={() => setPreferredFoot(foot)}
                  className={`py-1.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                    preferredFoot === foot
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#0D1117] text-slate-400 border-[#2A3441]'
                  }`}
                >
                  {foot}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2A3441] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-invite-player"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black hover:brightness-110 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Register Player'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
