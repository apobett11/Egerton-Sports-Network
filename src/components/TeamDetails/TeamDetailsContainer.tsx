import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  fetchTeamById,
  fetchTeamPlayers,
  fetchTeamFixtures,
  fetchTeamStandings,
  type FullTeamRecord,
} from '../Dashboards/Team/lib/supabaseClient';
import type { Player, Match, StandingEntry } from '../Dashboards/Team/types';
import { TeamDetailsHeader } from './TeamDetailsHeader';
import { TeamDetailsTabBar, type TeamDetailTabType } from './TeamDetailsTabBar';
import { TeamFixturesTab } from './tabs/TeamFixturesTab';
import { TeamSquadTab } from './tabs/TeamSquadTab';
import { TeamPlayersTab } from './tabs/TeamPlayersTab';
import { TeamStandingsTab } from './tabs/TeamStandingsTab';

interface TeamDetailsContainerProps {
  teamId: string;
  onBack: () => void;
  onSelectMatch?: (match: any) => void;
}

export const TeamDetailsContainer: React.FC<TeamDetailsContainerProps> = ({
  teamId,
  onBack,
  onSelectMatch,
}) => {
  const [activeTab, setActiveTab] = useState<TeamDetailTabType>('fixtures');
  const [team, setTeam] = useState<FullTeamRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlayersLoading, setIsPlayersLoading] = useState<boolean>(false);
  const [isStandingsLoading, setIsStandingsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const playersLoadedRef = useRef<boolean>(false);
  const standingsLoadedRef = useRef<boolean>(false);

  // Phase 1 (Instant First Paint): Fetch team metadata, fixtures, and standings immediately (<300ms)
  const loadPrimaryData = useCallback(async () => {
    if (!teamId) return;
    try {
      setError(null);
      const [teamData, fixturesData, standingsData] = await Promise.all([
        fetchTeamById(teamId),
        fetchTeamFixtures(teamId),
        fetchTeamStandings(teamId).catch(() => []),
      ]);

      if (!teamData) {
        setError('Team not found in the official league database.');
      } else {
        setTeam(teamData);
      }

      setFixtures(fixturesData || []);
      if (standingsData && standingsData.length > 0) {
        setStandings(standingsData);
        standingsLoadedRef.current = true;
      }
    } catch (err: any) {
      console.error('[TeamDetailsContainer] Error fetching primary team data:', err);
      setError('Unable to load team records from database. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  // Phase 2 (Progressive / On-demand): Fetch squad players
  const loadPlayersData = useCallback(async () => {
    if (!teamId || playersLoadedRef.current) return;
    setIsPlayersLoading(true);
    try {
      const playersData = await fetchTeamPlayers(teamId);
      setPlayers(playersData || []);
      playersLoadedRef.current = true;
    } catch (err: any) {
      console.warn('[TeamDetailsContainer] Error fetching players:', err);
    } finally {
      setIsPlayersLoading(false);
    }
  }, [teamId]);

  // Phase 2 (Progressive / On-demand): Fetch league standings
  const loadStandingsData = useCallback(async () => {
    if (!teamId || standingsLoadedRef.current) return;
    setIsStandingsLoading(true);
    try {
      const standingsData = await fetchTeamStandings(teamId);
      setStandings(standingsData || []);
      standingsLoadedRef.current = true;
    } catch (err: any) {
      console.warn('[TeamDetailsContainer] Error fetching standings:', err);
    } finally {
      setIsStandingsLoading(false);
    }
  }, [teamId]);

  // Initial mount: load primary data fast, then queue secondary data
  useEffect(() => {
    setIsLoading(true);
    playersLoadedRef.current = false;
    standingsLoadedRef.current = false;
    loadPrimaryData();

    // Defer background fetch of squad and standings so primary paint is sub-second
    const prefetchTimer = setTimeout(() => {
      loadPlayersData();
      loadStandingsData();
    }, 200);

    return () => clearTimeout(prefetchTimer);
  }, [teamId, loadPrimaryData, loadPlayersData, loadStandingsData]);

  // On-demand fetch when user switches tabs before background prefetch finishes
  useEffect(() => {
    if ((activeTab === 'squad' || activeTab === 'players') && !playersLoadedRef.current) {
      loadPlayersData();
    } else if (activeTab === 'standings' && !standingsLoadedRef.current) {
      loadStandingsData();
    }
  }, [activeTab, loadPlayersData, loadStandingsData]);

  // Realtime updates
  useEffect(() => {
    if (!teamId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (fn: () => void) => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        fn();
      }, 3000);
    };
    const channel = supabase
      .channel(`team_details_${teamId}_sync`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        () => {
          schedule(() => loadPrimaryData());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'league_standings' },
        () => {
          schedule(() => {
            standingsLoadedRef.current = false;
            loadStandingsData();
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `team_id=eq.${teamId}` },
        () => {
          schedule(() => {
            playersLoadedRef.current = false;
            loadPlayersData();
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${teamId}` },
        (payload) => {
          const next = (payload.new || {}) as Record<string, unknown>;
          const prev = (payload.old || {}) as Record<string, unknown>;
          if (Object.keys(prev).length > 0) {
            const watched = ['name', 'short_name', 'coach_id', 'captain_id', 'starting_xi_str', 'substitutes_str', 'tactics_config'];
            const changed = watched.some((key) => JSON.stringify(next[key]) !== JSON.stringify(prev[key]));
            if (!changed) return;
          } else {
            return;
          }
          schedule(() => loadPrimaryData());
        }
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [teamId, loadPrimaryData, loadStandingsData, loadPlayersData]);

  const currentStanding = useMemo(() => {
    return standings.find(
      (s) =>
        s.isCurrent ||
        (team?.name && s.teamName.toLowerCase() === team.name.toLowerCase())
    );
  }, [standings, team]);

  const startingXIIds = useMemo(() => {
    if (team?.starting_xi_str) {
      return team.starting_xi_str.split(',').map((id) => id.trim());
    }
    return players.slice(0, 11).map((p) => p.id);
  }, [team, players]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff0046]" />
        <span className="text-xs font-black uppercase tracking-wider">
          Loading official team data...
        </span>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase">
            Team Profile Unavailable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {error || 'No matching team records found.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-black rounded-full transition-colors cursor-pointer"
        >
          Return to Standings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 pb-24 transition-colors relative">
      {/* 1. MATCH DETAILS-STYLE HEADER */}
      <TeamDetailsHeader
        team={team}
        standing={currentStanding}
        onBack={onBack}
      />

      {/* 2. MATCH DETAILS-STYLE STICKY TAB BAR */}
      <TeamDetailsTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playersCount={players.length}
        fixturesCount={fixtures.length}
      />

      {/* 3. ACTIVE TAB CONTENT WORKSPACE */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 relative z-10">
        {activeTab === 'fixtures' && (
          <TeamFixturesTab
            fixtures={fixtures}
            currentTeamName={team.name}
            currentTeamLogo={team.logo_url}
            teamId={team.id}
            standing={currentStanding}
            standings={standings}
            onSelectMatch={onSelectMatch}
          />
        )}

        {activeTab === 'squad' && (
          isPlayersLoading && players.length === 0 ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
              <Loader2 className="w-7 h-7 animate-spin text-[#ff0046]" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading squad tactics & formation...</span>
            </div>
          ) : (
            <TeamSquadTab
              teamId={team.id}
              roster={players}
              teamName={team.name}
              teamCrest={team.logo_url}
              team={team}
              startingXIIds={startingXIIds}
              onNavigateBack={() => setActiveTab('fixtures')}
            />
          )
        )}

        {activeTab === 'players' && (
          isPlayersLoading && players.length === 0 ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
              <Loader2 className="w-7 h-7 animate-spin text-[#ff0046]" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading squad roster...</span>
            </div>
          ) : (
            <TeamPlayersTab
              roster={players}
              teamName={team.name}
              teamId={team.id}
              startingXIIds={startingXIIds}
            />
          )
        )}

        {activeTab === 'standings' && (
          isStandingsLoading && standings.length === 0 ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-400 select-none">
              <Loader2 className="w-7 h-7 animate-spin text-[#ff0046]" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading league standings...</span>
            </div>
          ) : (
            <TeamStandingsTab
              standings={standings}
              fixtures={fixtures}
              currentTeamName={team.name}
              currentTeamLogo={team.logo_url}
            />
          )
        )}
      </main>
    </div>
  );
};

export default TeamDetailsContainer;
