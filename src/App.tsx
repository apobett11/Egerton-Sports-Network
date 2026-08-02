import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { Navigation } from './components/Layout/Navigation';
import type { MainTabType } from './components/Layout/Navigation';
import { FixturesList } from './components/MainFeed/FixturesList';
import { LeagueTable } from './components/MainFeed/LeagueTable';
import { PublicNewsPage } from './pages/public/PublicPages';
import { MatchDetailsContainer } from './components/MatchDetails/MatchDetailsContainer';
import { type AllowedRole } from './components/Auth/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { HerdMentalityProvider } from './project_stark';
import { mockMatches, teams as mockTeamsDict } from './mockData';
import type { Match } from './types';
import { calculateLeagueStandings } from './lib/leagueEngine';
import { useLiveMatchRealtime } from './hooks/useLiveMatchRealtime';
import { ToastContainer } from './components/common/ToastContainer';
import { X, Activity, Trophy, Award, LogIn, Loader2 } from 'lucide-react';

const SuperAdminDashboard = lazy(() => import('./components/Dashboards/SuperAdmin/SuperAdminDashboard'));
const TeamDashboard = lazy(() => import('./components/Dashboards/Team/TeamDashboard'));
const JournalistDashboard = lazy(() => import('./components/Dashboards/Journalist/JournalistDashboard'));
const PresidentDashboard = lazy(() => import('./components/Dashboards/President/PresidentDashboard'));
const RefereeDashboard = lazy(() => import('./components/Dashboards/Referee/RefereeDashboard'));
const LinesmanDashboard = lazy(() => import('./components/Dashboards/Linesman/LinesmanDashboard'));
const PlayerDashboard = lazy(() => import('./components/Dashboards/Player/PlayerDashboard'));
const DoctorDashboard = lazy(() => import('./components/Dashboards/Doctor/DoctorDashboard'));
const LoginPage = lazy(() => import('./components/Auth/LoginPage').then(m => ({ default: m.LoginPage })));

const DashboardLoader: React.FC = () => (
  <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center gap-4 text-emerald-500">
    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    <span className="text-sm font-semibold tracking-wide text-gray-400">Loading Dashboard Module...</span>
  </div>
);

