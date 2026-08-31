import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  XCircle,
  Shield,
  Eye,
  Flag,
  RotateCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import type {
  OperationalMatch,
  SeasonReferee,
  SeasonPitch,
  RefereeEligibility,
} from '../../types/seasonMode';
import { seasonOperationsService } from '../../services/seasonOperationsService';
import { COMPETITIONS } from '../../constants/seasonConstants';

interface MatchesViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  expandedMatchId: string | null;
  onToggleExpandMatch: (id: string) => void;
  onSwapReferee: (matchId: string, newRefId: string) => void;
  onShiftMatch: (matchId: string, newTime: string, newVenue?: string) => void;
  onCancelMatch: (matchId: string, reason: string) => void;
  onFlagLinesmanDefault: (matchId: string, team: 1 | 2) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  isDark,
  fixtures,
  referees,
  pitches,
  expandedMatchId,
  onToggleExpandMatch,
  onSwapReferee,
  onShiftMatch,
  onCancelMatch,
  onFlagLinesmanDefault,
}) => {
  // Filters
  const [competitionFilter, setCompetitionFilter] = useState<'ALL' | 'EPL' | 'CHAMPIONSHIP' | 'FRIENDLY'>('ALL');
  const [matchdayFilter, setMatchdayFilter] = useState<string>('ALL');

  // Modals
  const [swapModalMatch, setSwapModalMatch] = useState<OperationalMatch | null>(null);
  const [shiftModalMatch, setShiftModalMatch] = useState<OperationalMatch | null>(null);
  const [cancelModalMatch, setCancelModalMatch] = useState<OperationalMatch | null>(null);
  const [viewModalMatch, setViewModalMatch] = useState<OperationalMatch | null>(null);

  // Form inputs for Shift Match
  const [shiftDate, setShiftDate] = useState<string>('');
  const [shiftTime, setShiftTime] = useState<string>('');
  const [shiftVenue, setShiftVenue] = useState<string>('');

  // Form inputs for Cancel Match
  const [cancelReason, setCancelReason] = useState<string>('');

  // Filtered fixtures
  const filteredFixtures = fixtures.filter((f) => {
    if (competitionFilter === 'EPL' && f.competition_id !== COMPETITIONS.PREMIER_LEAGUE.id) return false;
    if (competitionFilter === 'CHAMPIONSHIP' && f.competition_id !== COMPETITIONS.CHAMPIONSHIP.id) return false;
    if (competitionFilter === 'FRIENDLY' && !f.is_friendly && f.competition_id !== 'friendlies') return false;
    if (matchdayFilter !== 'ALL' && f.matchday !== Number(matchdayFilter)) return false;
    return true;
  });

  const handleConfirmShift = () => {
    if (shiftModalMatch && shiftDate && shiftTime) {
      const scheduledTime = `${shiftDate}T${shiftTime}:00`;
      onShiftMatch(shiftModalMatch.id, scheduledTime, shiftVenue || shiftModalMatch.venue);
      setShiftModalMatch(null);
    }
  };

  const handleConfirmCancel = () => {
    if (cancelModalMatch) {
      onCancelMatch(cancelModalMatch.id, cancelReason || 'Presidential Operational Decision');
      setCancelModalMatch(null);
      setCancelReason('');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Match Operations & Referee Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Expand a match card to inspect linesmen duty, swap referees with algorithm conflict checks, or shift match schedules.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={competitionFilter}
            onChange={(e) => setCompetitionFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">Both Competitions & Friendlies</option>
            <option value="EPL">Egerton Premier League</option>
            <option value="CHAMPIONSHIP">Egerton Championships</option>
            <option value="FRIENDLY">Friendlies Only</option>
          </select>

          <select
            value={matchdayFilter}
            onChange={(e) => setMatchdayFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Matchdays</option>
            {Array.from(new Set(fixtures.map((f) => f.matchday).filter(Boolean)))
              .sort((a, b) => (a as number) - (b as number))
              .map((md) => (
                <option key={md} value={String(md)}>
                  Matchday {md}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Match Cards List */}
      <div className="space-y-3">
        {filteredFixtures.length === 0 ? (
          <div className="p-8 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs font-bold">
            No matches found for the selected filter parameters.
          </div>
        ) : (
          filteredFixtures.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            const isEpl = match.competition_id === COMPETITIONS.PREMIER_LEAGUE.id;
            const isFriendly = match.is_friendly || match.competition_id === 'friendlies';

            const homeName = match.home_team?.name || 'Home Team';
            const awayName = match.away_team?.name || 'Away Team';
            const refName = match.referee?.name || 'Unassigned Referee';
            const timeFormatted = match.scheduled_time
              ? new Date(match.scheduled_time).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'TBD';

            const linesmen = match.linesmen || {
              linesman_team1_name: `${match.home_team?.short_name || 'Home'} Linesman`,
              linesman_team1_status: 'Assigned' as const,
              linesman_team2_name: `${match.away_team?.short_name || 'Away'} Linesman`,
              linesman_team2_status: 'Assigned' as const,
            };

            return (
              <div
                key={match.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? isDark
                      ? 'bg-[#0E1424] border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                      : 'bg-white border-emerald-500 shadow-md'
                    : isDark
                    ? 'bg-[#0E1424]/80 border-slate-800/80 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* CLOSED SUMMARY BAR */}
                <div
                  onClick={() => onToggleExpandMatch(match.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isFriendly
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : isEpl
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {isFriendly ? 'FRIENDLY' : isEpl ? 'EPL' : 'Championship'}
                    </span>

                    <div className="text-xs font-black text-slate-400">
                      {isFriendly ? match.friendly_name || 'Friendly Match' : `Matchday ${match.matchday}`}
                    </div>
                  </div>

                  {/* Team vs Team */}
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <span>{homeName}</span>
                    <span className="text-emerald-500 text-xs px-2 py-0.5 rounded bg-emerald-500/10">vs</span>
                    <span>{awayName}</span>
                  </div>

                  {/* Venue & Time */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {timeFormatted}
                    </span>
                    <span className="hidden md:flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {match.venue}
                    </span>
                    <span className="hidden lg:flex items-center gap-1 text-slate-300 font-bold">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      {refName}
                    </span>
                  </div>

                  {/* Status & Expand Trigger */}
                  <div className="flex items-center gap-3 justify-end">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        match.status === 'FT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : match.status === 'CANCELLED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : match.status === 'POSTPONED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {match.status}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* EXPANDED OPERATIONAL BODY */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/60 space-y-5 animate-fadeIn">
                    {/* Linesmen Duty Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Flag className="w-4 h-4 text-emerald-500" /> Assistant Referees / Linesmen Assignments
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Linesman 1 */}
                        <div
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            linesmen.linesman_team1_status === 'Defaulted'
                              ? 'bg-rose-950/20 border-rose-800/40'
                              : isDark
                              ? 'bg-slate-900/60 border-slate-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-extrabold uppercase text-slate-400">Linesman Team 1</div>
                            <div className="font-extrabold text-xs text-slate-200">
                              {linesmen.linesman_team1_name}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                linesmen.linesman_team1_status === 'Defaulted'
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              Status: {linesmen.linesman_team1_status}
                            </span>
                          </div>

                          {linesmen.linesman_team1_status !== 'Defaulted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onFlagLinesmanDefault(match.id, 1);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-extrabold cursor-pointer border border-rose-500/20"
                            >
                              Flag Default
                            </button>
                          )}
                        </div>

                        {/* Linesman 2 */}
                        <div
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            linesmen.linesman_team2_status === 'Defaulted'
                              ? 'bg-rose-950/20 border-rose-800/40'
                              : isDark
                              ? 'bg-slate-900/60 border-slate-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-extrabold uppercase text-slate-400">Linesman Team 2</div>
                            <div className="font-extrabold text-xs text-slate-200">
                              {linesmen.linesman_team2_name}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                linesmen.linesman_team2_status === 'Defaulted'
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              Status: {linesmen.linesman_team2_status}
                            </span>
                          </div>

                          {linesmen.linesman_team2_status !== 'Defaulted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onFlagLinesmanDefault(match.id, 2);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-extrabold cursor-pointer border border-rose-500/20"
                            >
                              Flag Default
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PRESIDENT ACTION BUTTONS */}
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwapModalMatch(match);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Swap Referee</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShiftModalMatch(match);
                          if (match.scheduled_time) {
                            const [d, t] = match.scheduled_time.split('T');
                            setShiftDate(d);
                            setShiftTime(t ? t.slice(0, 5) : '15:00');
                          }
                          setShiftVenue(match.venue);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Shift Match</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewModalMatch(match);
                        }}
                        className={`px-3.5 py-2 rounded-xl border font-extrabold text-xs cursor-pointer flex items-center gap-1.5 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-400" />
                        <span>View Match Details</span>
                      </button>

                      {match.status !== 'CANCELLED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelModalMatch(match);
                            setCancelReason('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs cursor-pointer border border-rose-500/20 flex items-center gap-1.5 ml-auto"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Match</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* REFEREE SWAP UX MODAL (ALGORITHM 4 INTEGRATION) */}
      {swapModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl p-6 rounded-3xl border space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Swap Referee</h3>
                <p className="text-xs text-slate-400">
                  {swapModalMatch.home_team?.name} vs {swapModalMatch.away_team?.name}
                </p>
              </div>
              <button
                onClick={() => setSwapModalMatch(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Current Referee:{' '}
              <span className="font-extrabold text-white">
                {swapModalMatch.referee?.name || 'Unassigned'}
              </span>
            </div>

            {/* Eligible Referee List derived from Algorithm 4 */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Operationally Eligible Referees
              </h4>

              {(() => {
                const eligibilities = seasonOperationsService.getEligibleRefereesForSwap(
                  swapModalMatch,
                  referees,
                  fixtures
                );

                return (
                  <div className="space-y-2">
                    {eligibilities.map(({ referee, is_eligible, rejection_reasons, fatigue_warning }) => (
                      <div
                        key={referee.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                          !is_eligible
                            ? 'bg-slate-900/40 border-slate-800 opacity-60'
                            : isDark
                            ? 'bg-slate-900 border-slate-700 hover:border-emerald-500/50'
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-xs flex items-center gap-2">
                            <span>{referee.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              {referee.tier || 'Mixed'}
                            </span>
                            {fatigue_warning && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                Fatigue Warning
                              </span>
                            )}
                          </div>
                          {!is_eligible && (
                            <p className="text-[10px] text-rose-400 font-medium">
                              Ineligible: {rejection_reasons.join('; ')}
                            </p>
                          )}
                        </div>

                        {is_eligible && referee.id !== swapModalMatch.referee_id && (
                          <button
                            onClick={() => {
                              onSwapReferee(swapModalMatch.id, referee.id);
                              setSwapModalMatch(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-sm"
                          >
                            Assign Swap
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SHIFT MATCH MODAL */}
      {shiftModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="font-black text-lg">Shift Match Schedule</h3>
            <p className="text-xs text-slate-400">
              {shiftModalMatch.home_team?.name} vs {shiftModalMatch.away_team?.name}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">New Date</label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">New Kick-off Time</label>
                <input
                  type="time"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Venue Pitch</label>
                <select
                  value={shiftVenue}
                  onChange={(e) => setShiftVenue(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  {pitches.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.short_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShiftModalMatch(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-extrabold text-xs cursor-pointer hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShift}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer shadow-md"
              >
                Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MATCH MODAL */}
      {cancelModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-lg">Cancel Match?</h3>
            </div>
            <p className="text-xs text-slate-400">
              {cancelModalMatch.home_team?.name} vs {cancelModalMatch.away_team?.name}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Reason for Cancellation</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none mt-1 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelModalMatch(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-extrabold text-xs cursor-pointer hover:bg-slate-800"
              >
                Keep Match
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-md"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MATCH DETAILS MODAL */}
      {viewModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg">Full Operational Match Record</h3>
              <button
                onClick={() => setViewModalMatch(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Match ID</span>
                  <span className="text-slate-200 font-mono">{viewModalMatch.id}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Competition</span>
                  <span className="text-emerald-400 font-bold">
                    {viewModalMatch.competition_id === COMPETITIONS.PREMIER_LEAGUE.id
                      ? 'Egerton Premier League'
                      : 'Egerton Championships'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Matchday</span>
                  <span className="text-white">Matchday {viewModalMatch.matchday}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Status</span>
                  <span className="text-blue-400">{viewModalMatch.status}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="font-extrabold text-slate-300">Scheduled Officials & Venue</div>
                <div className="text-slate-400">Venue: <span className="text-white">{viewModalMatch.venue}</span></div>
                <div className="text-slate-400">Center Referee: <span className="text-white">{viewModalMatch.referee?.name || 'Unassigned'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
