import { useState, useEffect, useCallback } from 'react';
import type {
  SeasonTeam,
  SeasonReferee,
  SeasonPitch,
  SeasonModeView,
  CoachIntakePayload,
  RefereeIntakePayload,
} from '../types/seasonMode';
import { teamsService } from '../services/teamsService';
import { refereesService } from '../services/refereesService';
import { pitchesService } from '../services/pitchesService';
import { COMPETITIONS } from '../constants/seasonConstants';

export function useSeasonMode() {
  const [activeView, setActiveView] = useState<SeasonModeView>('overview');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  const [teams, setTeams] = useState<SeasonTeam[]>([]);
  const [referees, setReferees] = useState<SeasonReferee[]>([]);
  const [pitches, setPitches] = useState<SeasonPitch[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal controls
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [teamsRes, refsRes, pitchesRes] = await Promise.all([
      teamsService.fetchTeams(),
      refereesService.fetchReferees(),
      pitchesService.fetchPitches(),
    ]);

    if (teamsRes.error && !teamsRes.teams.length) {
      console.warn('Teams error:', teamsRes.error);
    }
    if (refsRes.error && !refsRes.referees.length) {
      console.warn('Referees error:', refsRes.error);
    }

    setTeams(teamsRes.teams);
    setReferees(refsRes.referees);
    setPitches(pitchesRes.pitches);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived competition teams
  const premierLeagueTeams = teams.filter(
    (t) => t.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || t.name.toLowerCase().includes('premier') || (!t.competition_id && !t.name.toLowerCase().includes('championship'))
  );

  const championshipTeams = teams.filter(
    (t) => t.competition_id === COMPETITIONS.CHAMPIONSHIP.id || t.name.toLowerCase().includes('championship')
  );

  const handleRegisterCoach = async (payload: CoachIntakePayload): Promise<{ success: boolean; error: string | null }> => {
    const res = await teamsService.registerCoachAndTeam(payload);
    if (res.success) {
      showToast(`Team "${res.team?.name}" successfully registered and normalized.`);
      await loadData();
      setIsCoachModalOpen(false);
      return { success: true, error: null };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleRegisterReferee = async (payload: RefereeIntakePayload): Promise<{ success: boolean; error: string | null }> => {
    const res = await refereesService.registerReferee(payload);
    if (res.success) {
      showToast(`Referee "${res.referee?.name}" successfully registered into active pool.`);
      await loadData();
      setIsRefModalOpen(false);
      return { success: true, error: null };
    } else {
      return { success: false, error: res.error };
    }
  };

  return {
    activeView,
    setActiveView,
    isDark,
    toggleTheme,
    teams,
    premierLeagueTeams,
    championshipTeams,
    referees,
    pitches,
    isLoading,
    error,
    toastMessage,
    showToast,
    isCoachModalOpen,
    setIsCoachModalOpen,
    isRefModalOpen,
    setIsRefModalOpen,
    handleRegisterCoach,
    handleRegisterReferee,
    refreshData: loadData,
  };
}
