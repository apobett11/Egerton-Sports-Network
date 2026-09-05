import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { generateOfficiatingAssignments, type Algorithm45Input, type TimeSlottedMatch } from '../../../algorithms/algorithm45';
import { createAlgorithmCommand } from '../../../shared/algorithmProtocol';
import { LOCAL_SEED_REFEREES } from '../../constants/seasonConstants';
import type { SeasonReferee } from '../../types/seasonMode';

export interface WeekendRefereeAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onAllocationComplete?: () => void;
}

export interface AllocationMatchItem {
  fixtureId: string;
  matchdayNumber: number;
  playDate: string;
  startTime: string;
  endTime: string;
  competitionId: string;
  leagueType: 'EPL' | 'CHAMPIONSHIP';
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  venue?: string;
  centerRefereeId?: string | null;
  centerRefereeName?: string | null;
}

export const WeekendRefereeAllocationModal: React.FC<WeekendRefereeAllocationModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onAllocationComplete,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [allocating, setAllocating] = useState<boolean>(false);
  const [updatingRefId, setUpdatingRefId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    message: string;
    assignmentsCount: number;
  } | null>(null);

  // Referee lists
  const [refereesList, setRefereesList] = useState<SeasonReferee[]>([]);
  // Target weekend matches
  const [weekendMatches, setWeekendMatches] = useState<AllocationMatchItem[]>([]);
  const [weekendDates, setWeekendDates] = useState<{ saturday: string; sunday: string }>({
    saturday: '',
    sunday: '',
  });

  // Calculate upcoming Saturday and Sunday
  const calculateWeekendDates = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const satOffset = (6 - dayOfWeek + 7) % 7;
    const sat = new Date(now);
    sat.setDate(now.getDate() + satOffset);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    return {
      saturday: sat.toISOString().split('T')[0],
      sunday: sun.toISOString().split('T')[0],
    };
  }, []);

  // Load referees and target weekend matches
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const dates = calculateWeekendDates();
      setWeekendDates(dates);

      // 1. Fetch referees from DB
      const { data: dbRefs, error: refErr } = await supabase
        .from('referees')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      let currentRefs: SeasonReferee[] = [];
      if (!refErr && dbRefs && dbRefs.length > 0) {
        currentRefs = dbRefs as SeasonReferee[];
      } else {
        // Fallback to local seeds
        currentRefs = LOCAL_SEED_REFEREES as SeasonReferee[];
      }
      setRefereesList(currentRefs);

      // 2. Fetch matches for upcoming Saturday and Sunday
      // Try matchday_schedules first
      const { data: schedData } = await supabase
        .from('matchday_schedules')
        .select('*, base_fixtures(*)')
        .in('play_date', [dates.saturday, dates.sunday])
        .order('play_date')
        .order('start_time');

      let targetSchedules = schedData || [];

      // If no schedules match exact dates, fetch the earliest unallocated weekend schedules
      if (targetSchedules.length === 0) {
        const { data: unallocatedSched } = await supabase
          .from('matchday_schedules')
          .select('*, base_fixtures(*)')
          .is('center_referee_id', null)
          .order('matchday_number', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(20);

        if (unallocatedSched && unallocatedSched.length > 0) {
          // Group by play_date to pick the first two play dates (representing the next weekend)
          const datesSet = Array.from(new Set(unallocatedSched.map((s: any) => s.play_date))).slice(0, 2);
          if (datesSet.length > 0) {
            targetSchedules = unallocatedSched.filter((s: any) => datesSet.includes(s.play_date));
            if (datesSet[0]) setWeekendDates({ saturday: datesSet[0], sunday: datesSet[1] || datesSet[0] });
          }
        }
      }

      // Fetch teams to display names
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, short_name, competition_id');

      const teamMap = new Map<string, any>();
      (teamsData || []).forEach((t: any) => teamMap.set(t.id, t));

      const refMap = new Map<string, any>();
      currentRefs.forEach((r) => refMap.set(r.id, r));

      const items: AllocationMatchItem[] = targetSchedules.map((s: any) => {
        const bf = s.base_fixtures || {};
        const homeId = bf.home_team_id || s.home_team_id || '';
        const awayId = bf.away_team_id || s.away_team_id || '';
        const homeTeam = teamMap.get(homeId);
        const awayTeam = teamMap.get(awayId);
        const compId = s.competition_id || bf.competition_id || '11111111-1111-1111-1111-111111111111';
        const isEpl = s.league === 'EPL' || compId.includes('1111');
        const refObj = s.center_referee_id ? refMap.get(s.center_referee_id) : null;

        return {
          fixtureId: s.fixture_id || s.id,
          matchdayNumber: s.matchday_number || 1,
          playDate: s.play_date || dates.saturday,
          startTime: s.start_time || '14:00',
          endTime: s.end_time || '16:00',
          competitionId: compId,
          leagueType: isEpl ? 'EPL' : 'CHAMPIONSHIP',
          homeTeamId: homeId,
          homeTeamName: homeTeam?.name || 'Home Team',
          awayTeamId: awayId,
          awayTeamName: awayTeam?.name || 'Away Team',
          venue: s.pitch_id || 'Campus Ground',
          centerRefereeId: s.center_referee_id || null,
          centerRefereeName: refObj?.name || null,
        };
      });

      setWeekendMatches(items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load referee allocation data.');
    } finally {
      setLoading(false);
    }
  }, [calculateWeekendDates]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSuccessResult(null);
    }
  }, [isOpen, loadData]);

  // Derived available & unavailable lists
  const availableReferees = useMemo(() => {
    return refereesList.filter(
      (r) => r.status === 'Active' || (r.status as string) === 'Available' || !r.status
    );
  }, [refereesList]);

  const unavailableReferees = useMemo(() => {
    return refereesList.filter(
      (r) => r.status === 'Inactive' || r.status === 'Unavailable' || r.status === 'Suspended' || r.status === 'Deactivated'
    );
  }, [refereesList]);

  const totalCount = refereesList.length;
  const availableCount = availableReferees.length;
  const unavailableCount = unavailableReferees.length;

  // Immediate toggle to Unavailable (Remove button)
  const handleRemoveReferee = async (referee: SeasonReferee) => {
    setUpdatingRefId(referee.id);
    try {
      // Postgres check constraint expects 'Inactive'
      const { error } = await supabase
        .from('referees')
        .update({
          status: 'Inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', referee.id);

      if (error) throw error;

      // Immediately update local state
      setRefereesList((prev) =>
        prev.map((r) => (r.id === referee.id ? { ...r, status: 'Inactive' } : r))
      );
    } catch (err: any) {
      setErrorMessage(`Failed to remove referee ${referee.name}: ${err.message}`);
    } finally {
      setUpdatingRefId(null);
    }
  };

  // Immediate toggle to Available (Add button)
  const handleAddReferee = async (referee: SeasonReferee) => {
    setUpdatingRefId(referee.id);
    try {
      const { error } = await supabase
        .from('referees')
        .update({
          status: 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', referee.id);

      if (error) throw error;

      // Immediately update local state
      setRefereesList((prev) =>
        prev.map((r) => (r.id === referee.id ? { ...r, status: 'Active' } : r))
      );
    } catch (err: any) {
      setErrorMessage(`Failed to add referee ${referee.name}: ${err.message}`);
    } finally {
      setUpdatingRefId(null);
    }
  };

  // Confirm and run Agent 0 Algorithm 4 & 5
  const handleConfirmAllocation = async () => {
    if (availableReferees.length === 0) {
      setErrorMessage('At least one available referee is required to run allocation.');
      return;
    }

    if (weekendMatches.length === 0) {
      setErrorMessage('No weekend matches found scheduled for the next Saturday and Sunday.');
      return;
    }

    setAllocating(true);
    setErrorMessage(null);
    try {
      // 1. Prepare Algorithm 4 & 5 Input
      const timeSlottedMatches: TimeSlottedMatch[] = weekendMatches.map((m) => {
        let startTime = m.startTime;
        let endTime = m.endTime;

        if (!startTime.includes('T')) {
          startTime = `${m.playDate}T${m.startTime.length === 5 ? m.startTime : '14:00'}:00Z`;
        }
        if (!endTime.includes('T')) {
          endTime = `${m.playDate}T${m.endTime.length === 5 ? m.endTime : '16:00'}:00Z`;
        }

        // Guarantee end > start
        const startMs = Date.parse(startTime);
        let endMs = Date.parse(endTime);
        if (isNaN(endMs) || endMs <= startMs) {
          endTime = new Date(startMs + 105 * 60 * 1000).toISOString();
        }

        return {
          match_id: m.fixtureId,
          league_type: m.leagueType,
          home_team_id: m.homeTeamId,
          away_team_id: m.awayTeamId,
          start_time: startTime,
          end_time: endTime,
        };
      });

      const formattedReferees = availableReferees.map((r) => ({
        referee_id: r.id,
        tier: (r.tier || (r.badge_level?.includes('FIFA') || r.badge_level?.includes('Level 1')
          ? 'EPL_Exclusive'
          : 'Mixed')) as 'EPL_Exclusive' | 'Mixed',
      }));

      // Fetch all registered teams so Algorithm 5 can select non-participating peer teams as linesmen
      const { data: allTeamsData } = await supabase
        .from('teams')
        .select('id, competition_id')
        .neq('status', 'rejected')
        .is('deleted_at', null);

      const teamMap = new Map<string, 'EPL' | 'CHAMPIONSHIP'>();
      (allTeamsData || []).forEach((t: any) => {
        const isEpl = t.competition_id === '11111111-1111-1111-1111-111111111111' || t.competition_id?.includes('1111');
        teamMap.set(t.id, isEpl ? 'EPL' : 'CHAMPIONSHIP');
      });

      for (const m of weekendMatches) {
        if (m.homeTeamId) teamMap.set(m.homeTeamId, m.leagueType);
        if (m.awayTeamId) teamMap.set(m.awayTeamId, m.leagueType);
      }

      const formattedTeams = Array.from(teamMap.entries()).map(([team_id, league_type]) => ({
        team_id,
        league_type,
      })) as unknown as Algorithm45Input["teams"];

      const payload45: Algorithm45Input = {
        matches: timeSlottedMatches,
        referees: formattedReferees,
        teams: formattedTeams,
      };

      const executionId = `exec-weekend-ref-${Date.now()}`;
      const command45 = createAlgorithmCommand<Algorithm45Input>({
        execution_id: executionId,
        season_id: 'season-2026-official',
        algorithm: 'ALGORITHM_4_5',
        command: 'ALLOCATE_OFFICIATING',
        payload_schema_version: '1.0',
        payload: payload45,
      });

      // 2. Execute Algorithm 4 & 5
      const algoResult = generateOfficiatingAssignments(command45);

      if (algoResult.status !== 'success' || !algoResult.payload?.assignments) {
        throw new Error(
          `Algorithm 4 & 5 failed: ${algoResult.verification?.errors?.join(', ') || 'No assignments generated.'}`
        );
      }

      const assignments = algoResult.payload.assignments;

      // 3. Immediately write to database (UID link for match and referee)
      for (const item of assignments) {
        // Update matchday_schedules
        await supabase
          .from('matchday_schedules')
          .update({
            center_referee_id: item.center_referee_id || null,
            linesman_team_a_id: item.linesman_team_a_id || null,
            linesman_team_b_id: item.linesman_team_b_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('fixture_id', item.match_id);

        // Update fixtures table
        if (item.center_referee_id) {
          await supabase
            .from('fixtures')
            .update({
              referee_id: item.center_referee_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.match_id);
        }
      }

      // 4. Log audit action
      try {
        await supabase.from('audit_logs').insert([
          {
            action: 'AGENT0_WEEKEND_REFEREE_ALLOCATION_CONFIRMED',
            resource_type: 'referees',
            resource_id: executionId,
            details: {
              weekend_dates: [weekendDates.saturday, weekendDates.sunday],
              assigned_matches_count: assignments.length,
              available_referees_count: availableReferees.length,
              timestamp: new Date().toISOString(),
            },
          },
        ]);
      } catch {}

      setSuccessResult({
        message: `Successfully allocated referees to ${assignments.length} weekend matches!`,
        assignmentsCount: assignments.length,
      });

      if (onAllocationComplete) {
        onAllocationComplete();
      }

      // Reload data to reflect new state
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete weekend referee allocation.');
    } finally {
      setAllocating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekend-ref-modal-title"
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0A0E1A] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Agent 0 • Algorithm 4 & 5
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Weekend Playdays ({weekendDates.saturday} & {weekendDates.sunday})
              </span>
            </div>
            <h2 id="weekend-ref-modal-title" className="text-xl sm:text-2xl font-black tracking-tight">
              Weekend Referee Allocation
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close allocation modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY (SCROLLABLE ONE-PAGE MODULE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successResult.message}</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* TARGET MATCHES SUMMARY */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0E1424] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Target Weekend Fixtures ({weekendMatches.length} Games)
              </h3>
              <span className="text-[11px] font-bold text-emerald-400">
                Saturday & Sunday Execution
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading scheduled weekend matches...</span>
              </div>
            ) : weekendMatches.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No fixtures found for the upcoming Saturday & Sunday playdays.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {weekendMatches.map((m) => (
                  <div
                    key={m.fixtureId}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-extrabold truncate text-slate-200">
                        {m.homeTeamName} vs {m.awayTeamName}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-emerald-400">{m.playDate}</span>
                        <span>•</span>
                        <span>{m.startTime}</span>
                        <span>•</span>
                        <span className="uppercase font-bold">{m.leagueType}</span>
                      </div>
                    </div>
                    {m.centerRefereeName ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                        {m.centerRefereeName}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
                        Unallocated
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOP SECTION: AVAILABLE REFEREES (WITH REMOVE BUTTON) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black tracking-tight">Available Referees Pool</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {availableCount} Available
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Eligible for Agent 0 random tier matching
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading available referees...</span>
              </div>
            ) : availableReferees.length === 0 ? (
              <div
                className={`p-6 rounded-2xl border text-center space-y-1 ${
                  isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No Referees Currently Available</p>
                <p className="text-[11px] text-slate-500">
                  Add referees from the Unavailable list below to include them in the final allocation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableReferees.map((ref) => {
                  const isUpdating = updatingRefId === ref.id;
                  const isFifa = ref.badge_level?.includes('FIFA');
                  return (
                    <div
                      key={ref.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isDark ? 'bg-[#0E1424] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs truncate text-slate-100">{ref.name}</h4>
                          {isFifa && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              FIFA
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {ref.badge_level || 'FKF National Level 2'} • {ref.phone}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono truncate">
                          UID: {ref.id}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveReferee(ref)}
                        disabled={isUpdating || allocating}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                        <span>Remove</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM SECTION: UNAVAILABLE REFEREES (WITH ADD BUTTON) */}
          <div className="space-y-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-black tracking-tight text-slate-300">Unavailable Referees</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-400 border border-slate-700">
                  {unavailableCount} Unavailable
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Excluded from Algorithm 4 & 5 execution
              </span>
            </div>

            {loading ? null : unavailableReferees.length === 0 ? (
              <div
                className={`p-4 rounded-2xl border text-center ${
                  isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <p className="text-xs text-slate-400">All registered referees are currently active and available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unavailableReferees.map((ref) => {
                  const isUpdating = updatingRefId === ref.id;
                  return (
                    <div
                      key={ref.id}
                      className={`p-3.5 rounded-2xl border opacity-75 hover:opacity-100 flex items-center justify-between gap-3 transition-all ${
                        isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="font-extrabold text-xs truncate text-slate-300">{ref.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {ref.badge_level || 'FKF National Level 2'} • {ref.phone}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono truncate">
                          UID: {ref.id}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddReferee(ref)}
                        disabled={isUpdating || allocating}
                        className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-400 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER: COUNTERS & CONFIRM ACTION BUTTON */}
        <div
          className={`p-4 sm:p-5 border-t shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'bg-[#080B14] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* COUNTERS AT BOTTOM */}
          <div className="flex items-center gap-4 text-xs font-black">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Available:</span>
              <span className="text-emerald-400 font-mono text-sm">{availableCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-slate-400">Unavailable:</span>
              <span className="text-rose-400 font-mono text-sm">{unavailableCount}</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/60">
              <span className="text-slate-400">Total:</span>
              <span className="text-white font-mono text-sm">{totalCount}</span>
            </div>
          </div>

          {/* CONFIRMATION & AGENT 0 BUTTON */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={allocating}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              Close
            </button>

            <button
              onClick={handleConfirmAllocation}
              disabled={allocating || availableCount === 0 || weekendMatches.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Agent 0 Algorithm 4 & 5...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Run Agent 0 Allocation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
