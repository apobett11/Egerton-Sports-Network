import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  SeasonModeView,
  OperationalMatch,
  SeasonReferee,
  SeasonPitch,
  SeasonTeam,
  FriendlyMatchPayload,
  PitchAvailabilityMode,
  OperationalAlert,
} from '../types/seasonMode';
import { fixturesService } from '../services/fixturesService';
import { refereesService } from '../services/refereesService';
import { pitchesService } from '../services/pitchesService';
import { teamsService } from '../services/teamsService';
import { seasonOperationsService } from '../services/seasonOperationsService';
import {
  COMPETITIONS,
  LOCAL_SEED_EPL_TEAMS,
  LOCAL_SEED_CHAMP_TEAMS,
  LOCAL_SEED_REFEREES,
  OFFICIAL_PITCHES,
} from '../constants/seasonConstants';

import { PresidentActionBridge } from '../../services/presidentAgent0Bridge';
import { ApiService } from '../../services/api';

export function useSeasonModeOperations() {
  const [seasonId, setSeasonId] = useState<string>('season-2026-official');
  const [activeView, setActiveView] = useState<SeasonModeView>('overview');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Data states
  const [fixtures, setFixtures] = useState<OperationalMatch[]>([]);
  const [referees, setReferees] = useState<SeasonReferee[]>([]);
  const [pitches, setPitches] = useState<SeasonPitch[]>([]);
  const [teams, setTeams] = useState<SeasonTeam[]>([]);
  const [capacity, setCapacity] = useState<{ EPL: number; Championship: number }>({ EPL: 3, Championship: 3 });

  // Modal / Interaction states
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<OperationalMatch | null>(null);
  const [refereeSwapMatch, setRefereeSwapMatch] = useState<OperationalMatch | null>(null);
  const [shiftTargetMatch, setShiftTargetMatch] = useState<OperationalMatch | null>(null);
  const [cancelTargetMatch, setCancelTargetMatch] = useState<OperationalMatch | null>(null);
  const [cancelTargetMatchday, setCancelTargetMatchday] = useState<number | null>(null);
  const [addFriendlyModalOpen, setAddFriendlyModalOpen] = useState<boolean>(false);
  const [refUnavailableTarget, setRefUnavailableTarget] = useState<SeasonReferee | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [pitchConflictModalData, setPitchConflictModalData] = useState<{ pitch: SeasonPitch; mode: PitchAvailabilityMode; affected: OperationalMatch[] } | null>(null);

  // Initial Data Fetching
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fixRes, refRes, pitchRes, teamRes] = await Promise.all([
        fixturesService.fetchFixtures(),
        refereesService.fetchReferees(),
        pitchesService.fetchPitches(),
        teamsService.fetchTeams(),
      ]);

      let finalTeams = teamRes.teams && teamRes.teams.length > 0 ? teamRes.teams : [...LOCAL_SEED_EPL_TEAMS, ...LOCAL_SEED_CHAMP_TEAMS];
      let finalRefs = refRes.referees && refRes.referees.length > 0 ? refRes.referees : LOCAL_SEED_REFEREES;
      let finalPitches = pitchRes.pitches && pitchRes.pitches.length > 0 ? pitchRes.pitches : OFFICIAL_PITCHES;

      let finalFixtures: OperationalMatch[] = [];
      if (fixRes.fixtures && fixRes.fixtures.length > 0) {
        finalFixtures = fixRes.fixtures as OperationalMatch[];
      } else {
        // Generate operational season fixtures
        const epl = finalTeams.filter((t) => t.competition_id === COMPETITIONS.PREMIER_LEAGUE.id);
        const champ = finalTeams.filter((t) => t.competition_id === COMPETITIONS.CHAMPIONSHIP.id);
        const genRes = fixturesService.generateSeasonFixtures(epl, champ, finalRefs, finalPitches as any);
        if (genRes.premierLeagueFixtures || genRes.championshipFixtures) {
          finalFixtures = [
            ...(genRes.premierLeagueFixtures?.all_fixtures || []),
            ...(genRes.championshipFixtures?.all_fixtures || []),
          ] as OperationalMatch[];
        }
      }

      setTeams(finalTeams);
      setReferees(finalRefs);
      setPitches(finalPitches as any);
      setFixtures(finalFixtures);
    } catch (err: any) {
      console.warn('Local dev fallback active:', err.message);
      const defaultTeams = [...LOCAL_SEED_EPL_TEAMS, ...LOCAL_SEED_CHAMP_TEAMS];
      const defaultRefs = LOCAL_SEED_REFEREES;
      const defaultPitches = OFFICIAL_PITCHES;
      const epl = defaultTeams.filter((t) => t.competition_id === COMPETITIONS.PREMIER_LEAGUE.id);
      const champ = defaultTeams.filter((t) => t.competition_id === COMPETITIONS.CHAMPIONSHIP.id);
      const genRes = fixturesService.generateSeasonFixtures(epl, champ, defaultRefs, defaultPitches as any);
      const generatedFixtures = [
        ...(genRes.premierLeagueFixtures?.all_fixtures || []),
        ...(genRes.championshipFixtures?.all_fixtures || []),
      ] as OperationalMatch[];

      setTeams(defaultTeams);
      setReferees(defaultRefs);
      setPitches(defaultPitches as any);
      setFixtures(generatedFixtures);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived teams split
  const premierLeagueTeams = useMemo(
    () => teams.filter((t) => t.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || t.competition?.name?.includes('Premier')),
    [teams]
  );
  const championshipTeams = useMemo(
    () => teams.filter((t) => t.competition_id === COMPETITIONS.CHAMPIONSHIP.id || t.competition?.name?.includes('Championship')),
    [teams]
  );

  // Operational alerts
  const alerts = useMemo(
    () => seasonOperationsService.generateOperationalAlerts(fixtures, referees, pitches),
    [fixtures, referees, pitches]
  );

  // Single Match Card Expansion Handler
  const handleToggleExpandMatch = useCallback((matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  // AGENT 0 COMMAND ACTIONS

  const handleExecuteChangeMatchCapacity = useCallback(
    async (epl?: number, championship?: number) => {
      try {
        const res = await PresidentActionBridge.changeMatchCapacity(seasonId, epl, championship);
        if (res.success) {
          if (epl !== undefined) setCapacity((prev) => ({ ...prev, EPL: epl }));
          if (championship !== undefined) setCapacity((prev) => ({ ...prev, Championship: championship }));
          showToast('Matchday capacity updated successfully.');
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to update matchday capacity.');
        }
      } catch (err: any) {
        showToast(err.message || 'The scheduling change could not be applied.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteAddPlayday = useCallback(
    async (date: string, mode: 'ONE_TIME' | 'PERMANENT') => {
      try {
        const res = mode === 'ONE_TIME'
          ? await PresidentActionBridge.addPlaydayOnce(seasonId, date)
          : await PresidentActionBridge.addPlaydayPermanent(seasonId, date);

        if (res.success) {
          showToast(`Playday added on ${date} (${mode === 'ONE_TIME' ? 'One-time' : 'Permanent'}).`);
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to add playday.');
        }
      } catch (err: any) {
        showToast(err.message || 'The scheduling change could not be applied.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteRemovePlayday = useCallback(
    async (date: string, mode: 'ONE_TIME' | 'PERMANENT') => {
      try {
        const res = mode === 'ONE_TIME'
          ? await PresidentActionBridge.removePlaydayOnce(seasonId, date)
          : await PresidentActionBridge.removePlaydayPermanent(seasonId, date);

        if (res.success) {
          showToast(`Playday removed for ${date}.`);
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to remove playday.');
        }
      } catch (err: any) {
        showToast(err.message || 'The scheduling change could not be applied.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteCancelMatchday = useCallback(
    async (matchdayNumber: number, _reason?: string) => {
      try {
        const res = await PresidentActionBridge.cancelMatchday(seasonId, matchdayNumber);
        if (res.success) {
          setFixtures((prev) => prev.map((f) => (f.matchday === matchdayNumber ? { ...f, status: 'CANCELLED' } : f)));
          showToast(`Matchday ${matchdayNumber} cancelled.`);
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to cancel matchday.');
        }
      } catch (err: any) {
        showToast(err.message || 'The cancellation could not be applied.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteChangePitchState = useCallback(
    async (pitchId: string, amAvailable: boolean, pmAvailable: boolean) => {
      try {
        const res = await PresidentActionBridge.changePitchState(seasonId, pitchId, amAvailable, pmAvailable);
        if (res.success) {
          setPitches((prev) =>
            prev.map((p) =>
              p.id === pitchId
                ? { ...p, status: amAvailable || pmAvailable ? 'Available' : 'Unavailable' }
                : p
            )
          );
          showToast('Pitch availability updated.');
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to update pitch availability.');
        }
      } catch (err: any) {
        showToast(err.message || 'Pitch configuration update failed.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteChangeTimeConfiguration = useCallback(
    async (eplSlots?: any[], champSlots?: any[]) => {
      try {
        const res = await PresidentActionBridge.changeTimeConfiguration(seasonId, eplSlots, champSlots);
        if (res.success) {
          showToast('Match times configuration updated successfully.');
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to update time configuration.');
        }
      } catch (err: any) {
        showToast(err.message || 'Time configuration update failed.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteSwapReferee = useCallback(
    async (matchId: string, newRefereeId: string) => {
      try {
        const dbRes = await seasonOperationsService.swapReferee(matchId, newRefereeId, fixtures, referees);
        await PresidentActionBridge.replaceReferee(seasonId, newRefereeId);
        if (dbRes.success) {
          setFixtures(dbRes.updatedFixtures);
          setRefereeSwapMatch(null);
          showToast('Referee successfully replaced in database.');
          await loadData();
        } else {
          showToast(dbRes.error || 'Failed to swap referee.');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to replace referee.');
      }
    },
    [seasonId, fixtures, referees, showToast, loadData]
  );

  const handleExecuteRemoveReferee = useCallback(
    async (refereeId: string) => {
      try {
        await ApiService.updateRefereeStatus(refereeId, 'Deactivated');
        const res = await PresidentActionBridge.removeReferee(seasonId, refereeId);
        if (res.success) {
          setReferees((prev) => prev.map((r) => (r.id === refereeId ? { ...r, status: 'Deactivated' } : r)));
          showToast('Referee removed and deactivated in database.');
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to remove referee.');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to remove referee.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteShiftMatch = useCallback(
    async (matchId: string, newTime: string, newVenue?: string) => {
      try {
        const res = await seasonOperationsService.shiftMatch(matchId, newTime, newVenue, fixtures);
        if (res.success) {
          setFixtures(res.updatedFixtures);
          setShiftTargetMatch(null);
          showToast('Match rescheduled in database.');
          await loadData();
        } else {
          showToast(res.error || 'Failed to shift match.');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to shift match.');
      }
    },
    [fixtures, showToast, loadData]
  );

  const handleExecuteCancelMatch = useCallback(
    async (matchId: string, reason: string) => {
      try {
        const res = await seasonOperationsService.cancelMatch(matchId, reason, fixtures);
        if (res.success) {
          setFixtures(res.updatedFixtures);
          setCancelTargetMatch(null);
          showToast('Match cancelled in database.');
          await loadData();
        } else {
          showToast(res.error || 'Failed to cancel match.');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to cancel match.');
      }
    },
    [fixtures, showToast, loadData]
  );

  const handleExecuteFlagLinesmanDefault = useCallback(
    async (matchId: string, team: 1 | 2) => {
      try {
        const res = await seasonOperationsService.flagLinesmanDefault(matchId, team, fixtures);
        if (res.success) {
          setFixtures(res.updatedFixtures);
          showToast(`Linesman default flagged for team ${team} in database.`);
          await loadData();
        } else {
          showToast(res.error || 'Failed to flag linesman default.');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to flag linesman default.');
      }
    },
    [fixtures, showToast, loadData]
  );

  const handleExecuteUpdatePitchAvailability = useCallback(
    async (pitchId: string, mode: PitchAvailabilityMode) => {
      try {
        const res = await seasonOperationsService.updatePitchAvailability(pitchId, mode, pitches, fixtures);
        if (res.success) {
          setPitches(res.updatedPitches);
          if (res.affectedMatches.length > 0) {
            setPitchConflictModalData({ pitch: res.updatedPitches.find((p) => p.id === pitchId)!, mode, affected: res.affectedMatches });
          }
          showToast('Pitch availability updated in database.');
          await loadData();
        } else {
          showToast(res.error || 'Failed to update pitch availability.');
        }
      } catch (err: any) {
        showToast(err.message || 'Pitch availability update failed.');
      }
    },
    [pitches, fixtures, showToast, loadData]
  );

  const handleExecuteMarkRefUnavailable = useCallback(
    async (refereeId: string, status: 'Unavailable' | 'Suspended' | 'Deactivated' | 'Active', _reason: string) => {
      try {
        await ApiService.updateRefereeStatus(refereeId, status === 'Active' ? 'Active' : 'Suspended');
        const res = await PresidentActionBridge.removeReferee(seasonId, refereeId);
        if (res.success) {
          setReferees((prev) => prev.map((r) => (r.id === refereeId ? { ...r, status } : r)));
          setRefUnavailableTarget(null);
          showToast(`Referee status updated to ${status} in database.`);
          await loadData();
        } else {
          showToast(res.error?.message || 'Failed to update referee status.');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to update referee status.');
      }
    },
    [seasonId, showToast, loadData]
  );

  const handleExecuteAddFriendly = useCallback(
    async (payload: FriendlyMatchPayload): Promise<{ success: boolean; error?: string }> => {
      // 1. Conflict Check
      const conflict = seasonOperationsService.validateFriendlyConflicts(payload, fixtures, referees, pitches);
      if (conflict.has_conflict) {
        const errorMsg = conflict.team_conflict || conflict.referee_conflict || conflict.pitch_conflict || 'Conflict detected.';
        return { success: false, error: errorMsg };
      }

      // 2. Create friendly
      const createRes = await seasonOperationsService.createFriendly(payload, teams, referees, pitches);
      if (createRes.success && createRes.friendlyMatch) {
        setFixtures((prev) => [createRes.friendlyMatch!, ...prev]);
        setAddFriendlyModalOpen(false);
        showToast(`Friendly match "${payload.friendly_name}" saved to database!`);
        await loadData();
        return { success: true };
      }

      return { success: false, error: createRes.error || 'Failed to create friendly match.' };
    },
    [fixtures, referees, pitches, teams, showToast, loadData]
  );

  return {
    activeView,
    setActiveView,
    isDark,
    toggleTheme,
    isLoading,
    error,
    toastMessage,
    showToast,
    fixtures,
    referees,
    pitches,
    teams,
    premierLeagueTeams,
    championshipTeams,
    alerts,
    expandedMatchId,
    handleToggleExpandMatch,
    selectedMatch,
    setSelectedMatch,
    refereeSwapMatch,
    setRefereeSwapMatch,
    shiftTargetMatch,
    setShiftTargetMatch,
    cancelTargetMatch,
    setCancelTargetMatch,
    cancelTargetMatchday,
    setCancelTargetMatchday,
    addFriendlyModalOpen,
    setAddFriendlyModalOpen,
    refUnavailableTarget,
    setRefUnavailableTarget,
    selectedCalendarDate,
    setSelectedCalendarDate,
    pitchConflictModalData,
    setPitchConflictModalData,
    capacity,
    handleExecuteChangeMatchCapacity,
    handleExecuteAddPlayday,
    handleExecuteRemovePlayday,
    handleExecuteChangePitchState,
    handleExecuteChangeTimeConfiguration,
    handleExecuteRemoveReferee,
    handleExecuteSwapReferee,
    handleExecuteShiftMatch,
    handleExecuteCancelMatch,
    handleExecuteCancelMatchday,
    handleExecuteFlagLinesmanDefault,
    handleExecuteUpdatePitchAvailability,
    handleExecuteMarkRefUnavailable,
    handleExecuteAddFriendly,
    refreshData: loadData,
  };
}
