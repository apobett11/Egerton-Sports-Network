import React, { useState, useEffect, useMemo } from 'react';
import { X, Trophy, CheckCircle2, Heart, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { teams as mockTeamsData } from '../mockData';

export interface OnboardingScreenProps {
  onTeamSelected: (teamId: string | null) => void;
  onClose?: () => void;
}

export interface TeamOption {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  colorCode: string;
  competitionName: string;
  isEPL: boolean;
  isChampionship: boolean;
}

const getInitialFallbackTeams = (): TeamOption[] => {
  return Object.entries(mockTeamsData).map(([id, t], index) => {
    const isEPL = index < 4; // First 4 as EPL, rest as Championships
    return {
      id: t.id || id,
      name: t.name,
      shortName: t.shortName,
      logo: t.logo,
      colorCode: t.colorCode,
      competitionName: isEPL ? 'Egerton Premier League' : 'Egerton Championship',
      isEPL,
      isChampionship: !isEPL
    };
  });
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onTeamSelected,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>(getInitialFallbackTeams);
  const [, setLoading] = useState<boolean>(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [showCongratulations, setShowCongratulations] = useState<boolean>(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount and register Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (onClose) {
          onClose();
        } else {
          onTeamSelected(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onClose, onTeamSelected]);

  // Load registered teams from Supabase with fallback to mock data
  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            short_name,
            logo_url,
            color_code,
            competition_id,
            competitions (
              id,
              name,
              slug
            )
          `)
          .order('name');

        if (!error && data && data.length > 0) {
          const mapped: TeamOption[] = data.map((t: any) => {
            const compName = t.competitions?.name || '';
            const compSlug = t.competitions?.slug || '';
            const isEPL =
              t.competition_id === '11111111-1111-1111-1111-111111111111' ||
              compName.toLowerCase().includes('premier') ||
              compSlug.toLowerCase().includes('premier') ||
              compSlug.toLowerCase().includes('epl');
            const isChampionship =
              t.competition_id === '22222222-2222-2222-2222-222222222222' ||
              compName.toLowerCase().includes('championship') ||
              compSlug.toLowerCase().includes('championship');

            return {
              id: t.id,
              name: t.name,
              shortName: t.short_name || t.name.substring(0, 3).toUpperCase(),
              logo: t.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.name)}`,
              colorCode: t.color_code || '#ff0046',
              competitionName: compName || (isEPL ? 'Egerton Premier League' : isChampionship ? 'Egerton Championship' : 'Campus Football'),
              isEPL,
              isChampionship
            };
          });

          if (isMounted) {
            setAvailableTeams(mapped);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Unable to fetch live teams from database, using seed dataset:', err);
      }

      // Fallback to mock teams
      const fallbackTeams: TeamOption[] = Object.entries(mockTeamsData).map(([id, t], index) => {
        const isEPL = index < 4; // First 4 as EPL, rest as Championships
        return {
          id: t.id || id,
          name: t.name,
          shortName: t.shortName,
          logo: t.logo,
          colorCode: t.colorCode,
          competitionName: isEPL ? 'Egerton Premier League' : 'Egerton Championship',
          isEPL,
          isChampionship: !isEPL
        };
      });

      if (isMounted) {
        setAvailableTeams(fallbackTeams);
        setLoading(false);
      }
    }

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort teams:
  // As the user types characters, filter and sort matching teams by prefix/character match,
  // prioritizing Egerton Premier League (EPL) teams first, followed by Egerton Championships.
  const filteredTeams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return [...availableTeams].sort((a, b) => {
        const compRankA = a.isEPL ? 0 : a.isChampionship ? 1 : 2;
        const compRankB = b.isEPL ? 0 : b.isChampionship ? 1 : 2;
        if (compRankA !== compRankB) return compRankA - compRankB;
        return a.name.localeCompare(b.name);
      });
    }

    const matches = availableTeams.filter((t) => {
      const name = t.name.toLowerCase();
      const shortName = t.shortName.toLowerCase();
      return name.includes(query) || shortName.includes(query);
    });

    return matches.sort((a, b) => {
      // 1. Competition priority: EPL (0) > Championship (1) > Others (2)
      const compRankA = a.isEPL ? 0 : a.isChampionship ? 1 : 2;
      const compRankB = b.isEPL ? 0 : b.isChampionship ? 1 : 2;
      if (compRankA !== compRankB) {
        return compRankA - compRankB;
      }

      // 2. Prefix / character match priority within competition
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aShort = a.shortName.toLowerCase();
      const bShort = b.shortName.toLowerCase();

      const aStartsExact = aName.startsWith(query) || aShort.startsWith(query);
      const bStartsExact = bName.startsWith(query) || bShort.startsWith(query);

      if (aStartsExact && !bStartsExact) return -1;
      if (!aStartsExact && bStartsExact) return 1;

      // Word prefix match (e.g. "Hawks" in "Egerton Hawks")
      const aWordStarts = aName.split(/\s+/).some((w) => w.startsWith(query));
      const bWordStarts = bName.split(/\s+/).some((w) => w.startsWith(query));
      if (aWordStarts && !bWordStarts) return -1;
      if (!aWordStarts && bWordStarts) return 1;

      // 3. Alphabetical tie-breaker
      return a.name.localeCompare(b.name);
    });
  }, [availableTeams, searchTerm]);

  // Handle Close (X) button: immediate sub-second dismissal with null binding
  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (onClose) {
      onClose();
    } else {
      onTeamSelected(null);
    }
  };

  // Handle "I am a general football fan"
  const handleGeneralFan = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onTeamSelected(null);
  };

  // Handle team selection with congratulations transition
  const handleSelectTeam = (team: TeamOption) => {
    setSelectedTeam(team);
    setShowCongratulations(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTeamSelected(team.id);
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300 animate-fadeIn"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0e1726] border border-slate-700/60 shadow-2xl text-white">
        {/* Top Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ff0046] via-amber-500 to-emerald-500" />

        {/* Close (X) Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close onboarding"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {showCongratulations && selectedTeam ? (
            /* Selection & Congratulations State */
            <div className="flex flex-col items-center text-center py-6 space-y-4 animate-scaleUp">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2"
                  style={{ borderColor: selectedTeam.colorCode || '#ff0046', backgroundColor: '#132238' }}
                >
                  <img
                    src={selectedTeam.logo}
                    alt={selectedTeam.name}
                    className="w-14 h-14 object-contain rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">Welcome to the Club!</h3>
                <p className="text-sm text-slate-300">
                  Congratulations! You have joined fellow fans of <span className="font-bold text-emerald-400">{selectedTeam.name}</span>.
                </p>
                <p className="text-xs text-slate-400">
                  Personalizing your matchday scores, team alerts, and live fixtures...
                </p>
              </div>

              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2" />
            </div>
          ) : (
            /* Standard Onboarding Flow */
            <div className="space-y-6">
              {/* Polite Warm Exclaimer */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[#ff0046] text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Personalized Fan Experience</span>
                </div>
                <h2 id="onboarding-modal-title" className="text-2xl font-black tracking-tight text-white">
                  Pick Your Favourite Team
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Choose your favorite team to personalize your fan experience, live match notifications, upcoming fixtures, and campus derby stats.
                </p>
              </div>

              {/* Team Search Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="input team name"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    autoFocus
                    className="w-full bg-[#162234] border border-slate-600 focus:border-[#ff0046] focus:ring-2 focus:ring-[#ff0046]/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Real-time search results and available teams list */}
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-700/80 bg-[#121c2c] divide-y divide-slate-800/80 shadow-inner">
                  {filteredTeams.length > 0 ? (
                    filteredTeams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => handleSelectTeam(team)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#1c2d46] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center p-0.5 border shrink-0"
                            style={{ borderColor: team.colorCode }}
                          >
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="w-full h-full object-contain rounded-full"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                              {team.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium truncate">
                              {team.shortName} • {team.competitionName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {team.isEPL ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-[#ff0046] border border-rose-500/30">
                              EPL
                            </span>
                          ) : team.isChampionship ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Championship
                            </span>
                          ) : null}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-rose-400 font-medium">
                      no teams with such names. try retyping.
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative Action: General Football Fan */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleGeneralFan}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>I am a general football fan</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const FanOnboardingOverlay = OnboardingScreen;
export default OnboardingScreen;
