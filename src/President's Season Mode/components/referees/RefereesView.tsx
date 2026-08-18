import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  X,
  Phone,
} from 'lucide-react';
import type { SeasonReferee, OperationalMatch } from '../../types/seasonMode';

interface RefereesViewProps {
  isDark: boolean;
  referees: SeasonReferee[];
  fixtures: OperationalMatch[];
  onMarkRefUnavailable: (
    refereeId: string,
    status: 'Unavailable' | 'Suspended' | 'Deactivated' | 'Active',
    reason: string
  ) => void;
  onRemoveReferee?: (refereeId: string) => void;
  onReplaceReferee?: (refereeId: string, replacementRefId: string) => void;
  setActiveView: (view: any) => void;
}

export const RefereesView: React.FC<RefereesViewProps> = ({
  isDark,
  referees,
  fixtures,
  onMarkRefUnavailable,
  onRemoveReferee,
  onReplaceReferee,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Single expanded referee card ID state (Progressive Disclosure)
  const [expandedRefId, setExpandedRefId] = useState<string | null>(null);

  // Mark Unavailable Modal State
  const [selectedRefForUnavailable, setSelectedRefForUnavailable] = useState<SeasonReferee | null>(null);
  const [unavailableReasonType, setUnavailableReasonType] = useState<'Medical Absence' | 'Official Duty' | 'Personal' | 'Other'>('Medical Absence');
  const [reasonNotes, setReasonNotes] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredReferees = referees.filter((ref) => {
    const matchesSearch =
      ref.name.toLowerCase().includes(searchTerm.toLowerCase()) || ref.phone.includes(searchTerm);
    if (tierFilter === 'EPL' && ref.tier !== 'EPL_Exclusive') return false;
    if (tierFilter === 'CHAMPIONSHIP' && ref.tier !== 'Championship') return false;
    if (tierFilter === 'MIXED' && ref.tier !== 'Mixed') return false;
    return matchesSearch;
  });

  const handleConfirmMarkUnavailable = () => {
    if (selectedRefForUnavailable) {
      onMarkRefUnavailable(
        selectedRefForUnavailable.id,
        'Unavailable',
        `${unavailableReasonType}: ${reasonNotes}`
      );
      setSelectedRefForUnavailable(null);
      setReasonNotes('');
    }
  };

  const handleToggleExpandRef = (id: string) => {
    setExpandedRefId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Referee Pool Oversight & Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-world referee management, tier classifications, daily assignment workload, and availability states.
          </p>
        </div>

        {/* Search & Tier Filter */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search referee name..."
              className="bg-transparent outline-none text-xs w-32 sm:w-40"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Tiers</option>
            <option value="EPL">EPL Exclusive</option>
            <option value="MIXED">Mixed Pool</option>
            <option value="CHAMPIONSHIP">Championship Pool</option>
          </select>
        </div>
      </div>

      {/* REFEREE INLINE CARDS LIST */}
      <div className="space-y-3">
        {filteredReferees.map((ref) => {
          const isExpanded = expandedRefId === ref.id;
          const isAvailable = ref.status === 'Active';

          const assignmentsToday = fixtures.filter(
            (f) => f.referee_id === ref.id && f.scheduled_time?.startsWith(todayStr) && f.status !== 'CANCELLED'
          );
          const upcomingAssignments = fixtures.filter(
            (f) => f.referee_id === ref.id && f.status === 'UPCOMING'
          );

          return (
            <div
              key={ref.id}
              className={`p-4 rounded-2xl border transition-all ${
                !isAvailable
                  ? isDark
                    ? 'bg-slate-900/30 border-slate-800 opacity-70'
                    : 'bg-slate-100 border-slate-200'
                  : isDark
                  ? isExpanded
                    ? 'bg-[#121A2E] border-emerald-500/50 shadow-lg'
                    : 'bg-[#0E1424] border-slate-800 hover:border-slate-700'
                  : isExpanded
                  ? 'bg-emerald-50/50 border-emerald-400 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* COMPACT INLINE ROW */}
              <div
                onClick={() => handleToggleExpandRef(ref.id)}
                className="flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {ref.name}
                      </h3>
                      {ref.badge_level?.includes('FIFA') && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          FIFA
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{ref.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-extrabold hidden sm:inline-block">
                    {ref.tier || 'Mixed Pool'}
                  </span>

                  <span className="text-[11px] font-bold text-slate-400 hidden md:inline-block">
                    {assignmentsToday.length} today
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ref.status}
                  </span>

                  <button
                    aria-label="Expand referee details"
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* EXPANDED DETAILS (Progressive Disclosure) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Badge Tier</span>
                      <div className="font-extrabold text-white">{ref.badge_level || 'FKF National Level 2'}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Assignments Today</span>
                      <div className="font-extrabold text-emerald-400">{assignmentsToday.length} match(es) scheduled</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Upcoming</span>
                      <div className="font-extrabold text-blue-400">{upcomingAssignments.length} match(es) total</div>
                    </div>
                  </div>

                  {/* Operational Actions */}
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    {isAvailable ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRefForUnavailable(ref);
                            setReasonNotes('');
                          }}
                          className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Mark Unavailable</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onRemoveReferee) onRemoveReferee(ref.id);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-rose-600 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Remove from Future Assignments</span>
                        </button>

                        <button
                          onClick={() => {
                            const replacement = referees.find((r) => r.id !== ref.id && r.status === 'Active');
                            if (replacement && onReplaceReferee) {
                              onReplaceReferee(ref.id, replacement.id);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Replace Referee</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onMarkRefUnavailable(ref.id, 'Active', 'Restored to Active Status')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Restore Available</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MARK UNAVAILABLE MODAL */}
      {selectedRefForUnavailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
              <h3 className="font-black text-base">Mark {selectedRefForUnavailable.name} Unavailable</h3>
              <button
                onClick={() => setSelectedRefForUnavailable(null)}
                aria-label="Close referee availability modal"
                className="p-1 text-slate-400 hover:text-white cursor-pointer rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Reason Classification</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {(['Medical Absence', 'Official Duty', 'Personal', 'Other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUnavailableReasonType(type)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                        unavailableReasonType === type
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Notes / Details</label>
                <input
                  type="text"
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  placeholder="e.g. FKF Regional Seminar Duty..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setSelectedRefForUnavailable(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-extrabold text-xs cursor-pointer hover:bg-slate-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkUnavailable}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-md min-h-[44px]"
              >
                Confirm & Save Referee Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
