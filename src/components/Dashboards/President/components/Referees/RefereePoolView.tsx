import React, { useState } from 'react';
import { UserCheck, Plus, MoreVertical } from 'lucide-react';
import type { RefereeItem } from '../../types';

interface RefereePoolViewProps {
  isDark: boolean;
  referees: RefereeItem[];
  handleAddReferee: (ref: { name: string; email: string; phone: string }) => Promise<void> | void;
  handleUpdateRefStatus: (id: string, status: 'Active' | 'Suspended' | 'Deactivated') => Promise<void> | void;
  handleDeleteReferee: (id: string) => Promise<void> | void;
}

export const RefereePoolView: React.FC<RefereePoolViewProps> = ({
  isDark,
  referees,
  handleAddReferee,
  handleUpdateRefStatus,
  handleDeleteReferee,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Referee Management
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Register center referees for the upcoming season and manage active referee statuses.
        </p>
      </div>

      {/* REFEREE TABLE (TOP) */}
      <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Registered Referees ({referees.length})
          </h3>
        </div>

        {referees.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            No referees registered yet. Use the form below to register a referee.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {referees.map((r) => (
                  <tr key={r.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    <td className="px-4 py-3 font-black">{r.name}</td>
                    <td className="px-4 py-3 text-slate-400">{r.email || '-'}</td>
                    <td className="px-4 py-3 font-mono">{r.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          r.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                            : r.status === 'Suspended'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const action = e.target.value;
                          if (action === 'suspend') handleUpdateRefStatus(r.id, 'Suspended');
                          if (action === 'activate') handleUpdateRefStatus(r.id, 'Active');
                          if (action === 'delete') handleDeleteReferee(r.id);
                          e.target.value = '';
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border focus:outline-none ${
                          isDark
                            ? 'bg-[#090D16] border-slate-800 text-slate-200'
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

      {/* ADD REFEREE FORM (BELOW TABLE) */}
      <div className={`p-6 md:p-8 rounded-3xl border elevation-card space-y-6 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Referee</h3>
            <p className="text-xs text-slate-400 font-medium">Register a official center referee for pre-season pool allocation.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name (e.g. Ref. Peter Ndambuki)"
              className={`w-full p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={`w-full p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (+254 7...)"
              className={`w-full p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              required
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Referee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
