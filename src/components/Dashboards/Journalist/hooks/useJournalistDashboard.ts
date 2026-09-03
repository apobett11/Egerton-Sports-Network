import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../../../services/api';
import {
  TabType,
  ArticleCategory,
  ArticlePost,
  CurrentMatchEvent,
  PerformanceMetrics,
  OptionItem,
  NotificationItem,
  ProfileUser,
} from '../JournalistTypes';
import {
  getAuthenticatedProfile,
  fetchNewsArticlesFromDB,
  uploadImageToStorage,
  createNewsArticleDB,
  updateNewsArticleDB,
  deleteNewsArticleDB,
  calculateAnalyticsFromDB,
} from '../lib/supabaseClient';

const EMPTY_PERFORMANCE: PerformanceMetrics = {
  articlesToday: 0,
  articlesThisWeek: 0,
  articlesThisMonth: 0,
  publishedCount: 0,
  draftsCount: 0,
  flaggedCount: 0,
  impressions: 0,
  engagementRate: 0,
  reads: 0,
  avgReadTime: '0m',
  shares: 0,
  topArticle: 'None',
  topCompetition: 'Egerton Premier League',
  mostCoveredTeam: 'None',
  monthlyStats: [],
  matchdayStats: [],
};

export const useJournalistDashboard = () => {
  // Navigation & Theme State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('esn_journalist_theme');
    return saved ? saved === 'dark' : true;
  });

  // Database Loading & Error States
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Authenticated Profile
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileUser | null>(null);

  // Collections (100% Database Driven)
  const [matches, setMatches] = useState<CurrentMatchEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<CurrentMatchEvent | null>(null);
  const [competitions, setCompetitions] = useState<OptionItem[]>([]);
  const [teams, setTeams] = useState<OptionItem[]>([]);
  const [articles, setArticles] = useState<ArticlePost[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(EMPTY_PERFORMANCE);

  // Modals & Drawers
  const [isMatchSelectorOpen, setIsMatchSelectorOpen] = useState<boolean>(false);
  const [isMatchEventsModalOpen, setIsMatchEventsModalOpen] = useState<boolean>(false);
  const [selectedMatchForEvents, setSelectedMatchForEvents] = useState<CurrentMatchEvent | null>(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [isViewArticleModalOpen, setIsViewArticleModalOpen] = useState<boolean>(false);
  const [viewingArticle, setViewingArticle] = useState<ArticlePost | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Article Composer Form State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [composeType, setComposeType] = useState<ArticleCategory>('breaking_news');
  const [composeHeadline, setComposeHeadline] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [composeImageUrl, setComposeImageUrl] = useState<string>('');
  const [isSavingArticle, setIsSavingArticle] = useState<boolean>(false);

  // Sync Dark Mode Class to html root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('esn_journalist_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('esn_journalist_theme', 'light');
    }
  }, [darkMode]);

  // Keyboard accessibility: Close modals on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMatchSelectorOpen(false);
        setIsMatchEventsModalOpen(false);
        setIsComposeModalOpen(false);
        setIsViewArticleModalOpen(false);
        setIsProfileOpen(false);
        setIsSettingsOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // CENTRALIZED DATABASE FETCH
  const loadDatabaseData = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);

    try {
      // 1. Resolve Authenticated User Profile
      const prof = await getAuthenticatedProfile();
      if (prof) {
        setCurrentUserProfile(prof);
      }

      // 2. Fetch Fixtures from DB
      const fixRes = await ApiService.getFixtures();
      if (fixRes.success && fixRes.data) {
        const dbMatches: CurrentMatchEvent[] = fixRes.data.map((f) => ({
          id: f.id,
          competition: f.league || 'Egerton Premier League',
          competitionId: f.league,
          homeTeam: f.teamA?.name || 'Home Team',
          homeTeamId: f.teamA?.id,
          homeLogo: f.teamA?.logo,
          awayTeam: f.teamB?.name || 'Away Team',
          awayTeamId: f.teamB?.id,
          awayLogo: f.teamB?.logo,
          scoreHome: f.scoreA ?? 0,
          scoreAway: f.scoreB ?? 0,
          status: (f.status as any) || 'UPCOMING',
          minute: f.minute,
          kickoff: f.time || '16:00',
          time: f.time || 'Today',
          venue: f.venue || 'Pavilion Grounds',
          matchday: (f as any).matchday || 1,
        }));
        setMatches(dbMatches);
        if (dbMatches.length > 0 && !currentEvent) {
          setCurrentEvent(dbMatches[0]);
        }
      }

      // 3. Fetch Competitions from DB
      const leaguesRes = await ApiService.getLeagues();
      if (leaguesRes.success && leaguesRes.data) {
        const dbComps: OptionItem[] = leaguesRes.data.map((l: any) => ({
          id: l.id,
          name: l.name,
        }));
        setCompetitions(dbComps);
      }

      // 4. Fetch Teams from DB
      const teamsRes = await ApiService.getTeams();
      if (teamsRes.success && teamsRes.data) {
        const dbTeams: OptionItem[] = teamsRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
        }));
        setTeams(dbTeams);
      }

      // 5. Fetch News Articles from DB
      const dbArticles = await fetchNewsArticlesFromDB(prof?.id);
      setArticles(dbArticles);

      // 6. Calculate Real-Time Performance Analytics from DB
      const analytics = await calculateAnalyticsFromDB(dbArticles);
      setPerformanceMetrics(analytics);
    } catch (err: any) {
      console.error('Error loading Journalist Dashboard production data:', err);
      setLoadError(err.message || 'Failed to connect to database.');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Open dedicated Match Events Modal on strip click
  const openMatchEventsModal = (match: CurrentMatchEvent) => {
    setSelectedMatchForEvents(match);
    setIsMatchEventsModalOpen(true);
  };

  const closeMatchEventsModal = () => {
    setIsMatchEventsModalOpen(false);
    setSelectedMatchForEvents(null);
  };

  // Update current selected event (without page reload)
  const selectCurrentEvent = (match: CurrentMatchEvent) => {
    setCurrentEvent(match);
    setIsMatchSelectorOpen(false);
    triggerToast(`Selected match fixture: ${match.homeTeam} vs ${match.awayTeam}`);
  };

  // Open Compose Modal (fresh or edit)
  const openComposeModal = (articleToEdit?: ArticlePost) => {
    if (articleToEdit) {
      setEditingArticleId(articleToEdit.id);
      setComposeType(articleToEdit.category);
      setComposeHeadline(articleToEdit.headline);
      setComposeBody(articleToEdit.body);
      setComposeImageUrl(articleToEdit.images?.[0] || '');
    } else {
      setEditingArticleId(null);
      setComposeType('breaking_news');
      setComposeHeadline('');
      setComposeBody('');
      setComposeImageUrl('');
    }
    setIsComposeModalOpen(true);
  };

  const closeComposeModal = () => {
    setIsComposeModalOpen(false);
    setEditingArticleId(null);
  };

  // TRANSACTIONAL ARTICLE CREATION / EDITING WITH SUPABASE STORAGE
  const handleSaveArticle = async (isDraftStatus: boolean, imageFile?: File | null) => {
    if (isSavingArticle) return;
    if (!composeHeadline.trim()) {
      triggerToast('Please enter an article headline.');
      return;
    }
    if (!composeBody.trim()) {
      triggerToast('Please enter article body content.');
      return;
    }

    setIsSavingArticle(true);
    let uploadedPublicUrl = composeImageUrl;
    let uploadedPath = '';

    try {
      if (imageFile) {
        triggerToast('Uploading featured image to Supabase Storage...');
        const uploadRes = await uploadImageToStorage(imageFile);
        uploadedPublicUrl = uploadRes.publicUrl;
        uploadedPath = uploadRes.path;
      }

      const articleStatus = isDraftStatus ? 'draft' : 'published';
      const autoExcerpt = composeBody.trim().slice(0, 140);
      const targetFixtureId = currentEvent?.id && !currentEvent.id.startsWith('match-') ? currentEvent.id : null;

      if (editingArticleId) {
        await updateNewsArticleDB(editingArticleId, {
          title: composeHeadline,
          excerpt: autoExcerpt,
          content: composeBody,
          category: composeType,
          status: articleStatus,
          imageUrl: uploadedPublicUrl,
          fixtureId: targetFixtureId,
        });
        triggerToast(isDraftStatus ? 'Draft article updated in database.' : '🚀 Article published live!');
      } else {
        await createNewsArticleDB({
          title: composeHeadline,
          excerpt: autoExcerpt,
          content: composeBody,
          category: composeType,
          status: articleStatus,
          authorId: currentUserProfile?.id || null,
          imageUrl: uploadedPublicUrl,
          imageStoragePath: uploadedPath,
          fixtureId: targetFixtureId,
        });
        triggerToast(
          isDraftStatus
            ? 'Saved working draft to database.'
            : '🚀 Article published live to ESN Newsroom!'
        );
      }

      const updatedArticles = await fetchNewsArticlesFromDB(currentUserProfile?.id);
      setArticles(updatedArticles);
      const updatedAnalytics = await calculateAnalyticsFromDB(updatedArticles);
      setPerformanceMetrics(updatedAnalytics);

      closeComposeModal();
      setActiveTab('articles');
    } catch (err: any) {
      console.error('Transactional article operation failed:', err);
      triggerToast(`Operation Failed: ${err.message || 'Could not complete request.'}`);
    } finally {
      setIsSavingArticle(false);
    }
  };

  // TRANSACTIONAL ARTICLE DELETION
  const handleDeleteArticle = async (id: string) => {
    const targetArticle = articles.find((a) => a.id === id);
    if (!targetArticle) return;

    try {
      await deleteNewsArticleDB(id, targetArticle.imageStoragePath);
      triggerToast('Article deleted from database.');

      const updatedArticles = await fetchNewsArticlesFromDB(currentUserProfile?.id);
      setArticles(updatedArticles);
      const updatedAnalytics = await calculateAnalyticsFromDB(updatedArticles);
      setPerformanceMetrics(updatedAnalytics);
    } catch (err: any) {
      console.error('Delete article failed:', err);
      triggerToast(`Deletion failed: ${err.message}`);
    }
  };

  const handleViewArticle = (article: ArticlePost) => {
    setViewingArticle(article);
    setIsViewArticleModalOpen(true);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return {
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    isLoadingData,
    loadError,
    retryLoad: loadDatabaseData,
    currentUserProfile,
    matches,
    currentEvent,
    selectCurrentEvent,
    isMatchEventsModalOpen,
    selectedMatchForEvents,
    openMatchEventsModal,
    closeMatchEventsModal,
    competitions,
    teams,
    articles,
    notifications,
    performanceMetrics,
    isMatchSelectorOpen,
    setIsMatchSelectorOpen,
    isComposeModalOpen,
    setIsComposeModalOpen,
    openComposeModal,
    closeComposeModal,
    isViewArticleModalOpen,
    setIsViewArticleModalOpen,
    viewingArticle,
    handleViewArticle,
    isProfileOpen,
    setIsProfileOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    toastMessage,
    triggerToast,
    // Composer state
    editingArticleId,
    composeType,
    setComposeType,
    composeHeadline,
    setComposeHeadline,
    composeBody,
    setComposeBody,
    composeImageUrl,
    setComposeImageUrl,
    isSavingArticle,
    handleSaveArticle,
    handleDeleteArticle,
    handleMarkNotificationRead,
  };
};
