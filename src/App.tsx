import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { Navigation } from './components/Layout/Navigation';
import type { MainTabType } from './components/Layout/Navigation';
import { FixturesList } from './components/MainFeed/FixturesList';
import { LeagueTable } from './components/MainFeed/LeagueTable';
import { PublicNewsPage } from './pages/public/PublicPages';
import { HomePage } from './pages/public/HomePage';
import { MatchDetailsContainer } from './components/MatchDetails/MatchDetailsContainer';
import { type AllowedRole } from './components/Auth/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { HerdMentalityProvider } from './project_stark';
import type { Match, Team } from './types';
import { calculateLeagueStandings } from './lib/leagueEngine';
import { useLiveMatchRealtime } from './hooks/useLiveMatchRealtime';
import { ToastContainer } from './components/common/ToastContainer';
import { useDeviceIdentity } from './hooks/useDeviceIdentity';
import { DeviceService } from './services/DeviceService';
import { OnboardingScreen } from './components/OnboardingScreen';
import { X, Activity, Trophy, Award, LogIn, Loader2, Moon, Sun } from 'lucide-react';

const SuperAdminDashboard = lazy(() => import('./components/Dashboards/SuperAdmin/SuperAdminDashboard'));
const TeamDashboard = lazy(() => import('./components/Dashboards/Team/TeamDashboard'));
const JournalistDashboard = lazy(() => import('./components/Dashboards/Journalist/JournalistDashboard'));
const PresidentDashboard = lazy(() => import('./components/Dashboards/President/PresidentDashboard'));
const RefereeDashboard = lazy(() => import('./components/Dashboards/Referee/RefereeDashboard'));
const LinesmanDashboard = lazy(() => import('./components/Dashboards/Linesman/LinesmanDashboard'));
const PlayerDashboard = lazy(() => import('./components/Dashboards/Player/PlayerDashboard'));
const DoctorDashboard = lazy(() => import('./components/Dashboards/Doctor/DoctorDashboard'));
const PresidentSeasonModeApp = lazy(() => import("./President's Season Mode/pages/PresidentSeasonModeApp"));
const LoginPage = lazy(() => import('./components/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const PasswordResetOnboarding = lazy(() => import('./components/Auth/PasswordResetOnboarding').then(m => ({ default: m.PasswordResetOnboarding })));

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
  const [route, setRoute] = useState<string>(() => {
    const h = getHashRoute();
    try {
      sessionStorage.setItem('esn_current_route', h);
    } catch {}
    return h;
  });

  const { role, user } = useAuth();
  const isAuthenticated = Boolean(user && role !== 'guest');

  // Device Identity & Fan Onboarding State
  const { deviceId, isInitializing: isDeviceInitializing, cachedCompleted, saveLocalPreference } = useDeviceIdentity();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowOnboarding(false);
      return;
    }

    if (!isDeviceInitializing && deviceId) {
      if (cachedCompleted) {
        DeviceService.registerOrCheckInDevice(deviceId);
      } else {
        setShowOnboarding(true);
        DeviceService.registerOrCheckInDevice(deviceId).then((profile) => {
          if (profile && profile.has_completed_onboarding) {
            saveLocalPreference(profile.favorite_team_id);
            setShowOnboarding(false);
          }
        });
      }
    }
  }, [deviceId, isDeviceInitializing, cachedCompleted, isAuthenticated, saveLocalPreference]);

  const handleTeamSelected = (teamId: string | null) => {
    saveLocalPreference(teamId);
    setShowOnboarding(false);
    if (deviceId) {
      DeviceService.setFavoriteTeam(deviceId, teamId);
    }
  };

  // Appearance & Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Navigation & Routing States with Session Persistence across accidental refreshes
  const [activeTab, setActiveTab] = useState<MainTabType>(() => {
    try {
      const saved = sessionStorage.getItem('esn_guest_active_tab');
      if (saved === 'scores' || saved === 'news' || saved === 'table' || saved === 'favorites') {
        return saved as MainTabType;
      }
    } catch {}
    return 'scores';
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Favorites list
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSport, setActiveSport] = useState<string>('football');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      const saved = sessionStorage.getItem('esn_selected_date');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) return d;
      }
    } catch {}
    return new Date();
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Competition Switcher State with Session Persistence
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(() => {
    try {
      return sessionStorage.getItem('esn_selected_competition_id') || 'all';
    } catch {
      return 'all';
    }
  });

  // Persist guest navigation state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('esn_guest_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      sessionStorage.setItem('esn_selected_competition_id', selectedCompetitionId);
    } catch {}
  }, [selectedCompetitionId]);

  useEffect(() => {
    try {
      sessionStorage.setItem('esn_selected_date', selectedDate.toISOString());
    } catch {}
  }, [selectedDate]);

  // Scroll position preservation and restoration across accidental reloads
  useEffect(() => {
    const scrollKey = `esn_scroll_${route}_${activeTab}`;
    try {
      const savedScroll = sessionStorage.getItem(scrollKey);
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
          }, 80);
          return () => clearTimeout(timer);
        }
      }
    } catch {}
  }, [route, activeTab]);

  useEffect(() => {
    let scrollTimeout: any = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollKey = `esn_scroll_${route}_${activeTab}`;
        try {
          sessionStorage.setItem(scrollKey, String(window.scrollY));
        } catch {}
      }, 150);
    };

    const handleBeforeUnload = () => {
      const scrollKey = `esn_scroll_${route}_${activeTab}`;
      try {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
      } catch {}
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [route, activeTab]);

  // Sync route on hash change
  useEffect(() => {
    const handleHash = () => {
      const newRoute = getHashRoute();
      setRoute(newRoute);
      try {
        sessionStorage.setItem('esn_current_route', newRoute);
      } catch {}
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
    const cleanRoute = targetHash.replace(/^\//, '').toLowerCase();
    setRoute(cleanRoute);
    try {
      sessionStorage.setItem('esn_current_route', cleanRoute);
    } catch {}
    setSelectedMatch(null);
  };

  const { matches: liveMatches, toasts, dismissToast } = useLiveMatchRealtime();

  // Dynamically computed standings derived strictly from finalized matches in liveMatches
  const currentStandings = useMemo(() => {
    const teamsMap = new Map<string, { id: string; name: string; logo: string }>();
    liveMatches.forEach((m) => {
      if (m.teamA?.id) teamsMap.set(m.teamA.id, { id: m.teamA.id, name: m.teamA.name, logo: m.teamA.logo });
      if (m.teamB?.id) teamsMap.set(m.teamB.id, { id: m.teamB.id, name: m.teamB.name, logo: m.teamB.logo });
    });
    return calculateLeagueStandings(liveMatches, Array.from(teamsMap.values()));
  }, [liveMatches]);

  const getFilteredMatches = () => {
    if (activeSport !== 'football') return [];
    if (selectedCompetitionId === 'all') return liveMatches;
    if (selectedCompetitionId === '11111111-1111-1111-1111-111111111111') {
      return liveMatches.filter((m) => m.league?.toLowerCase().includes('premier') || !m.league?.toLowerCase().includes('championship'));
    }
    if (selectedCompetitionId === '22222222-2222-2222-2222-222222222222') {
      return liveMatches.filter((m) => m.league?.toLowerCase().includes('championship'));
    }
    if (selectedCompetitionId === 'friendlies') {
      return liveMatches.filter((m) => m.league?.toLowerCase().includes('friendly'));
    }
    return liveMatches;
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

  if (route === 'coach' || route === 'dashboard/coach') {
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

  if (route === 'president' || route === 'season-mode' || route === 'president-season' || route === 'season') {
    return (
      <ProtectedRoute allowedRoles={['president', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <PresidentDashboard onLogout={() => handleNavigateHash('/home')} />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'referee' || route === 'dashboard/referee') {
    return (
      <ProtectedRoute allowedRoles={['referee', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <RefereeDashboard onLogout={() => handleNavigateHash('/home')} />
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

  if (route === 'player' || route === 'dashboard/player') {
    return (
      <ProtectedRoute allowedRoles={['player', 'captain', 'coach', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          <PlayerDashboard />
        </Suspense>
      </ProtectedRoute>
    );
  }

  if (route === 'reset-password' || route === 'auth/reset-password' || route === 'password-reset') {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <PasswordResetOnboarding />
      </Suspense>
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
      {!isAuthenticated && !cachedCompleted && showOnboarding && (
        <OnboardingScreen
          onTeamSelected={handleTeamSelected}
          onClose={() => handleTeamSelected(null)}
        />
      )}
      <div className={`relative min-h-screen w-full flex flex-col overflow-x-hidden font-sans antialiased transition-colors duration-150 ${
        darkMode ? 'bg-[#081018] text-white' : 'bg-[#f2f4f7] text-[#0e1726]'
      }`}>
        {/* Sidebar Drawer overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-100 bg-black/70 transition-opacity flex justify-end"
            onClick={() => setSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
          >
            <div
              className="w-72 max-w-[80vw] h-full bg-[#ffffff] dark:bg-[#0e1c2b] text-slate-900 dark:text-white shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 dark:border-[#1a2e45]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1a2e45] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 bg-[#ff0046] transform -skew-x-12 rounded-[1.5px]" />
                    <span className="font-extrabold text-lg tracking-tight uppercase">
                      FLASHSCORE
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation drawer"
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#14263b] text-slate-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Theme Switcher in Sidebar */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Appearance</div>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#14263b] text-xs font-bold cursor-pointer"
                  >
                    <span>Theme</span>
                    <span className="flex items-center gap-1 text-[#ff0046]">
                      {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      {darkMode ? 'Dark' : 'Light'}
                    </span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Campus Competitions</div>
                  <ul className="space-y-1.5">
                    <li onClick={() => { setSidebarOpen(false); setSelectedCompetitionId('11111111-1111-1111-1111-111111111111'); setActiveTab('scores'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#14263b] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      <Activity className="w-4 h-4 text-[#ff0046]" />
                      <span>Egerton Premier League</span>
                    </li>
                    <li onClick={() => { setSidebarOpen(false); setSelectedCompetitionId('22222222-2222-2222-2222-222222222222'); setActiveTab('scores'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#14263b] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Egerton Championships</span>
                    </li>
                    <li onClick={() => { setSidebarOpen(false); setSelectedCompetitionId('friendlies'); setActiveTab('scores'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#14263b] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      <Trophy className="w-4 h-4 text-blue-500" />
                      <span>Friendlies</span>
                    </li>
                  </ul>
                </div>

                {/* Authentication Entry Point */}
                <div className="space-y-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Platform Portal</div>
                  <ul className="space-y-1.5">
                    <li onClick={() => { setSidebarOpen(false); handleNavigateHash('/login'); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#0e1e2d] hover:bg-[#152e47] dark:bg-[#152e47] dark:hover:bg-[#1c3c5c] text-xs font-bold text-white cursor-pointer shadow-sm transition-colors">
                      <LogIn className="w-4 h-4 text-[#ff0046]" />
                      <span>Official Login</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center pt-4 border-t border-slate-100 dark:border-[#1a2e45]">
                Flashscore Edition v2.0
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
              selectedCompetitionId={selectedCompetitionId}
              setSelectedCompetitionId={setSelectedCompetitionId}
              dbFixtures={liveMatches}
              onMenuClick={() => setSidebarOpen(true)}
              onNavigateNews={() => setActiveTab('news')}
              onNavigateLogin={() => handleNavigateHash('/login')}
              activeMainTab={['scores', 'news', 'table', 'favorites'].includes(activeTab) ? (activeTab as any) : 'scores'}
              onSelectMainTab={(tab) => setActiveTab(tab)}
              favoritesCount={favorites.length}
              isCalendarOpen={isCalendarOpen}
              onCloseCalendar={() => setIsCalendarOpen(false)}
            />

            <Navigation
              activeTab={activeTab}
              setActiveTab={(tab) => {
                if ((tab as any) === 'login') {
                  handleNavigateHash('/login');
                } else {
                  setActiveTab(tab);
                }
              }}
              favoritesCount={favorites.length}
              selectedDate={selectedDate}
              setSelectedDate={(newDate) => {
                setSelectedDate(newDate);
                if (activeTab !== 'scores') {
                  setActiveTab('scores');
                }
              }}
              onOpenCalendar={() => setIsCalendarOpen(true)}
            />

            <main className="flex-1 w-full max-w-5xl mx-auto px-0 sm:px-2 md:px-4 pb-12 pt-2">
              {activeTab === 'scores' && (
                <HomePage
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  selectedCompetitionId={selectedCompetitionId}
                  onNavigate={(path) => {
                    if (path.includes('news')) setActiveTab('news');
                    else if (path.includes('league')) setActiveTab('table');
                    else if (path.includes('fixtures')) setActiveTab('scores');
                    else handleNavigateHash(path);
                  }}
                  onSelectMatch={handleMatchClick}
                  onOpenCalendar={() => setIsCalendarOpen(true)}
                />
              )}

              {activeTab === 'table' && <LeagueTable tableData={currentStandings} selectedCompetitionId={selectedCompetitionId} />}

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

