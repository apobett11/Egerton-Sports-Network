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
  INITIAL_PERFORMANCE,
  INITIAL_NOTIFICATIONS,
  MOCK_MATCHES,
  MOCK_COMPETITIONS,
  MOCK_TEAMS,
} from '../JournalistMockData';
import {
  getAuthenticatedProfile,
  fetchNewsArticlesFromDB,
  uploadImageToStorage,
  createNewsArticleDB,
  updateNewsArticleDB,
  deleteNewsArticleDB,
  calculateAnalyticsFromDB,
} from '../lib/supabaseClient';

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

  // Current Event State
  const [matches, setMatches] = useState<CurrentMatchEvent[]>(MOCK_MATCHES);
  const [currentEvent, setCurrentEvent] = useState<CurrentMatchEvent>(MOCK_MATCHES[0]);

  // Data Collections (Database Driven)
  const [competitions, setCompetitions] = useState<OptionItem[]>(MOCK_COMPETITIONS);
  const [teams, setTeams] = useState<OptionItem[]>(MOCK_TEAMS);
  const [articles, setArticles] = useState<ArticlePost[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(INITIAL_PERFORMANCE);

  // Modals & Drawers
  const [isMatchSelectorOpen, setIsMatchSelectorOpen] = useState<boolean>(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [isViewArticleModalOpen, setIsViewArticleModalOpen] = useState<boolean>(false);
  const [viewingArticle, setViewingArticle] = useState<ArticlePost | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simplified Article Composer Form State
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

      // 2. Fetch Fixtures
      const fixRes = await ApiService.getFixtures();
      if (fixRes.success && fixRes.data && fixRes.data.length > 0) {
        const dbMatches: CurrentMatchEvent[] = fixRes.data.map((f) => ({
          id: f.id,
          competition: f.league || 'Egerton League',
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
        if (dbMatches.length > 0) {
          setCurrentEvent(dbMatches[0]);
        }
      }

      // 3. Fetch Competitions
      const leaguesRes = await ApiService.getLeagues();
      if (leaguesRes.success && leaguesRes.data && leaguesRes.data.length > 0) {
        const dbComps: OptionItem[] = leaguesRes.data.map((l: any) => ({
          id: l.id,
          name: l.name,
        }));
        setCompetitions(dbComps);
      }

      // 4. Fetch Teams
      const teamsRes = await ApiService.getTeams();
      if (teamsRes.success && teamsRes.data && teamsRes.data.length > 0) {
        const dbTeams: OptionItem[] = teamsRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
        }));
        setTeams(dbTeams);
      }

      // 5. Fetch News Articles / Journals from production Database (own articles prioritized if profile exists)
      const dbArticles = await fetchNewsArticlesFromDB(prof?.id);
      setArticles(dbArticles);

      // 6. Calculate Performance Analytics from production data
      const analytics = await calculateAnalyticsFromDB(dbArticles);
      setPerformanceMetrics(analytics);
    } catch (err: any) {
      console.error('Error loading Journalist Dashboard production data:', err);
      setLoadError(err.message || 'Failed to connect to production database.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Update current selected event (without page reload)
  const selectCurrentEvent = (match: CurrentMatchEvent) => {
    setCurrentEvent(match);
    setIsMatchSelectorOpen(false);
    triggerToast(`Current Event updated to: ${match.homeTeam} vs ${match.awayTeam}`);
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
      // Step 1: Upload image into Supabase Storage 'news' bucket IF image file is selected (OPTIONAL)
      if (imageFile) {
        triggerToast('Uploading featured image to Supabase Storage...');
        const uploadRes = await uploadImageToStorage(imageFile);
        uploadedPublicUrl = uploadRes.publicUrl;
        uploadedPath = uploadRes.path;
      }

      const articleStatus = isDraftStatus ? 'draft' : 'published';
      const autoExcerpt = composeBody.trim().slice(0, 140);

      // Step 2: Insert or Update in Database
      if (editingArticleId) {
        await updateNewsArticleDB(editingArticleId, {
          title: composeHeadline,
          excerpt: autoExcerpt,
          content: composeBody,
          category: composeType,
          status: articleStatus,
          imageUrl: uploadedPublicUrl,
          fixtureId: currentEvent.id.startsWith('match-') ? null : currentEvent.id,
        });
        triggerToast(isDraftStatus ? 'Draft article updated in database.' : '🚀 Article published live!');
      } else {
        // Transactional insert: if insert fails, orphan image is deleted automatically inside createNewsArticleDB
        await createNewsArticleDB({
          title: composeHeadline,
          excerpt: autoExcerpt,
          content: composeBody,
          category: composeType,
          status: articleStatus,
          authorId: currentUserProfile?.id || null,
          imageUrl: uploadedPublicUrl,
          imageStoragePath: uploadedPath,
          fixtureId: currentEvent.id.startsWith('match-') ? null : currentEvent.id,
        });
        triggerToast(
          isDraftStatus
            ? 'Saved working draft to production database.'
            : '🚀 Article published live to ESN Newsroom!'
        );
      }

      // Step 3: Refresh centralized article list and analytics
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
      triggerToast('Article deleted from database and Storage.');

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
