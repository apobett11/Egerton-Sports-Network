import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Trophy, Loader2 } from 'lucide-react';
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

  // Instant SWR state from cached league tables (strictly matching active league IDs)
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
            const isChamp = compId === CHAMP_COMP_ID || compId.includes('2222');
            const isEpl = compId === EPL_COMP_ID || compId.includes('1111');

            const item: DirectoryTeamItem = {
              id: t.id,
              name: t.name || 'Team',
              short_name: t.short_name || '',
              logo_url: t.logo_url || '',
              competition_id: t.competition_id,
            };

            // Strictly separate by active league; do not leak non-league or friendlies teams
            if (isChamp) {
              champ.push(item);
            } else if (isEpl) {
              epl.push(item);
            }
          });

          // Order teams by official standings order if cached; otherwise alphabetical
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

  // Show strictly the teams belonging to the selected active league
  const currentTeams = activeLeague === 'epl' ? eplTeams : champTeams;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none">
      {/* Premium Popup Card */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/90 dark:border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* 1. Modal Top Bar */}
        <div className="px-4 sm:px-6 pt-5 pb-3 border-b border-slate-100 dark:border-[#16283d] flex items-start justify-between relative bg-white dark:bg-[#0e1c2b]">
          <div className="pr-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff0046]/10 text-[#ff0046] text-[10px] font-black uppercase tracking-wider mb-1.5">
              <Trophy className="w-3 h-3 text-[#ff0046]" />
              <span>Team Directory</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Which team profile do you want to see?
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any active team below to open their official team profile.
            </p>
          </div>

          {/* Top-Right "X" Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#14263b] dark:hover:bg-[#1a3350] border border-slate-200 dark:border-[#1a2e45] transition-colors cursor-pointer shrink-0"
            aria-label="Close and return to standings"
            title="Close and return to standings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. League Switcher Buttons: EPL and Championships (Default EPL) */}
        <div className="px-4 sm:px-6 py-3 bg-[#f8fafc]/50 dark:bg-[#09131f]/50 border-b border-slate-100 dark:border-[#16283d]">
          <div className="flex items-center bg-slate-100 dark:bg-[#112236] p-1 rounded-xl border border-slate-200 dark:border-[#1a2e45] w-full">
            <button
              type="button"
              onClick={() => setActiveLeague('epl')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase transition-all cursor-pointer text-center ${
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
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase transition-all cursor-pointer text-center ${
                activeLeague === 'champ'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Championships ({champTeams.length})
            </button>
          </div>
        </div>

        {/* 3. Subtitle / League Title Banner: Deep green font styling identical to League Table */}
        <div className="py-1 px-4 sm:px-6 bg-[#f8fafc] dark:bg-[#0c1827] text-center border-b border-slate-200 dark:border-[#16283d]">
          <span className="text-xs sm:text-[13px] font-bold text-[#1b6b37] dark:text-emerald-400 uppercase tracking-wide">
            {activeLeague === 'epl' ? 'Egerton Premier League' : 'Egerton Championship'} Teams
          </span>
        </div>

        {/* 4. Table-Styled Team List (Exact font, size, color, borders of LeagueTable — without points and stats) */}
        <div className="w-full overflow-hidden max-h-[52vh] overflow-y-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-white dark:bg-[#0e1c2b] border-t-2 border-b-2 border-[#cca01a] text-[#1b6b37] dark:text-emerald-400 font-bold text-[11px] sm:text-xs md:text-sm">
                <th className="py-1.5 px-3 sm:px-4 text-left">Teams</th>
                <th className="py-1.5 px-3 sm:px-4 text-right w-16">Profile</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#0e1c2b]">
              {isLoading && currentTeams.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#ff0046]" />
                      <span>Loading {activeLeague === 'epl' ? 'EPL' : 'Championship'} teams...</span>
                    </div>
                  </td>
                </tr>
              ) : currentTeams.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No teams found in this league.
                  </td>
                </tr>
              ) : (
                currentTeams.map((team, idx) => (
                  <tr
                    key={team.id}
                    onClick={() => onSelectTeam(team.id, team.name)}
                    className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-[#f8fafc] dark:hover:bg-[#13263b] transition-colors cursor-pointer group"
                  >
                    <td className="py-2 sm:py-2.5 px-3 sm:px-4 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        {/* Position Number: identical font & styling to LeagueTable (1., 2., etc.) */}
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs md:text-sm shrink-0 w-5 text-right">
                          {idx + 1}.
                        </span>
                        {/* Team Crest Logo */}
                        <TeamLogo
                          teamId={team.id}
                          src={team.logo_url}
                          alt={team.name}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shrink-0"
                        />
                        {/* Team Name: identical font, size, weight and color */}
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px] sm:text-xs md:text-sm group-hover:text-[#ff0046] transition-colors">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-right">
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-[#ff0046] group-hover:translate-x-0.5 transition-all inline-block align-middle" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Footer with Cancel / Return to Standings Button */}
        <div className="px-4 sm:px-6 py-3 bg-[#f8fafc]/90 dark:bg-[#0c1827]/90 border-t border-slate-200 dark:border-[#16283d] flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Official ESN Directory
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14263b] hover:bg-slate-100 dark:hover:bg-[#1c3552] border border-slate-200 dark:border-[#1a2e45] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            <span>{hasSeenProfile ? 'Close & Return to Standings' : 'Cancel & View Standings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamDirectorySelector;
