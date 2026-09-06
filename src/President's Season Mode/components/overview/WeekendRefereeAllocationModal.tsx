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
  Shield,
  ArrowRight,
  ArrowLeft,
  Lock,
  Clock,
  Flag,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  generateOfficiatingAssignments,
  type Algorithm45Input,
  type TimeSlottedMatch,
  type OfficiatingOutput,
} from '../../../algorithms/algorithm45';
import { createAlgorithmCommand } from '../../../shared/algorithmProtocol';
import { LOCAL_SEED_REFEREES, COMPETITIONS } from '../../constants/seasonConstants';
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
  linesmanTeamAId?: string | null;
  linesmanTeamAName?: string | null;
  linesmanTeamBId?: string | null;
  linesmanTeamBName?: string | null;
}

export interface AssignmentResultItem {
  match_id: string;
  center_referee_id: string | null;
  center_referee_name?: string | null;
  center_referee_badge?: string | null;
  linesman_team_a_id: string | null;
  linesman_team_a_name?: string | null;
  linesman_team_b_id: string | null;
  linesman_team_b_name?: string | null;
  match: AllocationMatchItem;
}

export const WeekendRefereeAllocationModal: React.FC<WeekendRefereeAllocationModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onAllocationComplete,
}) => {
  // 2-Step Workflow state: 'SETUP' = Confirmation & available ref selection; 'RESULTS' = Show results preview & lock
  const [modalStep, setModalStep] = useState<'SETUP' | 'RESULTS'>('SETUP');

  const [loading, setLoading] = useState<boolean>(true);
  const [allocating, setAllocating] = useState<boolean>(false);
  const [lockingDatabase, setLockingDatabase] = useState<boolean>(false);
  const [updatingRefId, setUpdatingRefId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    message: string;
    assignmentsCount: number;
  } | null>(null);

  // Referee lists
  const [refereesList, setRefereesList] = useState<SeasonReferee[]>([]);
  // Target strictly upcoming Saturday & Sunday matches
  const [weekendMatches, setWeekendMatches] = useState<AllocationMatchItem[]>([]);
  const [weekendDates, setWeekendDates] = useState<{ saturday: string; sunday: string }>({
    saturday: '',
    sunday: '',
  });

  // Cached maps for UID lookups
  const [teamsMap, setTeamsMap] = useState<Map<string, any>>(new Map());

  // Step 2 Preview results from Algorithm 4 & 5
  const [previewAssignments, setPreviewAssignments] = useState<AssignmentResultItem[]>([]);
  const [activeLeagueFilter, setActiveLeagueFilter] = useState<'ALL' | 'EPL' | 'CHAMPIONSHIP'>('ALL');
  const [activeDayFilter, setActiveDayFilter] = useState<'ALL' | 'SATURDAY' | 'SUNDAY'>('ALL');

  /**
   * Strictly calculate the upcoming Saturday and Sunday dates.
   * If today is Sunday, upcoming Saturday is next Saturday (+6 days) and next Sunday (+7 days).
   * If today is Saturday, weekend is today (Saturday) and tomorrow (Sunday).
   * If today is Monday to Friday, weekend is upcoming Saturday and Sunday.
   */
  const calculateWeekendDates = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

    let satOffset = 0;
    if (dayOfWeek === 0) {
      satOffset = 6;
    } else if (dayOfWeek === 6) {
      satOffset = 0;
    } else {
      satOffset = 6 - dayOfWeek;
    }

    const sat = new Date(now);
    sat.setDate(now.getDate() + satOffset);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    return {
      saturday: sat.toISOString().split('T')[0],
      sunday: sun.toISOString().split('T')[0],
    };
  }, []);

  // Load referees and strictly target weekend matches
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
        currentRefs = LOCAL_SEED_REFEREES as SeasonReferee[];
      }
      setRefereesList(currentRefs);

      // 2. Fetch all registered teams to populate map
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, short_name, competition_id')
        .neq('status', 'rejected')
        .is('deleted_at', null);

      const tMap = new Map<string, any>();
      (teamsData || []).forEach((t: any) => tMap.set(t.id, t));
      setTeamsMap(tMap);

      const rMap = new Map<string, any>();
      currentRefs.forEach((r) => rMap.set(r.id, r));

      // 3. Strictly fetch matches scheduled for the 2 weekend dates
      const { data: schedData } = await supabase
        .from('matchday_schedules')
        .select('*, base_fixtures(*)')
        .in('play_date', [dates.saturday, dates.sunday])
        .order('play_date')
        .order('start_time');

      let targetSchedules = schedData || [];

      // Fallback: If no schedules match the upcoming Saturday/Sunday, find the next earliest weekend playdays in DB
      if (targetSchedules.length === 0) {
        const { data: nextAvailable } = await supabase
          .from('matchday_schedules')
          .select('*, base_fixtures(*)')
          .order('matchday_number', { ascending: true })
          .order('play_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (nextAvailable && nextAvailable.length > 0) {
          // Identify the next two play dates
          const distinctDates = Array.from(
            new Set(nextAvailable.map((s: any) => s.play_date).filter(Boolean))
          ) as string[];

          if (distinctDates.length >= 2) {
            const firstDate = distinctDates[0];
            const secondDate = distinctDates[1];
            targetSchedules = nextAvailable.filter(
              (s: any) => s.play_date === firstDate || s.play_date === secondDate
            );
            setWeekendDates({ saturday: firstDate, sunday: secondDate });
          } else if (distinctDates.length === 1) {
            targetSchedules = nextAvailable.filter((s: any) => s.play_date === distinctDates[0]);
            setWeekendDates({ saturday: distinctDates[0], sunday: distinctDates[0] });
          }
        }
      }

      const items: AllocationMatchItem[] = targetSchedules.map((s: any) => {
        const bf = s.base_fixtures || {};
        const homeId = bf.home_team_id || s.home_team_id || '';
        const awayId = bf.away_team_id || s.away_team_id || '';
        const homeTeam = tMap.get(homeId);
        const awayTeam = tMap.get(awayId);
        const compId = s.competition_id || bf.competition_id || COMPETITIONS.PREMIER_LEAGUE.id;
        const isEpl =
          s.league === 'EPL' ||
          compId === COMPETITIONS.PREMIER_LEAGUE.id ||
          compId?.includes('1111');
        const refObj = s.center_referee_id ? rMap.get(s.center_referee_id) : null;
        const linesmanA = s.linesman_team_a_id ? tMap.get(s.linesman_team_a_id) : null;
        const linesmanB = s.linesman_team_b_id ? tMap.get(s.linesman_team_b_id) : null;

        return {
          fixtureId: s.fixture_id || s.id,
          matchdayNumber: s.matchday_number || 1,
          playDate: s.play_date || dates.saturday,
          startTime: s.start_time || '14:00',
          endTime: s.end_time || '16:00',
          competitionId: isEpl ? COMPETITIONS.PREMIER_LEAGUE.id : COMPETITIONS.CHAMPIONSHIP.id,
          leagueType: isEpl ? 'EPL' : 'CHAMPIONSHIP',
          homeTeamId: homeId,
          homeTeamName: homeTeam?.name || 'Home Team',
          awayTeamId: awayId,
          awayTeamName: awayTeam?.name || 'Away Team',
          venue: s.pitch_id || 'Egerton Campus Ground',
          centerRefereeId: s.center_referee_id || null,
          centerRefereeName: refObj?.name || null,
          linesmanTeamAId: s.linesman_team_a_id || null,
          linesmanTeamAName: linesmanA?.name || null,
          linesmanTeamBId: s.linesman_team_b_id || null,
          linesmanTeamBName: linesmanB?.name || null,
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
      setModalStep('SETUP');
      setPreviewAssignments([]);
      setSuccessResult(null);
    }
  }, [isOpen, loadData]);

  // Derived available & unavailable referee lists
  const availableReferees = useMemo(() => {
    return refereesList.filter(
      (r) => r.status === 'Active' || (r.status as string) === 'Available' || !r.status
    );
  }, [refereesList]);

  const unavailableReferees = useMemo(() => {
    return refereesList.filter(
      (r) =>
        r.status === 'Inactive' ||
        r.status === 'Unavailable' ||
        r.status === 'Suspended' ||
        r.status === 'Deactivated'
    );
  }, [refereesList]);

  const totalCount = refereesList.length;
  const availableCount = availableReferees.length;
  const unavailableCount = unavailableReferees.length;

  // Separate matches by day and by league
  const saturdayMatches = useMemo(
    () => weekendMatches.filter((m) => m.playDate === weekendDates.saturday),
    [weekendMatches, weekendDates]
  );
  const sundayMatches = useMemo(
    () => weekendMatches.filter((m) => m.playDate === weekendDates.sunday),
    [weekendMatches, weekendDates]
  );

  const satMatchdayNum = saturdayMatches[0]?.matchdayNumber || 1;
  const sunMatchdayNum = sundayMatches[0]?.matchdayNumber || (satMatchdayNum + 1);

  const satEplMatches = useMemo(() => saturdayMatches.filter((m) => m.leagueType === 'EPL'), [saturdayMatches]);
  const satChampMatches = useMemo(() => saturdayMatches.filter((m) => m.leagueType === 'CHAMPIONSHIP'), [saturdayMatches]);
  const sunEplMatches = useMemo(() => sundayMatches.filter((m) => m.leagueType === 'EPL'), [sundayMatches]);
  const sunChampMatches = useMemo(() => sundayMatches.filter((m) => m.leagueType === 'CHAMPIONSHIP'), [sundayMatches]);

  // Toggle referee to Inactive/Unavailable
  const handleRemoveReferee = async (referee: SeasonReferee) => {
    setUpdatingRefId(referee.id);
    try {
      const { error } = await supabase
        .from('referees')
        .update({
          status: 'Inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', referee.id);

      if (error) throw error;

      setRefereesList((prev) =>
        prev.map((r) => (r.id === referee.id ? { ...r, status: 'Inactive' } : r))
      );
    } catch (err: any) {
      setErrorMessage(`Failed to remove referee ${referee.name}: ${err.message}`);
    } finally {
      setUpdatingRefId(null);
    }
  };

  // Toggle referee to Active/Available
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

      setRefereesList((prev) =>
        prev.map((r) => (r.id === referee.id ? { ...r, status: 'Active' } : r))
      );
    } catch (err: any) {
      setErrorMessage(`Failed to add referee ${referee.name}: ${err.message}`);
    } finally {
      setUpdatingRefId(null);
    }
  };

  // Toggle referee league tier (EPL Exclusive vs Mixed)
  const handleToggleRefereeTier = (refereeId: string) => {
    setRefereesList((prev) =>
      prev.map((r) => {
        if (r.id !== refereeId) return r;
        const currentTier = r.tier || (r.badge_level?.includes('FIFA') || r.badge_level?.includes('Level 1') ? 'EPL_Exclusive' : 'Mixed');
        const nextTier = currentTier === 'EPL_Exclusive' ? 'Mixed' : 'EPL_Exclusive';
        return { ...r, tier: nextTier };
      })
    );
  };

  // STEP 1 -> STEP 2: RUN ALGORITHM 4 & 5 IN-MEMORY FOR PREVIEW
  const handleRunAllocationPreview = async () => {
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
      // 1. Prepare strictly slotted matches for Algorithm 4 & 5
      const timeSlottedMatches: TimeSlottedMatch[] = weekendMatches.map((m) => {
        let startTime = m.startTime;
        let endTime = m.endTime;

        if (!startTime.includes('T')) {
          startTime = `${m.playDate}T${m.startTime.length === 5 ? m.startTime : '14:00'}:00Z`;
        }
        if (!endTime.includes('T')) {
          endTime = `${m.playDate}T${m.endTime.length === 5 ? m.endTime : '16:00'}:00Z`;
        }

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

      // 2. Referees with league tier respected
      const formattedReferees = availableReferees.map((r) => {
        const tier = (r.tier ||
          (r.badge_level?.includes('FIFA') || r.badge_level?.includes('Level 1')
            ? 'EPL_Exclusive'
            : 'Mixed')) as 'EPL_Exclusive' | 'Mixed';

        return {
          referee_id: r.id,
          tier,
        };
      });

      // 3. Teams with league_type for linesman peer allocation
      const teamLeagueMap = new Map<string, 'EPL' | 'CHAMPIONSHIP'>();
      teamsMap.forEach((t, id) => {
        const isEpl = t.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || t.competition_id?.includes('1111');
        teamLeagueMap.set(id, isEpl ? 'EPL' : 'CHAMPIONSHIP');
      });
      for (const m of weekendMatches) {
        if (m.homeTeamId) teamLeagueMap.set(m.homeTeamId, m.leagueType);
        if (m.awayTeamId) teamLeagueMap.set(m.awayTeamId, m.leagueType);
      }

      const formattedTeams = Array.from(teamLeagueMap.entries()).map(([team_id, league_type]) => ({
        team_id,
        league_type,
      })) as unknown as Algorithm45Input['teams'];

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

      // 4. Execute Algorithm 4 & 5 (Unmodified)
      const algoResult = generateOfficiatingAssignments(command45);

      if (algoResult.status !== 'success' || !algoResult.payload?.assignments) {
        throw new Error(
          `Algorithm 4 & 5 execution failed: ${
            algoResult.verification?.errors?.join(', ') || 'No assignments generated.'
          }`
        );
      }

      const assignments = algoResult.payload.assignments;

      // 5. Correlate generated assignments with match details for preview
      const refLookup = new Map<string, SeasonReferee>();
      refereesList.forEach((r) => refLookup.set(r.id, r));

      const matchLookup = new Map<string, AllocationMatchItem>();
      weekendMatches.forEach((m) => matchLookup.set(m.fixtureId, m));

      const previewItems: AssignmentResultItem[] = assignments.map((item) => {
        const match = matchLookup.get(item.match_id)!;
        const assignedRef = item.center_referee_id ? refLookup.get(item.center_referee_id) : null;
        const linesmanA = item.linesman_team_a_id ? teamsMap.get(item.linesman_team_a_id) : null;
        const linesmanB = item.linesman_team_b_id ? teamsMap.get(item.linesman_team_b_id) : null;

        return {
          match_id: item.match_id,
          center_referee_id: item.center_referee_id || null,
          center_referee_name: assignedRef?.name || (item.center_referee_id ? 'Official Referee' : 'Unallocated'),
          center_referee_badge: assignedRef?.badge_level || null,
          linesman_team_a_id: item.linesman_team_a_id || null,
          linesman_team_a_name: linesmanA?.name || null,
          linesman_team_b_id: item.linesman_team_b_id || null,
          linesman_team_b_name: linesmanB?.name || null,
          match,
        };
      });

      setPreviewAssignments(previewItems);
      setModalStep('RESULTS');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to run weekend referee allocation.');
    } finally {
      setAllocating(false);
    }
  };

  // STEP 2 -> CONFIRM & LOCK TO DATABASE
  const handleConfirmAndLockToDatabase = async () => {
    if (previewAssignments.length === 0) {
      setErrorMessage('No assignments to lock.');
      return;
    }

    setLockingDatabase(true);
    setErrorMessage(null);
    try {
      // Write exclusively to existing columns in matchday_schedules and fixtures using strict UIDs
      for (const item of previewAssignments) {
        // 1. Update matchday_schedules existing columns
        const { error: schedErr } = await supabase
          .from('matchday_schedules')
          .update({
            center_referee_id: item.center_referee_id || null,
            linesman_team_a_id: item.linesman_team_a_id || null,
            linesman_team_b_id: item.linesman_team_b_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('fixture_id', item.match_id);

        if (schedErr) throw schedErr;

        // 2. Update fixtures existing column
        if (item.center_referee_id) {
          const { error: fixErr } = await supabase
            .from('fixtures')
            .update({
              referee_id: item.center_referee_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.match_id);

          if (fixErr) throw fixErr;
        }
      }

      // 3. Record audit log
      try {
        await supabase.from('audit_logs').insert([
          {
            action: 'AGENT0_WEEKEND_REFEREE_ALLOCATION_LOCKED',
            resource_type: 'referees',
            resource_id: `weekend-${weekendDates.saturday}-${weekendDates.sunday}`,
            details: {
              weekend_dates: [weekendDates.saturday, weekendDates.sunday],
              matchday_saturday: satMatchdayNum,
              matchday_sunday: sunMatchdayNum,
              assigned_matches_count: previewAssignments.length,
              available_referees_count: availableReferees.length,
              timestamp: new Date().toISOString(),
            },
          },
        ]);
      } catch {}

      setSuccessResult({
        message: `Successfully locked center referees and linesmen to database for ${previewAssignments.length} matches across Saturday (${weekendDates.saturday}) and Sunday (${weekendDates.sunday})!`,
        assignmentsCount: previewAssignments.length,
      });

      if (onAllocationComplete) {
        onAllocationComplete();
      }

      // Reload data to reflect new state
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to lock allocations to database.');
    } finally {
      setLockingDatabase(false);
    }
  };

  // Filter preview items in Step 2
  const filteredPreviewItems = useMemo(() => {
    return previewAssignments.filter((item) => {
      if (activeLeagueFilter !== 'ALL' && item.match.leagueType !== activeLeagueFilter) return false;
      if (activeDayFilter === 'SATURDAY' && item.match.playDate !== weekendDates.saturday) return false;
      if (activeDayFilter === 'SUNDAY' && item.match.playDate !== weekendDates.sunday) return false;
      return true;
    });
  }, [previewAssignments, activeLeagueFilter, activeDayFilter, weekendDates]);

  const uniqueRefsAssigned = useMemo(() => {
    const s = new Set<string>();
    previewAssignments.forEach((a) => {
      if (a.center_referee_id) s.add(a.center_referee_id);
    });
    return s.size;
  }, [previewAssignments]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekend-ref-modal-title"
    >
      <div
        className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0e1e2d] border-[#1a2e45] text-white' : 'bg-white border-[#e6e8ec] text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#1a2e45] bg-[#0e1e2d] flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#ff0046]" />
                Agent 0 • Algorithm 4 & 5
              </span>

              <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                {modalStep === 'SETUP' ? 'Step 1 of 2: Setup & Scope' : 'Step 2 of 2: Results & Lock'}
              </span>

              <span className="text-xs text-slate-400 font-mono font-bold">
                Sat: {weekendDates.saturday} (MD {satMatchdayNum}) • Sun: {weekendDates.sunday} (MD {sunMatchdayNum})
              </span>
            </div>

            <h2 id="weekend-ref-modal-title" className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              {modalStep === 'SETUP'
                ? 'Weekend Referee & Linesmen Allocation'
                : 'Officiating Allocation Preview & Lock'}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close allocation modal"
            className="p-2 text-slate-400 hover:text-white rounded-md bg-[#152a40] hover:bg-[#1c3857] border border-white/10 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 bg-[#0a1520]">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Result */}
          {successResult && (
            <div className="p-3.5 rounded-md bg-[#00b04f]/15 border border-[#00b04f]/30 text-[#00b04f] text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successResult.message}</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-md bg-[#00b04f] hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: SETUP & CONFIRMATION VIEW                                         */}
          {/* ========================================================================= */}
          {modalStep === 'SETUP' && (
            <div className="space-y-5">
              {/* TARGET MATCHES BREAKDOWN ACROSS BOTH DAYS & BOTH LEAGUES */}
              <div className="p-4 rounded-md border bg-[#0e1c2b] border-[#1a2e45] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ff0046]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Strict Upcoming Weekend Scope ({weekendMatches.length} Fixtures)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Saturday (MD {satMatchdayNum}) & Sunday (MD {sunMatchdayNum})
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#ff0046]" />
                    <span>Querying matchday schedules for upcoming weekend...</span>
                  </div>
                ) : weekendMatches.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No scheduled matches found for Saturday ({weekendDates.saturday}) and Sunday ({weekendDates.sunday}).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SATURDAY GAMES */}
                    <div className="p-3 rounded-md border border-[#1a2e45] bg-[#122338] space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#1a2e45] pb-2">
                        <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Saturday • {weekendDates.saturday}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#152a40] text-slate-300 font-bold">
                          MD {satMatchdayNum} ({saturdayMatches.length} Games)
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar text-xs">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                          <span>Premier League ({satEplMatches.length})</span>
                          <span>Championship ({satChampMatches.length})</span>
                        </div>
                        {saturdayMatches.map((m) => (
                          <div
                            key={m.fixtureId}
                            className="p-2 rounded-sm bg-[#15273b] border border-[#223b56] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1 truncate font-bold text-white text-[11px]">
                              {m.homeTeamName} vs {m.awayTeamName}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono font-bold text-slate-400">{m.startTime}</span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs ${
                                  m.leagueType === 'EPL'
                                    ? 'bg-[#ff0046]/20 text-[#ff0046]'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {m.leagueType}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SUNDAY GAMES */}
                    <div className="p-3 rounded-md border border-[#1a2e45] bg-[#122338] space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#1a2e45] pb-2">
                        <span className="text-xs font-black uppercase text-sky-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Sunday • {weekendDates.sunday}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#152a40] text-slate-300 font-bold">
                          MD {sunMatchdayNum} ({sundayMatches.length} Games)
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar text-xs">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                          <span>Premier League ({sunEplMatches.length})</span>
                          <span>Championship ({sunChampMatches.length})</span>
                        </div>
                        {sundayMatches.map((m) => (
                          <div
                            key={m.fixtureId}
                            className="p-2 rounded-sm bg-[#15273b] border border-[#223b56] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1 truncate font-bold text-white text-[11px]">
                              {m.homeTeamName} vs {m.awayTeamName}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono font-bold text-slate-400">{m.startTime}</span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs ${
                                  m.leagueType === 'EPL'
                                    ? 'bg-[#ff0046]/20 text-[#ff0046]'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {m.leagueType}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AVAILABLE REFEREES POOL (TOP LIST WITH TOGGLE & TIER) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#00b04f]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Available Referees Pool</h3>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-black bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                      {availableCount} Available
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
                    Click League Tier to toggle EPL Exclusive vs Mixed
                  </span>
                </div>

                {loading ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#ff0046]" />
                    <span>Loading registered referee pool...</span>
                  </div>
                ) : availableReferees.length === 0 ? (
                  <div className="p-6 rounded-md border text-center space-y-1 bg-[#0e1c2b] border-[#1a2e45]">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">No Referees Currently Available</p>
                    <p className="text-[11px] text-slate-400">
                      Add referees from the Unavailable list below to include them in the allocation run.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableReferees.map((ref) => {
                      const isUpdating = updatingRefId === ref.id;
                      const tier = ref.tier || (ref.badge_level?.includes('FIFA') || ref.badge_level?.includes('Level 1') ? 'EPL_Exclusive' : 'Mixed');
                      const isEplOnly = tier === 'EPL_Exclusive';

                      return (
                        <div
                          key={ref.id}
                          className="p-3 rounded-md border bg-[#0e1c2b] border-[#1a2e45] hover:border-slate-600 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs truncate text-white">{ref.name}</h4>
                              {ref.badge_level?.includes('FIFA') && (
                                <span className="px-1.5 py-0.2 rounded-xs text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  FIFA
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px]">
                              {/* Clickable League Tier Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleRefereeTier(ref.id)}
                                title="Click to toggle league tier"
                                className={`px-1.5 py-0.5 rounded-xs font-black uppercase tracking-wider text-[9px] border cursor-pointer transition-colors ${
                                  isEplOnly
                                    ? 'bg-[#ff0046]/20 text-[#ff0046] border-[#ff0046]/40 hover:bg-[#ff0046]/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                                }`}
                              >
                                {isEplOnly ? 'EPL Exclusive' : 'Mixed Leagues'}
                              </button>
                              <span className="text-slate-400 font-mono truncate">{ref.phone}</span>
                            </div>

                            <p className="text-[9px] text-slate-500 font-mono truncate">UID: {ref.id}</p>
                          </div>

                          <button
                            onClick={() => handleRemoveReferee(ref)}
                            disabled={isUpdating || allocating}
                            className="px-2.5 py-1.5 rounded-md border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-400 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>Remove</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* UNAVAILABLE REFEREES SECTION */}
              <div className="space-y-2.5 pt-3 border-t border-[#1a2e45]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Unavailable Referees</h3>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-black bg-[#14263b] text-slate-400 border border-[#1a2e45]">
                      {unavailableCount} Excluded
                    </span>
                  </div>
                </div>

                {loading ? null : unavailableReferees.length === 0 ? (
                  <div className="p-3 rounded-md border text-center bg-[#0e1c2b] border-[#1a2e45]">
                    <p className="text-xs text-slate-400">All registered referees are currently active in the pool.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {unavailableReferees.map((ref) => {
                      const isUpdating = updatingRefId === ref.id;
                      return (
                        <div
                          key={ref.id}
                          className="p-3 rounded-md border opacity-75 hover:opacity-100 flex items-center justify-between gap-3 transition-all bg-[#0e1c2b]/70 border-[#1a2e45]"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="font-bold text-xs truncate text-slate-300">{ref.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {ref.badge_level || 'FKF National'} • {ref.phone}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono truncate">UID: {ref.id}</p>
                          </div>

                          <button
                            onClick={() => handleAddReferee(ref)}
                            disabled={isUpdating || allocating}
                            className="px-2.5 py-1.5 rounded-md border border-[#00b04f]/30 bg-[#00b04f]/15 hover:bg-[#00b04f] hover:text-white text-[#00b04f] font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                            <span>Add to Pool</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: RESULTS SHOW & CONFIRMATION TO DATABASE                          */}
          {/* ========================================================================= */}
          {modalStep === 'RESULTS' && (
            <div className="space-y-4">
              {/* SUMMARY BANNER */}
              <div className="p-4 rounded-md border bg-[#00b04f]/10 border-[#00b04f]/30 text-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#00b04f]" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Agent 0 Algorithm 4 & 5 Allocation Envelope Verified
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#00b04f]/20 text-[#00b04f] font-bold">
                    Ready for Database Write
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#00b04f]/20 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Matches:</span>
                    <span className="text-white font-black text-sm">{previewAssignments.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Referees Assigned:</span>
                    <span className="text-[#00b04f] font-black text-sm">{uniqueRefsAssigned} Center Refs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Linesmen Allocated:</span>
                    <span className="text-amber-400 font-black text-sm">
                      {previewAssignments.filter((a) => a.linesman_team_a_id && a.linesman_team_b_id).length * 2} Club Reps
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Days Covered:</span>
                    <span className="text-sky-400 font-black text-sm">Saturday & Sunday</span>
                  </div>
                </div>
              </div>

              {/* FILTER BUTTONS (DAYS & LEAGUES SEPARATE) */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-[#0e1c2b] p-3 rounded-md border border-[#1a2e45]">
                {/* Day Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Day:</span>
                  {(['ALL', 'SATURDAY', 'SUNDAY'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setActiveDayFilter(d)}
                      className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        activeDayFilter === d
                          ? 'bg-[#ff0046] text-white'
                          : 'bg-[#152a40] text-slate-300 hover:text-white'
                      }`}
                    >
                      {d === 'ALL' ? 'Both Days' : d}
                    </button>
                  ))}
                </div>

                {/* League Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">League:</span>
                  {(['ALL', 'EPL', 'CHAMPIONSHIP'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setActiveLeagueFilter(l)}
                      className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        activeLeagueFilter === l
                          ? 'bg-[#ff0046] text-white'
                          : 'bg-[#152a40] text-slate-300 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* GENERATED RESULTS LISTING */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                {filteredPreviewItems.map((item) => {
                  const m = item.match;
                  const isEpl = m.leagueType === 'EPL';
                  const isSat = m.playDate === weekendDates.saturday;

                  return (
                    <div
                      key={item.match_id}
                      className="p-3.5 rounded-md border bg-[#0e1c2b] border-[#1a2e45] space-y-2.5"
                    >
                      {/* Match Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#14263b] pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-wider ${
                              isEpl ? 'bg-[#ff0046]/20 text-[#ff0046]' : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {m.leagueType}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            MD {m.matchdayNumber} • {isSat ? 'Saturday' : 'Sunday'} ({m.playDate}) • {m.startTime}
                          </span>
                        </div>

                        <span className="text-[9px] font-mono text-slate-500 truncate">UID: {item.match_id}</span>
                      </div>

                      {/* Teams */}
                      <div className="text-xs sm:text-sm font-black text-white flex items-center justify-between">
                        <span>{m.homeTeamName}</span>
                        <span className="text-slate-500 text-xs px-2 font-mono">VS</span>
                        <span>{m.awayTeamName}</span>
                      </div>

                      {/* Officials Allocated Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        {/* Center Referee */}
                        <div className="p-2.5 rounded-sm bg-[#122338] border border-[#1a2e45] space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-[#00b04f]" /> Center Referee
                          </span>
                          <div className="font-bold text-white text-[11px] truncate">
                            {item.center_referee_name}
                          </div>
                          <div className="text-[9px] text-[#00b04f] font-mono">
                            {item.center_referee_badge || 'Accredited Official'}
                          </div>
                          <div className="text-[8px] text-slate-500 font-mono truncate">
                            UID: {item.center_referee_id}
                          </div>
                        </div>

                        {/* Linesman A */}
                        <div className="p-2.5 rounded-sm bg-[#122338] border border-[#1a2e45] space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Flag className="w-3 h-3 text-amber-400" /> Assistant Ref 1 (Linesman)
                          </span>
                          <div className="font-bold text-slate-200 text-[11px] truncate">
                            {item.linesman_team_a_name || 'Assigned Peer Club'}
                          </div>
                          <div className="text-[9px] text-amber-400 font-mono">Peer Non-Playing Team</div>
                          <div className="text-[8px] text-slate-500 font-mono truncate">
                            UID: {item.linesman_team_a_id}
                          </div>
                        </div>

                        {/* Linesman B */}
                        <div className="p-2.5 rounded-sm bg-[#122338] border border-[#1a2e45] space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Flag className="w-3 h-3 text-sky-400" /> Assistant Ref 2 (Linesman)
                          </span>
                          <div className="font-bold text-slate-200 text-[11px] truncate">
                            {item.linesman_team_b_name || 'Assigned Peer Club'}
                          </div>
                          <div className="text-[9px] text-sky-400 font-mono">Peer Non-Playing Team</div>
                          <div className="text-[8px] text-slate-500 font-mono truncate">
                            UID: {item.linesman_team_b_id}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 border-t border-[#1a2e45] bg-[#0e1e2d] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Counters info */}
          <div className="flex items-center gap-3 text-xs font-black">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00b04f]" />
              <span className="text-slate-400 uppercase text-[10px]">Available:</span>
              <span className="text-[#00b04f] font-mono text-xs font-black">{availableCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-slate-400 uppercase text-[10px]">Unavailable:</span>
              <span className="text-rose-400 font-mono text-xs font-black">{unavailableCount}</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#1a2e45]">
              <span className="text-slate-400 uppercase text-[10px]">Weekend Games:</span>
              <span className="text-white font-mono text-xs font-black">{weekendMatches.length}</span>
            </div>
          </div>

          {/* Action buttons depending on Step */}
          <div className="flex items-center gap-2">
            {modalStep === 'SETUP' ? (
              <>
                <button
                  onClick={onClose}
                  disabled={allocating}
                  className="px-3.5 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleRunAllocationPreview}
                  disabled={allocating || availableCount === 0 || weekendMatches.length === 0}
                  className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:bg-[#14263b] disabled:text-slate-500 disabled:cursor-not-allowed active:scale-98"
                >
                  {allocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Agent 0 Allocation...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Allocation (Agent 0)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setModalStep('SETUP')}
                  disabled={lockingDatabase}
                  className="px-3.5 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Setup</span>
                </button>

                <button
                  onClick={handleConfirmAndLockToDatabase}
                  disabled={lockingDatabase || previewAssignments.length === 0}
                  className="px-4 py-2 rounded-md bg-[#00b04f] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {lockingDatabase ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Locking to Database...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Confirm & Lock to Database</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
