import React, { useState, useRef } from 'react';
import { UserCheck, Plus, Copy, Share2, Check } from 'lucide-react';
import type { RefereeItem } from '../../types';

interface RefereePoolViewProps {
  isDark: boolean;
  referees: RefereeItem[];
  handleAddReferee: (ref: { name: string; email: string; phone: string }) => Promise<void> | void;
  handleUpdateRefStatus: (id: string, status: 'Active' | 'Suspended' | 'Deactivated') => Promise<void> | void;
  handleDeleteReferee: (id: string) => Promise<void> | void;
  showToast?: (msg: string) => void;
  isScheduleLocked?: boolean;
}

export const RefereePoolView: React.FC<RefereePoolViewProps> = ({
  isDark,
  referees,
  handleAddReferee,
  handleUpdateRefStatus,
  handleDeleteReferee,
  showToast,
  isScheduleLocked = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const refFormRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const REFEREE_REGISTRATION_URL = 'https://livescore.egerton.ac.ke/register/referee';

  const scrollToForm = () => {
    refFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 350);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(REFEREE_REGISTRATION_URL);
      setCopied(true);
      if (showToast) showToast('Copied referee registration link to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (showToast) showToast(`Link: ${REFEREE_REGISTRATION_URL}`);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Official Invitation: You are invited to register as a referee for the upcoming Egerton Sports Network pre-season. Please complete your registration here: ${REFEREE_REGISTRATION_URL}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsSubmitting(true);
    try {
      await handleAddReferee({ name, email, phone });
      setName('');
      setEmail('');
      setPhone('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTION BUTTONS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Referee Management
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Register center referees for the upcoming season, manage active statuses, and share registration links.
          </p>
        </div>

        {/* PROMINENT TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={scrollToForm}
            className="px-4 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Referee
          </button>

          <button
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-2 ${
              copied
                ? 'bg-[#00b04f] text-white border-[#00b04f]'
                : isDark
                ? 'bg-[#152a40] hover:bg-[#1c3857] border-white/10 text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="px-4 py-2.5 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share via WhatsApp
          </button>
        </div>
      </div>

      {/* REFEREE TABLE (TOP) */}
      <div className={`p-4 sm:p-5 rounded-none sm:rounded-sm border space-y-4 shadow-xs ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className="flex items-center justify-between border-b pb-3 border-[#14263b]">
          <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Registered Referees ({referees.length})
          </h3>
        </div>

        {referees.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            No referees registered yet. Click "Add Referee" or use the registration form below.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#112236] border-[#1a2e45] text-slate-400' : 'bg-[#f8f9fa] border-[#e6e8ec] text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14263b]">
                {referees.map((r) => (
                  <tr key={r.id} className={`hover:bg-[#13263b] transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <td className="px-4 py-2.5 font-black">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.email || '-'}</td>
                    <td className="px-4 py-2.5 font-mono">{r.phone}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider ${
                          r.status === 'Active'
                            ? 'bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/30'
                            : r.status === 'Suspended'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-rose-500/10 text-[#ff0046] border border-rose-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const action = e.target.value;
                          if (action === 'suspend') handleUpdateRefStatus(r.id, 'Suspended');
                          if (action === 'activate') handleUpdateRefStatus(r.id, 'Active');
                          if (action === 'delete') handleDeleteReferee(r.id);
                          e.target.value = '';
                        }}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer border focus:outline-none focus:border-[#ff0046] ${
                          isDark
                            ? 'bg-[#15273b] border-[#223b56] text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="" disabled>Select Action</option>
                        {r.status !== 'Suspended' && <option value="suspend">Suspend</option>}
                        {r.status !== 'Active' && <option value="activate">Activate</option>}
                        <option value="delete">Delete</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD REFEREE FORM (BELOW TABLE) WITH REF FOR SMOOTH SCROLLING */}
      <div ref={refFormRef} id="add-referee-form" className={`p-4 sm:p-6 rounded-none sm:rounded-sm border space-y-5 shadow-xs ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className="flex items-center gap-3 border-b pb-3 border-[#14263b]">
          <div className="w-8 h-8 rounded-md bg-[#152a40] text-[#ff0046] border border-[#223b56] flex items-center justify-center font-bold">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Referee</h3>
            <p className="text-xs text-slate-400 font-medium">Register an official center referee for pre-season pool allocation.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name (e.g. Ref. Peter Ndambuki)"
              className={`w-full p-2.5 rounded-md border text-xs font-bold focus:border-[#ff0046] focus:outline-none ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-400' : 'bg-white border-[#e6e8ec] text-slate-800'}`}
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={`w-full p-2.5 rounded-md border text-xs font-bold focus:border-[#ff0046] focus:outline-none ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-400' : 'bg-white border-[#e6e8ec] text-slate-800'}`}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (+254 7...)"
              className={`w-full p-2.5 rounded-md border text-xs font-bold focus:border-[#ff0046] focus:outline-none ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-400' : 'bg-white border-[#e6e8ec] text-slate-800'}`}
              required
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Referee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