const getHashRoute = (): string => {
  return window.location.hash.replace(/^#\/?/, '').toLowerCase() || 'home';
};

export const AppContent: React.FC = () => {
  // Hash route state for direct UI link switching without auth prompt
  const [route, setRoute] = useState<string>(getHashRoute);

  // Appearance & Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Navigation & Routing States
  const [activeTab, setActiveTab] = useState<MainTabType>('scores');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Favorites list
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSport, setActiveSport] = useState<string>('football');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Sync route on hash change
  useEffect(() => {
    const handleHash = () => {
      setRoute(getHashRoute());
      setSelectedMatch(null);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Lock body scroll and add Esc listener when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSidebarOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [sidebarOpen]);


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const toggleFavorite = (matchId: string) => {
    setFavorites((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleBackToHome = () => {
    setSelectedMatch(null);
    window.location.hash = '/home';
  };

  const handleNavigateHash = (targetHash: string) => {
    window.location.hash = targetHash;
    setRoute(targetHash.replace(/^\//, '').toLowerCase());
    setSelectedMatch(null);
  };

  const { matches: liveMatches, toasts, dismissToast } = useLiveMatchRealtime(mockMatches);

  // Dynamically computed standings derived strictly from finalized matches in liveMatches
  const currentStandings = useMemo(() => {
    const teamsList = Object.values(mockTeamsDict).map((t) => ({ id: t.id, name: t.name, logo: t.logo }));
    return calculateLeagueStandings(liveMatches, teamsList);
  }, [liveMatches]);

  const getFilteredMatches = () => {
    const today = new Date();
    const isTodaySelected = selectedDate.toDateString() === today.toDateString();

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrowSelected = selectedDate.toDateString() === tomorrow.toDateString();

    if (activeSport !== 'football') return [];

    if (isTodaySelected) {
      return liveMatches.filter((m) => m.id !== 'm5');
    } else if (isTomorrowSelected) {
      return liveMatches.filter((m) => m.id === 'm5');
    } else {
      return [];
    }
  };

  const currentFixtures = getFilteredMatches();
  const favoriteMatches = liveMatches.filter((m) => favorites.includes(m.id));

  // --- DIRECT UNPROMPTED DASHBOARD ROUTING WITH ROLE GUARDS ---
  if (route === 'admin') {
    return (
      <ProtectedRoute allowedRoles={['admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <SuperAdminDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'coach') {
    return (
      <ProtectedRoute allowedRoles={['coach', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <TeamDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'captain') {
    return (
      <ProtectedRoute allowedRoles={['captain', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <TeamDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'doctor' || route === 'team_doctor') {
    return (
      <ProtectedRoute allowedRoles={['doctor', 'team_doctor', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <DoctorDashboard onLogout={() => handleNavigateHash('/home')} />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'journalist') {
    return (
      <ProtectedRoute allowedRoles={['journalist', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <JournalistDashboard onLogout={() => handleNavigateHash('/home')} />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'president') {
    return (
      <ProtectedRoute allowedRoles={['president', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <PresidentDashboard onLogout={() => handleNavigateHash('/home')} />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'referee') {
    return (
      <ProtectedRoute allowedRoles={['referee', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <RefereeDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'linesman' || route === 'assistant_referee') {
    return (
      <ProtectedRoute allowedRoles={['linesman', 'assistant_referee', 'referee', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <LinesmanDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'player') {
    return (
      <ProtectedRoute allowedRoles={['player', 'captain', 'coach', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <PlayerDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'login') {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <LoginPage
          onLoginSuccess={(role: AllowedRole) => handleNavigateHash(`/${role.toLowerCase()}`)}
          onCancel={() => handleNavigateHash('/home')}
        />
      </Suspense>
    );
  }

  return (
    <HerdMentalityProvider>
      <OfflineBanner />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? 'bg-[#111111] text-gray-200' : 'bg-gray-50 text-gray-800'
      }`}>
        {/* Sidebar Drawer overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
          >
            <div
              className="w-72 max-w-[80vw] h-full bg-white dark:bg-[#1E1E1E] shadow-2xl p-6 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-emerald-500/20">
                      E
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
                      Egerton Athletics
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation drawer"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>


                <div className="space-y-4">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Campus Leagues</div>
                  <ul className="space-y-2">
                    <li onClick={() => { setSidebarOpen(false); setActiveTab('scores'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-250 cursor-pointer">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>Egerton Premier League</span>
                    </li>
                    <li onClick={() => { setSidebarOpen(false); setActiveTab('scores'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-250 cursor-pointer">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Egerton Championships</span>
                    </li>
                    <li onClick={() => { setSidebarOpen(false); setActiveTab('scores'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-250 cursor-pointer">
                      <Trophy className="w-4 h-4 text-blue-500" />
                      <span>Special Games</span>
                    </li>
                  </ul>
                </div>

                {/* Authentication Entry Point */}
                <div className="space-y-4">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Authentication</div>
                  <ul className="space-y-1.5">
                    <li onClick={() => { setSidebarOpen(false); handleNavigateHash('/login'); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer shadow-sm transition-colors">
                      <LogIn className="w-4 h-4" />
                      <span>Login to Platform</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider text-center">
                Egerton Athletics v1.0.0
              </div>
            </div>
          </div>
        )}

        {/* Main Switch Router */}
        {selectedMatch ? (
          <MatchDetailsContainer
            match={selectedMatch}
            onBack={handleBackToHome}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          // Home view
          <>
            <Header
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              activeSport={activeSport}
              setActiveSport={setActiveSport}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onMenuClick={() => setSidebarOpen(true)}
              onNavigateNews={() => setActiveTab('news')}
              onNavigateLogin={() => handleNavigateHash('/login')}
            />

            <Navigation
              activeTab={activeTab}
              setActiveTab={(tab) => {
                if (tab === 'login') {
                  handleNavigateHash('/login');
                } else {
                  setActiveTab(tab);
                }
              }}
              favoritesCount={favorites.length}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {activeTab === 'scores' && (
                <div className="space-y-10">
                  <FixturesList
                    matches={currentFixtures}
                    onMatchClick={handleMatchClick}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />

                  {/* HOMEPAGE CONTINUOUS FOOTBALL DISCOVERY FLOW */}
                  <div className="space-y-12 select-none pt-4">
                    {/* 1. STATISTIC (Hero League Counters) */}
                    <div className="grid grid-cols-3 gap-4 p-6 rounded-2xl bg-slate-50/60 dark:bg-[#121618] border border-slate-200/70 dark:border-slate-800/70">
                      <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <span>⚽</span>
                          <span>Goals / Game</span>
                        </div>
                        <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">2.8</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center space-y-1 border-x border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <span>🏆</span>
                          <span>Played</span>
                        </div>
                        <span className="text-2xl md:text-3xl font-black font-mono text-amber-500">12</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <span>🔥</span>
                          <span>Best Streak</span>
                        </div>
                        <span className="text-2xl md:text-3xl font-black font-mono text-emerald-500">8</span>
                      </div>
                    </div>

                    {/* 2. LEADERBOARD (Top 5 League Snapshot) */}
                    <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                            League Snapshot
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('table')}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Full Standings</span>
                          <span>→</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-3 text-center w-8">#</th>
                              <th className="pb-3">Club</th>
                              <th className="pb-3 text-center">P</th>
                              <th className="pb-3 text-center">GD</th>
                              <th className="pb-3 text-right font-extrabold text-amber-500">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {currentStandings.slice(0, 5).map((row) => (
                              <tr key={row.teamId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 text-center font-black text-slate-400">{row.position}</td>
                                <td className="py-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                                  <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain" />
                                  <span>{row.teamName}</span>
                                </td>
                                <td className="py-3 text-center text-slate-500">{row.played}</td>
                                <td className="py-3 text-center font-mono text-slate-600 dark:text-slate-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                                <td className="py-3 text-right font-black text-base text-amber-500 font-mono">{row.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 3. WIDE STORY (Featured Match Story) */}
                    <div
                      onClick={() => setActiveTab('news')}
                      className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-[#141819] to-slate-950 border border-slate-800 text-white cursor-pointer hover:border-amber-500/40 transition-all space-y-3"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <span>🔥</span>
                        <span>FEATURED STORY</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">Today</span>
                      </div>
                      <h4 className="text-base md:text-lg font-black leading-snug tracking-tight">
                        Egerton Premier League: Sharklets Maintain Lead as FOA Pressures from Second Place
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        Title race intensifies after crucial weekend matchday results across campus pitches.
                      </p>
                    </div>

                    {/* 4. MINI CARDS (Key Player Leaders: Goals, Assists, Clean Sheets) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Goals */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-amber-500 uppercase tracking-wider">
                            <span>⚽</span> Goals
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">Rank</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">FOA Player 10</span>
                            <span className="text-xl font-black font-mono text-amber-500">8</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>SHK Player 9</span>
                            <span className="font-mono font-bold text-slate-400">7</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>FOS Player 11</span>
                            <span className="font-mono font-bold text-slate-400">6</span>
                          </div>
                        </div>
                      </div>

                      {/* Assists */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-emerald-500 uppercase tracking-wider">
                            <span>🎯</span> Assists
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">Rank</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">FOA Player 8</span>
                            <span className="text-xl font-black font-mono text-emerald-500">6</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>FOS Player 7</span>
                            <span className="font-mono font-bold text-slate-400">5</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>SHK Player 10</span>
                            <span className="font-mono font-bold text-slate-400">4</span>
                          </div>
                        </div>
                      </div>

                      {/* Clean Sheets */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-blue-500 uppercase tracking-wider">
                            <span>🧤</span> Clean Sheets
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">CS</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Egerton Sharklets</span>
                            <span className="text-xl font-black font-mono text-blue-500">6</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Faculty of Arts</span>
                            <span className="font-mono font-bold text-slate-400">4</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Faculty of Science</span>
                            <span className="font-mono font-bold text-slate-400">3</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. STATISTIC (Campus Football Rankings & Records) */}
                    <div className="p-6 md:p-8 rounded-2xl bg-slate-50/70 dark:bg-[#121618] border border-slate-200/70 dark:border-slate-800/70 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📈</span>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Campus League Records
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-white dark:bg-[#181c1e] border border-slate-200/60 dark:border-slate-800/60">
                          <div className="text-[11px] text-slate-400 font-bold">Most Goals</div>
                          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">28</div>
                          <div className="text-[10px] text-slate-500 font-semibold">Faculty of Arts</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-[#181c1e] border border-slate-200/60 dark:border-slate-800/60">
                          <div className="text-[11px] text-slate-400 font-bold">Most Wins</div>
                          <div className="text-xl font-black text-emerald-500 mt-1">9</div>
                          <div className="text-[10px] text-slate-500 font-semibold">Sharklets</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-[#181c1e] border border-slate-200/60 dark:border-slate-800/60">
                          <div className="text-[11px] text-slate-400 font-bold">Best Defence</div>
                          <div className="text-xl font-black text-blue-500 mt-1">8 GA</div>
                          <div className="text-[10px] text-slate-500 font-semibold">Sharklets</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-[#181c1e] border border-slate-200/60 dark:border-slate-800/60">
                          <div className="text-[11px] text-slate-400 font-bold">Win Streak</div>
                          <div className="text-xl font-black text-amber-500 mt-1">5</div>
                          <div className="text-[10px] text-slate-500 font-semibold">Matches</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-[#181c1e] border border-slate-200/60 dark:border-slate-800/60 col-span-2 sm:col-span-1">
                          <div className="text-[11px] text-slate-400 font-bold">Unbeaten</div>
                          <div className="text-xl font-black text-emerald-500 mt-1">8</div>
                          <div className="text-[10px] text-slate-500 font-semibold">Matches</div>
                        </div>
                      </div>
                    </div>

                    {/* 6. NEWS & POLL (Weekend Preview & Title Poll) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Weekend Preview */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                          <span>📅</span>
                          <span className="uppercase tracking-wider">Weekend Preview</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                          Top 2 Title Clash: Sharklets vs FOA
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Egerton Pavilion Stadium • Saturday 16:00
                        </p>
                      </div>

                      {/* Title Poll */}
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                          <span>🔥</span>
                          <span className="uppercase tracking-wider">Title Poll</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                          <span>Egerton Sharklets</span>
                          <span className="text-emerald-500 font-mono">54%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                          <span>Faculty of Arts</span>
                          <span className="text-amber-500 font-mono">36%</span>
                        </div>
                      </div>
                    </div>

                    {/* 7. HISTORICAL CARD (This Day in Football) */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#15191B] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">⏱</span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">This Day in Football</span>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                            August 2022 • FOA 4-3 FOS (Penalties)
                          </h4>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Campus Cup Final</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'table' && <LeagueTable tableData={currentStandings} />}

              {activeTab === 'news' && <PublicNewsPage />}

              {activeTab === 'favorites' && (
                <FixturesList
                  matches={favoriteMatches}
                  onMatchClick={handleMatchClick}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              )}
            </main>

            <Footer />
          </>
        )}
      </div>
    </HerdMentalityProvider>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <ConfirmationProvider>
        <AppContent />
      </ConfirmationProvider>
    </ToastProvider>
  </AuthProvider>
);

export default App;

