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
                  <div className="space-y-8 select-none">
                    {/* TASK 8: LEAGUE SNAPSHOT */}
                    <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
                            League Snapshot (Top 5)
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('table')}
                          className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs cursor-pointer transition-all"
                        >
                          View Full Table
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-black/30 text-gray-500 font-bold uppercase border-b border-gray-150 dark:border-gray-800">
                              <th className="p-2 text-center">Pos</th>
                              <th className="p-2">Club</th>
                              <th className="p-2 text-center">P</th>
                              <th className="p-2 text-center">GD</th>
                              <th className="p-2 text-center font-extrabold text-amber-500">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                            {currentStandings.slice(0, 5).map((row) => (
                              <tr key={row.teamId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                <td className="p-2 text-center font-bold text-gray-500">{row.position}</td>
                                <td className="p-2 font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                  <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 object-contain" />
                                  <span>{row.teamName}</span>
                                </td>
                                <td className="p-2 text-center">{row.played}</td>
                                <td className="p-2 text-center font-mono">{row.goalDifference}</td>
                                <td className="p-2 text-center font-black text-amber-500">{row.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TASK 9: STATISTICS (Golden Boot, Top Assists, Clean Sheets) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Golden Boot */}
                      <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-4 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                            Golden Boot
                          </h4>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>FOA Player 10 (Arts)</span>
                            <span className="text-amber-500 font-mono">8 Goals</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>SHK Player 9 (Sharklets)</span>
                            <span className="text-gray-500 font-mono">7 Goals</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>FOS Player 11 (Science)</span>
                            <span className="text-gray-500 font-mono">6 Goals</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Assists */}
                      <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-4 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Top Assists
                          </h4>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>FOA Player 8 (Arts)</span>
                            <span className="text-emerald-500 font-mono">6 Assists</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>FOS Player 7 (Science)</span>
                            <span className="text-gray-500 font-mono">5 Assists</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>SHK Player 10 (Sharklets)</span>
                            <span className="text-gray-500 font-mono">4 Assists</span>
                          </div>
                        </div>
                      </div>

                      {/* Clean Sheets */}
                      <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-4 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-blue-500">
                            Clean Sheets
                          </h4>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>Egerton Sharklets</span>
                            <span className="text-blue-500 font-mono">6 CS</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>Faculty of Arts</span>
                            <span className="text-gray-500 font-mono">4 CS</span>
                          </div>
                          <div className="flex justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/30 font-bold">
                            <span>Faculty of Science</span>
                            <span className="text-gray-500 font-mono">3 CS</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TASK 10: LATEST MATCH STORIES */}
                    <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
                          Latest Match Stories
                        </h3>
                        <button
                          onClick={() => setActiveTab('news')}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          View All Stories
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div
                          onClick={() => setActiveTab('news')}
                          className="p-3 rounded-xl border border-gray-150 dark:border-gray-800 hover:border-emerald-500/40 cursor-pointer space-y-1.5 transition-all"
                        >
                          <span className="text-[10px] font-bold text-amber-500 uppercase">Today</span>
                          <h4 className="font-extrabold text-gray-900 dark:text-gray-100 leading-snug">
                            Egerton Premier League: Sharklets Maintain Lead as FOA Pressures from Second Place
                          </h4>
                          <p className="text-gray-500 line-clamp-2">
                            In a stunning weekend of college football, the Egerton Sharklets clinched another crucial victory...
                          </p>
                        </div>
                        <div
                          onClick={() => setActiveTab('news')}
                          className="p-3 rounded-xl border border-gray-150 dark:border-gray-800 hover:border-emerald-500/40 cursor-pointer space-y-1.5 transition-all"
                        >
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">Yesterday</span>
                          <h4 className="font-extrabold text-gray-900 dark:text-gray-100 leading-snug">
                            TRANSFER ALERT: Njoro FC Eye Faculty of Agriculture Top Striker Ahead of Window
                          </h4>
                          <p className="text-gray-500 line-clamp-2">
                            Sources close to Njoro FC suggest the club is preparing a record student-sports scholarship package...
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* TASK 11: HISTORICAL FOOTBALL */}
                    <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">
                        This Day in Football
                      </span>
                      <h4 className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                        Historical Match Memory (August 2022)
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        In 2022, Faculty of Arts won their 3rd consecutive Campus Cup title after a thrilling 4-3 penalty shootout victory over Faculty of Science at the Egerton Pavilion Stadium.
                      </p>
                    </div>

                    {/* TASK 12: WEEKEND PREVIEW */}
                    <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-sm space-y-2">
                      {(() => {
                        const day = new Date().getDay();
                        const isBeforeWeekend = day >= 1 && day <= 4;
                        return (
                          <>
                            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                              {isBeforeWeekend ? 'Upcoming Weekend Preview' : 'Weekend Matchday Review'}
                            </span>
                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                              {isBeforeWeekend
                                ? 'Weekend Matchday 14: Top 2 Clash at Pavilion'
                                : 'Weekend Matchday 13 Results Summary'}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {isBeforeWeekend
                                ? 'All eyes will be on Egerton Pavilion Stadium as league leaders Egerton Sharklets host second-placed Faculty of Arts in a fixture that could decide the title race.'
                                : 'Matchday 13 produced 12 goals across 4 fixtures with Faculty of Arts securing a late winner and Egerton Sharklets keeping a clean sheet.'}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* TASK 13: CAMPUS RANKINGS */}
                    <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-sm space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
                        Campus Football Rankings & Records
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs text-center">
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 font-bold">Most Goals</div>
                          <div className="font-black text-gray-900 dark:text-gray-100 mt-1">FOA (28)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 font-bold">Most Wins</div>
                          <div className="font-black text-emerald-500 mt-1">Sharklets (9)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 font-bold">Best Defence</div>
                          <div className="font-black text-blue-500 mt-1">Sharklets (8 GA)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 font-bold">Win Streak</div>
                          <div className="font-black text-amber-500 mt-1">5 Matches</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 font-bold">Unbeaten Run</div>
                          <div className="font-black text-emerald-500 mt-1">8 Matches</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-150 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 font-bold">Highest Score</div>
                          <div className="font-black text-purple-500 mt-1">SHK (28)</div>
                        </div>
                      </div>
                    </div>

                    {/* TASK 14: COMMUNITY (No login required) */}
                    <div className="bg-white dark:bg-[#15191B] rounded-2xl border border-gray-200/80 dark:border-gray-800/80 p-5 shadow-sm space-y-3">
                      <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                        Community Poll of the Week
                      </span>
                      <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">
                        Who will win the 2026 Egerton Premier League Championship?
                      </h4>

                      <div className="space-y-2 text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => alert('Thank you for voting! Egerton Sharklets currently leading with 54% of votes.')}
                          className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 hover:bg-emerald-500/10 border border-gray-150 dark:border-gray-800 flex items-center justify-between font-bold text-gray-800 dark:text-gray-200 cursor-pointer transition-all"
                        >
                          <span>Egerton Sharklets</span>
                          <span className="text-emerald-500">54%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('Thank you for voting! Faculty of Arts currently at 36% of votes.')}
                          className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 hover:bg-emerald-500/10 border border-gray-150 dark:border-gray-800 flex items-center justify-between font-bold text-gray-800 dark:text-gray-200 cursor-pointer transition-all"
                        >
                          <span>Faculty of Arts</span>
                          <span className="text-amber-500">36%</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('Thank you for voting! Other Teams currently at 10% of votes.')}
                          className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/30 hover:bg-emerald-500/10 border border-gray-150 dark:border-gray-800 flex items-center justify-between font-bold text-gray-800 dark:text-gray-200 cursor-pointer transition-all"
                        >
                          <span>Faculty of Science / Other</span>
                          <span className="text-gray-400">10%</span>
                        </button>
                      </div>
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

