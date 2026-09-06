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
            className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs ${
              isDark ? 'bg-[#15273b] border-[#1a2e45] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search referee name..."
              className="bg-transparent outline-none text-xs w-32 sm:w-40 placeholder:text-slate-500"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className={`px-3 py-2 rounded-sm border text-xs font-bold outline-none cursor-pointer transition-colors ${
              isDark ? 'bg-[#15273b] border-[#1a2e45] text-slate-200 focus:border-[#ff0046]' : 'bg-slate-100 border-slate-300 text-slate-800'
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
              className={`p-4 rounded-sm border transition-all ${
                !isAvailable
                  ? isDark
                    ? 'bg-[#0e1c2b]/50 border-[#1a2e45] opacity-70'
                    : 'bg-slate-100 border-slate-200'
                  : isDark
                  ? isExpanded
                    ? 'bg-[#0e1c2b] border-[#ff0046] shadow-md shadow-[#ff0046]/10'
                    : 'bg-[#0e1c2b] border-[#1a2e45] hover:border-[#1a2e45]/80'
                  : isExpanded
                  ? 'bg-white border-[#ff0046] shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* COMPACT INLINE ROW */}
              <div
                onClick={() => handleToggleExpandRef(ref.id)}
                className="flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xs bg-[#15273b] border border-[#1a2e45] text-slate-300 flex items-center justify-center font-black text-sm shrink-0">
                    <UserCheck className="w-4 h-4 text-slate-300" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {ref.name}
                      </h3>
                      {ref.badge_level?.includes('FIFA') && (
                        <span className="px-2 py-0.5 rounded-xs text-[9px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
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
                  <span className="px-2.5 py-1 rounded-xs bg-[#152a40] text-slate-300 border border-[#1a2e45] text-[10px] font-extrabold hidden sm:inline-block">
                    {ref.tier || 'Mixed Pool'}
                  </span>

                  <span className="text-[11px] font-bold text-slate-400 hidden md:inline-block">
                    {assignmentsToday.length} today
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider ${
                      isAvailable
                        ? 'bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30'
                        : 'bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30'
                    }`}
                  >
                    {ref.status}
                  </span>

                  <button
                    aria-label="Expand referee details"
                    className="p-1 text-slate-400 hover:text-white rounded-xs cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#ff0046]" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* EXPANDED DETAILS (Progressive Disclosure) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1a2e45] space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xs bg-[#102237] border border-[#1a2e45] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Badge Tier</span>
                      <div className="font-extrabold text-white">{ref.badge_level || 'FKF National Level 2'}</div>
                    </div>

                    <div className="p-3 rounded-xs bg-[#102237] border border-[#1a2e45] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Assignments Today</span>
                      <div className="font-extrabold text-[#00b04f]">{assignmentsToday.length} match(es) scheduled</div>
                    </div>

                    <div className="p-3 rounded-xs bg-[#102237] border border-[#1a2e45] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Upcoming</span>
                      <div className="font-extrabold text-slate-200">{upcomingAssignments.length} match(es) total</div>
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
                          className="px-4 py-2.5 rounded-xs border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Mark Unavailable</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onRemoveReferee) onRemoveReferee(ref.id);
                          }}
                          className="px-4 py-2.5 rounded-xs border border-rose-800 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2"
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
                          className="px-4 py-2.5 rounded-xs bg-[#ff0046] hover:bg-[#e0003e] text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Replace Referee</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onMarkRefUnavailable(ref.id, 'Active', 'Restored to Active Status')}
                        className="px-4 py-2.5 rounded-xs bg-[#00b04f] hover:bg-[#009b45] text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-sm"
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
            className={`w-full max-w-md p-6 rounded-xl border border-[#1a2e45] space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0e1e2d] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <h3 className="font-black text-base">Mark {selectedRefForUnavailable.name} Unavailable</h3>
              <button
                onClick={() => setSelectedRefForUnavailable(null)}
                aria-label="Close referee availability modal"
                className="p-1 text-slate-400 hover:text-white cursor-pointer rounded-xs hover:bg-[#152a40] transition-colors"
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
                      className={`py-2 px-1 rounded-xs text-[11px] font-bold border cursor-pointer transition-all ${
                        unavailableReasonType === type
                          ? 'bg-[#ff0046] text-white border-[#ff0046]'
                          : 'bg-[#15273b] border-[#1a2e45] text-slate-300 hover:border-slate-600'
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
                  className={`w-full px-3.5 py-2.5 rounded-xs border text-xs outline-none mt-1 ${
                    isDark ? 'bg-[#15273b] border-[#1a2e45] text-white focus:border-[#ff0046]' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setSelectedRefForUnavailable(null)}
                className="w-1/2 py-2.5 rounded-xs border border-[#1a2e45] text-slate-400 font-extrabold text-xs cursor-pointer hover:bg-[#152a40] hover:text-white min-h-[44px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkUnavailable}
                className="w-1/2 py-2.5 rounded-xs bg-[#ff0046] hover:bg-[#e0003e] text-white font-extrabold text-xs cursor-pointer shadow-md min-h-[44px] transition-colors"
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
