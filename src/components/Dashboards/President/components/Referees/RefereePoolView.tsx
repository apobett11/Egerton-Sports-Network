import React from 'react';
import { Plus } from 'lucide-react';
import type { RefereeItem } from '../../types';

interface RefereePoolViewProps {
  isDark: boolean;
  referees: RefereeItem[];
  linesmanRule: number;
  setLinesmanRule: (rule: number) => void;
  neutralTeamRule: boolean;
  setNeutralTeamRule: (neutral: boolean) => void;
  maxRefCapacity: number;
  setMaxRefCapacity: (cap: number) => void;
  setShowAddRefModal: (show: boolean) => void;
  handleToggleRefStatus: (id: string) => void;
}

export const RefereePoolView: React.FC<RefereePoolViewProps> = ({
  isDark,
  referees,
  linesmanRule,
  setLinesmanRule,
  neutralTeamRule,
  setNeutralTeamRule,
  maxRefCapacity,
  setMaxRefCapacity,
  setShowAddRefModal,
  handleToggleRefStatus,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            TAB 3 — Referee Pool Setup
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage referee accreditations, season availability, linesman allocation rules, and neutral team rules.
          </p>
        </div>

        <button
          onClick={() => setShowAddRefModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Center Referee
        </button>
      </div>

      {/* ALLOCATION RULES CONFIG PANEL */}
      <div className={`p-6 rounded-3xl border elevation-card grid grid-cols-1 md:grid-cols-3 gap-6 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Linesman Allocation Rule</label>
          <select
            value={linesmanRule}
            onChange={(e) => setLinesmanRule(Number(e.target.value))}
            className={`w-full p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          >
            <option value={2}>2 Linesmen Required per Match</option>
            <option value={1}>1 Assistant Referee per Match</option>
            <option value={0}>Optional Linesmen</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Neutral Team Rule</label>
          <button
            onClick={() => setNeutralTeamRule(!neutralTeamRule)}
            className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
              neutralTeamRule
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
          >
            <span>Strict Neutral Affiliation</span>
            <span>{neutralTeamRule ? 'ENABLED ✓' : 'DISABLED'}</span>
          </button>
        </div>

        <div>
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Max Match Capacity / Week</label>
          <input
            type="number"
            value={maxRefCapacity}
            onChange={(e) => setMaxRefCapacity(Number(e.target.value))}
            className={`w-full p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          />
        </div>
      </div>

      {/* REFEREE LIST TABLE */}
      <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Certified Referee Roster ({referees.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3">Referee Name</th>
                <th className="px-4 py-3">Badge & Exp</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {referees.map((r) => (
                <tr key={r.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  <td className="px-4 py-3 font-black">{r.name}</td>
                  <td className="px-4 py-3">
                    <div>{r.badgeLevel}</div>
                    <span className="text-[10px] text-slate-500">{r.experience}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{r.phone}</td>
                  <td className="px-4 py-3 font-bold text-emerald-500">{r.availability}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${r.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleRefStatus(r.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      Toggle Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
