import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Trophy, Shield, Loader2 } from 'lucide-react';
import { TeamLogo } from '../common/TeamLogo';
import { supabase } from '../../lib/supabase';
import { readCachedLeagueTable } from '../../services/guestSportsService';

const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
const CHAMP_COMP_ID = '22222222-2222-2222-2222-222222222222';

export interface DirectoryTeamItem {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  competition_id?: string;
}

interface TeamDirectorySelectorProps {
  onSelectTeam: (teamId: string, teamName: string) => void;
  onClose: () => void;
  hasSeenProfile?: boolean;
}

export const TeamDirectorySelector: React.FC<TeamDirectorySelectorProps> = ({
  onSelectTeam,
  onClose,
  hasSeenProfile = false,
}) => {
  const [activeLeague, setActiveLeague] = useState<'epl' | 'champ'>('epl');

  // Instant SWR state from cached league tables
  const [eplTeams, setEplTeams] = useState<DirectoryTeamItem[]>(() => {
    const cached = readCachedLeagueTable(EPL_COMP_ID);
    if (cached && cached.length > 0) {
      return cached.map((c) => ({
        id: c.teamId,
        name: c.teamName,
        logo_url: c.teamLogo,
        competition_id: EPL_COMP_ID,
      }));
    }
    return [];
  });

  const [champTeams, setChampTeams] = useState<DirectoryTeamItem[]>(() => {
    const cached = readCachedLeagueTable(CHAMP_COMP_ID);
    if (cached && cached.length > 0) {
      return cached.map((c) => ({
        id: c.teamId,
        name: c.teamName,
        logo_url: c.teamLogo,
        competition_id: CHAMP_COMP_ID,
      }));
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => eplTeams.length === 0);

  useEffect(() => {
    let isMounted = true;

    const loadTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name, short_name, logo_url, competition_id, status')
          .order('name', { ascending: true });

        if (error) {
          console.warn('[TeamDirectorySelector] Error loading teams:', error);
          return;
        }

        if (isMounted && data) {
          const epl: DirectoryTeamItem[] = [];
          const champ: DirectoryTeamItem[] = [];

          data.forEach((t: any) => {
            const compId = t.competition_id || '';
            const isChamp =
              compId === CHAMP_COMP_ID ||
              compId.includes('2222') ||
              t.name?.toLowerCase().includes('championship');

            const item: DirectoryTeamItem = {
              id: t.id,
              name: t.name || 'Team',
              short_name: t.short_name || '',
              logo_url: t.logo_url || '',
              competition_id: t.competition_id,
            };

            if (isChamp) {
              champ.push(item);
            } else {
              epl.push(item);
            }
          });

          // If cached standings exist, maintain standings order; otherwise sort alphabetically
          const eplCached = readCachedLeagueTable(EPL_COMP_ID);
          if (eplCached && eplCached.length > 0) {
            const orderMap = new Map(eplCached.map((item, idx) => [item.teamId, idx]));
            epl.sort((a, b) => {
              const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
              const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
              return posA - posB;
            });
          }

          const champCached = readCachedLeagueTable(CHAMP_COMP_ID);
          if (champCached && champCached.length > 0) {
            const orderMap = new Map(champCached.map((item, idx) => [item.teamId, idx]));
            champ.sort((a, b) => {
              const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
              const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
              return posA - posB;
            });
          }

          setEplTeams(epl);
          setChampTeams(champ);
        }
      } catch (err) {
        console.warn('[TeamDirectorySelector] Failed to fetch teams:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentTeams = activeLeague === 'epl' ? eplTeams : champTeams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 py-6 sm:py-10 px-3 sm:px-6 transition-colors select-none">
      <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* Main Header Card */}
        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e2e8f0] dark:border-[#1a2e45] rounded-2xl p-4 sm:p-6 shadow-xs relative">
          {/* Close "X" Button in Top Right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#14263b] dark:hover:bg-[#1a3350] border border-slate-200 dark:border-[#1a2e45] transition-colors cursor-pointer"
            aria-label="Close and return to standings"
            title="Close and return to standings"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Heading */}
          <div className="pr-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff0046]/10 text-[#ff0046] text-[10px] font-black uppercase tracking-wider mb-2">
              <Shield className="w-3 h-3" />
              <span>Team Directory</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Which team profile do you want to see?
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any team below to view their matches, scorers, assisters, roster, and statistics.
            </p>
          </div>

          {/* League Switcher (EPL and Championships Buttons, default EPL) */}
          <div className="mt-5 flex items-center bg-slate-100 dark:bg-[#14263b] p-1 rounded-xl border border-slate-200 dark:border-[#1a2e45] max-w-sm">
            <button
              type="button"
              onClick={() => setActiveLeague('epl')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase transition-all cursor-pointer text-center ${
                activeLeague === 'epl'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EPL ({eplTeams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLeague('champ')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase transition-all cursor-pointer text-center ${
                activeLeague === 'champ'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Championships ({champTeams.length})
            </button>
          </div>
        </div>

        {/* Team List Container (Like standings table, but no points, no stats—just team names and logos) */}
        <div className="bg-white dark:bg-[#0c1827] border border-[#e2e8f0] dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 sm:px-5 py-3 bg-slate-50/80 dark:bg-[#112236]/80 border-b border-slate-100 dark:border-[#162a42] flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {activeLeague === 'epl' ? 'Egerton Premier League' : 'Egerton Championship'} Teams
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              Tap to View Profile
            </span>
          </div>

          {isLoading && currentTeams.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff0046]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Loading official teams...
              </span>
            </div>
          ) : currentTeams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No teams found in this league.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#14263b]">
              {currentTeams.map((team, idx) => (
                <div
                  key={team.id}
                  onClick={() => onSelectTeam(team.id, team.name)}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-50 dark:hover:bg-[#112236] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Index like Standings table */}
                    <span className="w-5 text-center font-mono text-xs font-extrabold text-slate-400 dark:text-slate-500">
                      {idx + 1}
                    </span>
                    <TeamLogo
                      src={team.logo_url}
                      teamId={team.id}
                      alt={team.name}
                      className="w-8 h-8 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#ff0046] transition-colors">
                      {team.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel / Close Button below list (especially once one has seen a team profile or wants to return) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#0e1c2b] hover:bg-slate-100 dark:hover:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45] text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            <span>{hasSeenProfile ? 'Close & Return to Standings' : 'Cancel & View Standings'}</span>
          </button>

          <span className="text-[11px] text-slate-400 font-medium text-center">
            Official ESN Team Directory
          </span>
        </div>
      </div>
    </div>
  );
};

export default TeamDirectorySelector;
