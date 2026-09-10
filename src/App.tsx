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
import { TeamDetailsContainer } from './components/TeamDetails/TeamDetailsContainer';
import { type AllowedRole } from './components/Auth/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { guestCache } from './lib/guestCache';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import type { Match, Team } from './types';
import { calculateLeagueStandings } from './lib/leagueEngine';
import { resolveGuestMatchdayDate } from './lib/matchdayHelper';
import { useLiveMatchRealtime } from './hooks/useLiveMatchRealtime';
import { ToastContainer } from './components/common/ToastContainer';
import { useDeviceIdentity } from './hooks/useDeviceIdentity';
import { DeviceService } from './services/DeviceService';
import type { DeviceAnnouncementItem } from './services/DeviceService';
import { PublicAnnouncementPopup } from './components/PublicAnnouncementPopup';
import { DeviceNotificationsModal } from './components/DeviceNotificationsModal';
import { OnboardingScreen } from './components/OnboardingScreen';
import { supabase } from './lib/supabase';
import { ApiService } from './services/api';
import { X, Activity, Trophy, Award, LogIn, Loader2, Moon, Sun, Bell, Star } from 'lucide-react';

const SuperAdminDashboard = lazy(() => import('./components/Dashboards/SuperAdmin/SuperAdminDashboard'));
const TeamDashboard = lazy(() => import('./components/Dashboards/Team/TeamDashboard'));
const JournalistDashboard = lazy(() => import('./components/Dashboards/Journalist/JournalistDashboard'));
const PresidentDashboard = lazy(() => import('./components/Dashboards/President/PresidentDashboard'));
const RefereeDashboard = lazy(() => import('./components/Dashboards/Referee/RefereeDashboard'));
const DoctorDashboard = lazy(() => import('./components/Dashboards/Doctor/DoctorDashboard'));
const PresidentSeasonModeApp = lazy(() => import("./President's Season Mode/pages/PresidentSeasonModeApp"));
const LoginPage = lazy(() => import('./components/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const PasswordResetOnboarding = lazy(() => import('./components/Auth/PasswordResetOnboarding').then(m => ({ default: m.PasswordResetOnboarding })));
const PlayerRegistrationPage = lazy(() => import('./pages/public/PlayerRegistrationPage'));

const DashboardLoader: React.FC = () => (
  <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center gap-4 text-emerald-500">
    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    <span className="text-sm font-semibold tracking-wide text-gray-400">Loading Dashboard Module...</span>
  </div>
);

const getHashRoute = (): string => {
  return window.location.hash.replace(/^#\/?/, '').toLowerCase() || 'home';
};

/** Convert any name to a URL-safe slug: lowercase, spaces/special chars → hyphens */
const nameToSlug = (name: string): string =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Resolve a team slug → UUID by fetching the team from Supabase by name */
const resolveTeamSlug = async (slug: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .is('deleted_at', null);
    if (!data) return null;
    const match = data.find((t: any) => nameToSlug(t.name) === slug);
    return match?.id ?? null;
  } catch {
    return null;
  }
};

/** Build a safe match slug from home/away team names and matchday */
const buildMatchSlug = (homeTeam: string, awayTeam: string, matchday?: number): string => {
  const h = nameToSlug(homeTeam);
  const a = nameToSlug(awayTeam);
  return matchday ? `${h}-vs-${a}-md${matchday}` : `${h}-vs-${a}`;
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

  // Season Mode Switch State: Determined strictly from database fixtures table on each reload/mount
  const [isSeasonMode, setIsSeasonMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('esn_season_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isCheckingSeasonMode, setIsCheckingSeasonMode] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkSeasonModeFromDB = async () => {
      try {
        const { data, count, error } = await supabase
          .from('fixtures')
          .select('id', { count: 'exact' })
          .is('deleted_at', null)
          .limit(1);

        if (!error && isMounted) {
          const hasFixtures = Boolean((count !== null && count !== undefined && count > 0) || (data && data.length > 0));
          setIsSeasonMode(hasFixtures);
          try {
            sessionStorage.setItem('esn_season_mode', hasFixtures ? 'true' : 'false');
          } catch {}
        }
      } catch (err) {
        console.warn('Season mode DB check on load/reload:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSeasonMode(false);
        }
      }
    };

    checkSeasonModeFromDB();

    // Listen to real-time additions or removals in the fixtures table
    const channel = supabase
      .channel('app_fixtures_season_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fixtures' }, () => {
        if (isMounted) {
          setIsSeasonMode(true);
          try {
            sessionStorage.setItem('esn_season_mode', 'true');
          } catch {}
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'fixtures' }, async () => {
        const { count } = await supabase.from('fixtures').select('id', { count: 'exact', head: true });
        if (isMounted) {
          const active = Boolean(count && count > 0);
          setIsSeasonMode(active);
          try {
            sessionStorage.setItem('esn_season_mode', active ? 'true' : 'false');
          } catch {}
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  const { showSuccess } = useToast();

  // Device Identity & Fan Onboarding State
  const { 
    deviceId, 
    isInitializing: isDeviceInitializing, 
    cachedCompleted, 
    deviceFavorites: favorites, 
    setDeviceFavorites: setFavorites, 
    toggleDeviceFavorite, 
    saveLocalPreference 
  } = useDeviceIdentity();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowOnboarding(false);
      return;
    }

    if (!isDeviceInitializing && deviceId) {
      // 1. Always register/check-in device details alongside the fanpage
      DeviceService.registerOrCheckInDevice(deviceId).then((profile) => {
        if (profile && profile.has_completed_onboarding) {
          saveLocalPreference(profile.favorite_team_id);
          setShowOnboarding(false);
        }
      });

      if (cachedCompleted) {
        return;
      }

      // 2. Track count of times the device has opened/used the app
      let usageCount = 1;
      try {
        const storedCount = parseInt(localStorage.getItem('esn_device_usage_count') || '0', 10);
        const sessionCounted = sessionStorage.getItem('esn_app_session_counted');
        if (!sessionCounted) {
          usageCount = storedCount + 1;
          localStorage.setItem('esn_device_usage_count', String(usageCount));
          sessionStorage.setItem('esn_app_session_counted', 'true');
        } else {
          usageCount = storedCount || 1;
        }
      } catch {
        usageCount = 1;
      }

      // 3. Prevent popup on 1st and 2nd use (protects coaches, captains, referees during registration).
      // Trigger target is randomly chosen between the 3rd or 4th time the app is opened.
      let targetOpen = 3;
      try {
        const storedTarget = parseInt(localStorage.getItem('esn_onboarding_target_open') || '0', 10);
        if (storedTarget === 3 || storedTarget === 4) {
          targetOpen = storedTarget;
        } else {
          targetOpen = Math.random() < 0.5 ? 3 : 4;
          localStorage.setItem('esn_onboarding_target_open', String(targetOpen));
        }
      } catch {
        targetOpen = 3;
      }

      // If device usage count reaches the random threshold (3rd or 4th open),
      // bring up the fan popup at a random time interval while on the fanpage
      if (usageCount >= targetOpen) {
        const randomDelayMs = Math.floor(Math.random() * 2000) + 1500; // random time between 1.5s and 3.5s
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, randomDelayMs);

        return () => clearTimeout(timer);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [deviceId, isDeviceInitializing, cachedCompleted, isAuthenticated, saveLocalPreference]);

  const handleTeamSelected = (teamId: string | null) => {
    saveLocalPreference(teamId);
    setShowOnboarding(false);
    if (deviceId) {
      DeviceService.completeOnboarding(deviceId, teamId);
    }
  };

  // Device-specific Announcements & Notifications State
  const [deviceAnnouncements, setDeviceAnnouncements] = useState<DeviceAnnouncementItem[]>([]);
  const [activePopupAnnouncement, setActivePopupAnnouncement] = useState<DeviceAnnouncementItem | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    let isMounted = true;

    const fetchAnnouncements = async () => {
      try {
        const list = await DeviceService.getDeviceAnnouncements(deviceId);
        if (isMounted) {
          setDeviceAnnouncements(list);
          // Check for unread announcements to show as popup
          const unread = list.find((a) => a.status === 'unread');
          if (unread && !activePopupAnnouncement) {
            setActivePopupAnnouncement(unread);
          }
        }
      } catch (e) {
        console.error('Failed to load device announcements:', e);
      }
    };

    fetchAnnouncements();

    // Event-driven real-time updates using shared channel topic
    const channel = supabase
      .channel('public_announcements_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        if (isMounted) fetchAnnouncements();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const handleMarkAnnouncementRead = async (announcementId: string) => {
    if (!deviceId) return;
    const updated = await DeviceService.markAnnouncementAsRead(deviceId, announcementId);
    setDeviceAnnouncements(updated);
    if (activePopupAnnouncement?.id === announcementId) {
      setActivePopupAnnouncement(null);
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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);


  const [activeSport, setActiveSport] = useState<string>('football');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      const saved = sessionStorage.getItem('esn_selected_date');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
          const dayOfWeek = d.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) return d;
        }
      }
    } catch {}
    return resolveGuestMatchdayDate();
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
    // On initial load, resolve current hash immediately
    const initialRoute = getHashRoute();
    if (initialRoute.startsWith('team/')) {
      const slug = initialRoute.replace(/^team\/?/, '').split('/')[0];
      resolveTeamSlug(slug).then((id) => {
        if (id) setSelectedTeamId(id);
      });
    }

    const handleHash = () => {
      const newRoute = getHashRoute();
      setRoute(newRoute);
      try {
        sessionStorage.setItem('esn_current_route', newRoute);
      } catch {}
      if (newRoute === 'favorites' || newRoute === 'favourites') {
        setActiveTab('favorites');
      }
      if (!newRoute.startsWith('match/')) {
        setSelectedMatch(null);
      }
      if (newRoute.startsWith('team/')) {
        const slug = newRoute.replace(/^team\/?/, '').split('/')[0];
        resolveTeamSlug(slug).then((id) => {
          if (id) setSelectedTeamId(id);
        });
      } else {
        setSelectedTeamId(null);
      }
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

  const toggleFavorite = async (matchId: string) => {
    const isAdding = await toggleDeviceFavorite(matchId);
    if (isAdding) {
      showSuccess('Added to favourites');
    }
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    // Build a human-readable slug; keep match.id only in memory — never in the URL
    const homeTeam = (match as any).homeTeamName || (match as any).home_team || 'home';
    const awayTeam = (match as any).awayTeamName || (match as any).away_team || 'away';
    const slug = buildMatchSlug(homeTeam, awayTeam, match.matchday);
    const targetRoute = `match/${slug}`;
    setRoute(targetRoute);
    window.location.hash = `/match/${slug}`;
    try {
      sessionStorage.setItem('esn_current_route', targetRoute);
    } catch {}
  };

  const handleBackToHome = () => {
    setSelectedMatch(null);
    setRoute('home');
    // Clear hash completely so the URL is just the bare domain
    history.pushState(null, '', window.location.pathname + window.location.search);
    try {
      sessionStorage.setItem('esn_current_route', 'home');
    } catch {}
  };

  const handleTeamClick = (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    const slug = nameToSlug(teamName);
    const targetRoute = `team/${slug}`;
    setRoute(targetRoute);
    window.location.hash = `/team/${slug}`;
    try {
      sessionStorage.setItem('esn_current_route', targetRoute);
    } catch {}
  };

  const handleBackFromTeam = () => {
    setSelectedTeamId(null);
    setRoute('home');
    // Clear hash completely so the URL is just the bare domain
    history.pushState(null, '', window.location.pathname + window.location.search);
    try {
      sessionStorage.setItem('esn_current_route', 'home');
    } catch {}
  };


  const handleNavigateHash = (targetHash: string) => {
    window.location.hash = targetHash;
    const cleanRoute = targetHash.replace(/^\//, '').toLowerCase();
    setRoute(cleanRoute);
    try {
      sessionStorage.setItem('esn_current_route', cleanRoute);
    } catch {}
    if (!cleanRoute.startsWith('match/')) {
      setSelectedMatch(null);
    }
    if (!cleanRoute.startsWith('team/')) {
      setSelectedTeamId(null);
    }
  };

  const { matches: liveMatches, toasts, dismissToast } = useLiveMatchRealtime();

  // Auto-sync guest fixtures to next matchday if on a weekday, or today if on a playday
  useEffect(() => {
    if (liveMatches && liveMatches.length > 0) {
      const curYear = selectedDate.getFullYear();
      const curMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const curDay = String(selectedDate.getDate()).padStart(2, '0');
      const curKey = `${curYear}-${curMonth}-${curDay}`;
      const dayOfWeek = selectedDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const hasFixturesOnDate = liveMatches.some(f => {
        const raw = f.scheduledTime || (f as any).scheduled_time;
        if (!raw) return false;
        const d = new Date(raw);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return key === curKey;
      });

      if (!isWeekend && !hasFixturesOnDate) {
        const targetDate = resolveGuestMatchdayDate(liveMatches);
        setSelectedDate(targetDate);
      }
    }
  }, [liveMatches]);

  // Auto-reset completed matchday favorites when a matchday finishes, keeping future matchdays intact
  useEffect(() => {
    if (!deviceId || favorites.length === 0 || !liveMatches || liveMatches.length === 0) return;

    DeviceService.pruneCompletedMatchdayFavorites(deviceId, liveMatches).then((pruned) => {
      if (pruned && pruned.length !== favorites.length) {
        setFavorites(pruned);
      }
    });
  }, [deviceId, liveMatches, favorites.length, setFavorites]);

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

  // Favorited matches resolution with guestCache fallback
  const favoriteMatches = useMemo(() => {
    const map = new Map<string, Match>();
    (liveMatches || []).forEach((m) => map.set(m.id, m));

    const allCached = guestCache.get<Match[]>('fixtures', 'all_all_pall_sall') || [];
    allCached.forEach((m) => {
      if (!map.has(m.id)) map.set(m.id, m);
    });

    return favorites.map((id) => map.get(id)).filter((m): m is Match => Boolean(m));
  }, [liveMatches, favorites]);

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
      <Suspense fallback={<DashboardLoader />}>
        <TeamDashboard />
      </Suspense>
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

  if (route === 'president' || route === 'season-mode' || route === 'president-season' || route === 'season' || route === 'oversight') {
    return (
      <ProtectedRoute allowedRoles={['president', 'admin']} onUnauthorized={() => handleNavigateHash('/login')}>
        <Suspense fallback={<DashboardLoader />}>
          {isCheckingSeasonMode ? (
            <DashboardLoader />
          ) : isSeasonMode ? (
            <PresidentSeasonModeApp onLogout={() => handleNavigateHash('/home')} />
          ) : (
            <PresidentDashboard
              onLogout={() => handleNavigateHash('/home')}
              onSeasonModeOn={() => {
                setIsSeasonMode(true);
                try {
                  sessionStorage.setItem('esn_season_mode', 'true');
                } catch {}
              }}
            />
          )}
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

  // Decommissioned & Retired Roles: Safely redirect to public home
  if (route === 'captain' || route === 'player' || route === 'dashboard/player' || route === 'linesman' || route === 'assistant_referee') {
    handleNavigateHash('/home');
    return null;
  }

  if (route === 'reset-password' || route === 'auth/reset-password' || route === 'password-reset') {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <PasswordResetOnboarding />
      </Suspense>
    );
  }

  if (route === 'register' || route.startsWith('register') || route.startsWith('player-registration')) {
    return (
      <Suspense fallback={<DashboardLoader />}>
        <PlayerRegistrationPage onNavigate={handleNavigateHash} />
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
    <>
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

                {/* Notifications & Announcements in Sidebar */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Announcements</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      setIsNotificationsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#14263b] text-xs font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#ff0046]" />
                      <span>Notices & Bulletins</span>
                    </span>
                    {deviceAnnouncements.filter((a) => a.status === 'unread').length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#ff0046] text-white">
                        {deviceAnnouncements.filter((a) => a.status === 'unread').length}
                      </span>
                    )}
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
        {selectedTeamId || route.startsWith('team/') ? (
          <TeamDetailsContainer
            teamId={selectedTeamId || route.replace(/^team\/?/, '').split('/')[0]}
            onBack={handleBackFromTeam}
            onSelectMatch={handleMatchClick}
          />
        ) : selectedMatch || route.startsWith('match/') ? (
          selectedMatch ? (
            <MatchDetailsContainer
              match={selectedMatch}
              onBack={handleBackToHome}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#ff0046]" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading match data...</span>
            </div>
          )
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
              unreadAnnouncementsCount={deviceAnnouncements.filter((a) => a.status === 'unread').length}
              onOpenNotifications={() => setIsNotificationsModalOpen(true)}
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
                  dbFixtures={liveMatches}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              )}

              {activeTab === 'table' && (
                <LeagueTable
                  tableData={currentStandings}
                  selectedCompetitionId={selectedCompetitionId}
                  onSelectTeam={handleTeamClick}
                />
              )}

              {activeTab === 'news' && <PublicNewsPage />}

              {activeTab === 'favorites' && (
                favoriteMatches.length > 0 ? (
                  <FixturesList
                    matches={favoriteMatches}
                    onMatchClick={handleMatchClick}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ) : (
                  <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-12 text-center select-none shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#14263b] text-amber-500 flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      No Favourite Matches Saved
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Click the star icon next to any match to track your favourite games on this device.
                    </p>
                  </div>
                )
              )}
            </main>

            <Footer />
          </>
        )}

        {/* Public Announcement Popup for Anonymous Devices */}
        {activePopupAnnouncement && (
          <PublicAnnouncementPopup
            announcement={activePopupAnnouncement}
            onMarkRead={handleMarkAnnouncementRead}
            onDismiss={() => handleMarkAnnouncementRead(activePopupAnnouncement.id)}
            isDark={darkMode}
          />
        )}

        {/* Device Notifications Modal */}
        <DeviceNotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          announcements={deviceAnnouncements}
          onMarkRead={handleMarkAnnouncementRead}
          isDark={darkMode}
        />
      </div>
    </>
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

