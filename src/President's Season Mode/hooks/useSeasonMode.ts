import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type {
  SeasonTeam,
  SeasonReferee,
  SeasonPitch,
  SeasonFixture,
  SeasonModeView,
  SeasonState,
  CoachIntakePayload,
  RefereeIntakePayload,
} from '../types/seasonMode';
import { teamsService } from '../services/teamsService';
import { refereesService } from '../services/refereesService';
import { pitchesService } from '../services/pitchesService';
import { fixturesService } from '../services/fixturesService';
import { COMPETITIONS } from '../constants/seasonConstants';

export interface UserAuthProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export function useSeasonMode() {
  const [activeView, setActiveView] = useState<SeasonModeView>('overview');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  const [teams, setTeams] = useState<SeasonTeam[]>([]);
  const [referees, setReferees] = useState<SeasonReferee[]>([]);
  const [pitches, setPitches] = useState<SeasonPitch[]>([]);
  const [fixtures, setFixtures] = useState<SeasonFixture[]>([]);
  const [userProfile, setUserProfile] = useState<UserAuthProfile | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal controls
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const loadAuthUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role')
          .eq('id', user.id)
          .maybeSingle();

        if (prof) {
          setUserProfile(prof as UserAuthProfile);
        } else {
          setUserProfile({
            id: user.id,
            first_name: 'President',
            last_name: 'Official',
            email: user.email || 'president@egerton.ac.ke',
            role: 'president',
          });
        }
      } else {
        // Fallback default President profile if unauthenticated session in demo mode
        setUserProfile({
          id: 'president-session',
          first_name: 'President',
          last_name: 'Governance',
          email: 'president@egerton.ac.ke',
          role: 'president',
        });
      }
    } catch {
      setUserProfile({
        id: 'president-session',
        first_name: 'President',
        last_name: 'Governance',
        email: 'president@egerton.ac.ke',
        role: 'president',
      });
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    await loadAuthUser();

    const [teamsRes, refsRes, pitchesRes, fixturesRes] = await Promise.all([
      teamsService.fetchTeams(),
      refereesService.fetchReferees(),
      pitchesService.fetchPitches(),
      fixturesService.fetchFixtures(),
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
    setFixtures(fixturesRes.fixtures);

    setIsLoading(false);
  }, [loadAuthUser]);

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

  const handleSuccessSaveFixtures = async () => {
    showToast('Official season fixtures saved successfully into database.');
    await loadData();
    setActiveView('matchdays');
  };

  // TASK 5A: Authoritative Season State derived directly from database queries
  const hasOfficialSeason = fixtures.length > 0;

  const [modalSeasonState, setModalSeasonState] = useState<SeasonState | null>(null);

  const seasonState: SeasonState = error
    ? 'GENERATION_ERROR'
    : hasOfficialSeason
    ? 'SEASON_OFFICIAL'
    : modalSeasonState || 'SEASON_NOT_GENERATED';

  const isPresidentAuthorized = Boolean(
    userProfile && (userProfile.role === 'president' || userProfile.role === 'admin')
  );

  const handleOpenGenerationModal = () => {
    if (hasOfficialSeason) {
      showToast('The season already has official fixtures saved in the database. Matchups are immutable and cannot be regenerated.');
      return;
    }
    if (!isPresidentAuthorized) {
      showToast('Operational actions are restricted to authenticated President or Admin profiles.');
      return;
    }
    setIsGenerationModalOpen(true);
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
    fixtures,
    userProfile,
    isPresidentAuthorized,
    seasonState,
    hasOfficialSeason,
    isLoading,
    error,
    toastMessage,
    showToast,
    isCoachModalOpen,
    setIsCoachModalOpen,
    isRefModalOpen,
    setIsRefModalOpen,
    isGenerationModalOpen,
    setIsGenerationModalOpen,
    handleOpenGenerationModal,
    setModalSeasonState,
    handleRegisterCoach,
    handleRegisterReferee,
    handleSuccessSaveFixtures,
    refreshData: loadData,
  };
}

