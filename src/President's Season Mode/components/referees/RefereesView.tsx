import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Phone, Mail, Award, Search, UserPlus } from 'lucide-react';
import type { SeasonReferee } from '../../types/seasonMode';
import { OPERATIONAL_STATUS_COLORS, REFEREE_TIERS } from '../../constants/seasonConstants';

interface RefereesViewProps {
  isDark: boolean;
  referees: SeasonReferee[];
  onOpenRefModal: () => void;
}

export const RefereesView: React.FC<RefereesViewProps> = ({
  isDark,
  referees,
  onOpenRefModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  const filteredReferees = referees.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchName = r.name.toLowerCase().includes(q);
    const matchBadge = r.badge_level ? r.badge_level.toLowerCase().includes(q) : false;
    const matchSearch = !q || matchName || matchBadge;
    return matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Official Referee Pool Foundation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Review accredited match officials, badge levels, and operational pool status.
          </p>
        </div>

        <button
          onClick={onOpenRefModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          + Register Center Referee
        </button>
      </div>

      {/* FILTER TOOLBAR */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search referee by name or badge..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none font-medium ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
          <span>Active Pool:</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">
            {referees.filter((r) => r.status === 'Active').length} Verified
          </span>
        </div>
      </div>

      {/* REFEREE CARDS GRID */}
      {filteredReferees.length === 0 ? (
        <div
          className={`p-12 rounded-3xl border text-center space-y-3 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <UserCheck className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="font-extrabold text-sm text-slate-900 dark:text-white">No Referees Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No official referees match your search query. Use the intake button to register new center referees.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReferees.map((ref) => (
            <div
              key={ref.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {ref.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">{ref.name}</h3>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{ref.badge_level || 'FKF National Level 2'}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      OPERATIONAL_STATUS_COLORS[ref.status || 'Active']
                    }`}
                  >
                    {ref.status || 'Active'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/40 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{ref.phone || 'Operational Contact Registered'}</span>
                  </div>
                  {ref.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{ref.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Ref UUID: {ref.id.slice(0, 8)}...</span>
                <span className="text-emerald-400 font-bold">Match Ready</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
