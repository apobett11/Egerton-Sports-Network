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

  if (route === 'coach' || route === 'captain') {
    return (
      <ProtectedRoute allowedRoles={['coach', 'captain', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <TeamDashboard />
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

  if (route === 'linesman') {
    return (
      <ProtectedRoute allowedRoles={['linesman', 'referee', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
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
                <FixturesList
                  matches={currentFixtures}
                  onMatchClick={handleMatchClick}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
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

