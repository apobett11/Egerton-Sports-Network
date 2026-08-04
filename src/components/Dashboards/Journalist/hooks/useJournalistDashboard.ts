import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { ApiService } from '../../../../services/api';
import {
  TabType,
  ArticleCategory,
  ArticlePost,
  CurrentMatchEvent,
  PerformanceMetrics,
  OptionItem,
  NotificationItem,
} from '../JournalistTypes';
import {
  MOCK_MATCHES,
  MOCK_COMPETITIONS,
  MOCK_TEAMS,
  INITIAL_ARTICLES,
  INITIAL_PERFORMANCE,
  INITIAL_NOTIFICATIONS,
} from '../JournalistMockData';

export const useJournalistDashboard = () => {
  // Navigation & Theme State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('esn_journalist_theme');
    return saved ? saved === 'dark' : true;
  });

  // Current Event State (The match the journalist is actively covering)
  const [matches, setMatches] = useState<CurrentMatchEvent[]>(MOCK_MATCHES);
  const [currentEvent, setCurrentEvent] = useState<CurrentMatchEvent>(MOCK_MATCHES[0]);

  // Data Collections
  const [competitions, setCompetitions] = useState<OptionItem[]>(MOCK_COMPETITIONS);
  const [teams, setTeams] = useState<OptionItem[]>(MOCK_TEAMS);
  const [articles, setArticles] = useState<ArticlePost[]>(INITIAL_ARTICLES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [performanceMetrics] = useState<PerformanceMetrics>(INITIAL_PERFORMANCE);

  // Modals & Drawers
  const [isMatchSelectorOpen, setIsMatchSelectorOpen] = useState<boolean>(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [isViewArticleModalOpen, setIsViewArticleModalOpen] = useState<boolean>(false);
  const [viewingArticle, setViewingArticle] = useState<ArticlePost | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Article Composer Form State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [composeType, setComposeType] = useState<ArticleCategory>('match_report');
  const [composeHeadline, setComposeHeadline] = useState<string>('');
  const [composeSubtitle, setComposeSubtitle] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [composeMatchId, setComposeMatchId] = useState<string>(currentEvent.id);
  const [composeTeamId, setComposeTeamId] = useState<string>(currentEvent.homeTeamId || '');
  const [composeCompetitionId, setComposeCompetitionId] = useState<string>(currentEvent.competitionId || '');
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

  // Fetch real database records from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchDatabaseData = async () => {
      try {
        // Fetch Fixtures
        const fixRes = await ApiService.getFixtures();
        if (isMounted && fixRes.success && fixRes.data && fixRes.data.length > 0) {
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
          }));
          setMatches(dbMatches);
          if (dbMatches.length > 0) {
            setCurrentEvent(dbMatches[0]);
          }
        }

        // Fetch Leagues/Competitions
        const leaguesRes = await ApiService.getLeagues();
        if (isMounted && leaguesRes.success && leaguesRes.data && leaguesRes.data.length > 0) {
          const dbComps: OptionItem[] = leaguesRes.data.map((l: any) => ({
            id: l.id,
            name: l.name,
          }));
          setCompetitions(dbComps);
        }

        // Fetch Teams
        const teamsRes = await ApiService.getTeams();
        if (isMounted && teamsRes.success && teamsRes.data && teamsRes.data.length > 0) {
          const dbTeams: OptionItem[] = teamsRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
          }));
          setTeams(dbTeams);
        }

        // Fetch News / Articles from Supabase
        const { data: dbArticles, error: artErr } = await supabase
          .from('news_articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (isMounted && !artErr && dbArticles && dbArticles.length > 0) {
          const mappedArticles: ArticlePost[] = dbArticles.map((item: any) => ({
            id: item.id,
            headline: item.title,
            subtitle: item.excerpt || '',
            body: item.content || '',
            category: (item.category as ArticleCategory) || 'match_report',
            timestamp: item.published_at
              ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Draft',
            publishedAt: item.published_at || item.created_at,
            isToday: true,
            authorName: 'Alex Mercer',
            authorHandle: '@alexmercer',
            authorAvatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            isVerified: true,
            roleBadge: 'Lead Sports Correspondent',
            images: item.image_url ? [item.image_url] : [],
            status: item.status === 'draft' ? 'draft' : item.status === 'disputed' ? 'disputed' : 'published',
            viewsCount: item.views_count || 120,
            matchId: item.fixture_id,
            teamId: item.team_id,
            competitionId: item.competition_id,
            interactions: {
              likesCount: 15,
              repostsCount: 4,
              commentsCount: 2,
              viewsCount: item.views_count || 120,
              bookmarksCount: 3,
            },
          }));

          setArticles((prev) => {
            const existingIds = new Set(mappedArticles.map((a) => a.id));
            const uniqueMock = prev.filter((a) => !existingIds.has(a.id));
            return [...mappedArticles, ...uniqueMock];
          });
        }
      } catch (err) {
        console.warn('Failed to load database records for Journalist dashboard:', err);
      }
    };

    fetchDatabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Update current selected event (without page reload)
  const selectCurrentEvent = (match: CurrentMatchEvent) => {
    setCurrentEvent(match);
    setComposeMatchId(match.id);
    if (match.competitionId) setComposeCompetitionId(match.competitionId);
    if (match.homeTeamId) setComposeTeamId(match.homeTeamId);
    setIsMatchSelectorOpen(false);
    triggerToast(`Current Event updated to: ${match.homeTeam} vs ${match.awayTeam}`);
  };

  // Open Compose Modal (either fresh or editing)
  const openComposeModal = (articleToEdit?: ArticlePost) => {
    if (articleToEdit) {
      setEditingArticleId(articleToEdit.id);
      setComposeType(articleToEdit.category);
      setComposeHeadline(articleToEdit.headline);
      setComposeSubtitle(articleToEdit.subtitle || '');
      setComposeBody(articleToEdit.body);
      setComposeMatchId(articleToEdit.matchId || currentEvent.id);
      setComposeTeamId(articleToEdit.teamId || currentEvent.homeTeamId || '');
      setComposeCompetitionId(articleToEdit.competitionId || currentEvent.competitionId || '');
      setComposeImageUrl(articleToEdit.images?.[0] || '');
    } else {
      setEditingArticleId(null);
      setComposeType('match_report');
      setComposeHeadline('');
      setComposeSubtitle('');
      setComposeBody('');
      setComposeMatchId(currentEvent.id);
      setComposeTeamId(currentEvent.homeTeamId || '');
      setComposeCompetitionId(currentEvent.competitionId || '');
      setComposeImageUrl('');
    }
    setIsComposeModalOpen(true);
  };

  const closeComposeModal = () => {
    setIsComposeModalOpen(false);
    setEditingArticleId(null);
  };

  // Save Article (Draft or Published)
  const handleSaveArticle = async (isDraftStatus: boolean) => {
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

    const selectedMatch = matches.find((m) => m.id === composeMatchId) || currentEvent;
    const selectedComp = competitions.find((c) => c.id === composeCompetitionId);
    const selectedTeam = teams.find((t) => t.id === composeTeamId);

    const articleStatus = isDraftStatus ? 'draft' : 'published';
    const timestampText = isDraftStatus ? 'Draft' : 'Just now';
    const slug = `${composeHeadline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;

    // Attempt Supabase insert/update
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (editingArticleId && !editingArticleId.startsWith('art-')) {
        await supabase
          .from('news_articles')
          .update({
            title: composeHeadline.trim(),
            content: composeBody.trim(),
            excerpt: composeSubtitle.trim() || composeBody.slice(0, 120).trim(),
            status: articleStatus,
            category: composeType,
            image_url: composeImageUrl.trim() || null,
            fixture_id: composeMatchId || null,
            team_id: composeTeamId || null,
            competition_id: composeCompetitionId || null,
            published_at: isDraftStatus ? null : new Date().toISOString(),
          })
          .eq('id', editingArticleId);
      } else {
        await supabase.from('news_articles').insert({
          title: composeHeadline.trim(),
          slug,
          content: composeBody.trim(),
          excerpt: composeSubtitle.trim() || composeBody.slice(0, 120).trim(),
          status: articleStatus,
          category: composeType,
          author_id: userId || null,
          image_url: composeImageUrl.trim() || null,
          fixture_id: composeMatchId || null,
          team_id: composeTeamId || null,
          competition_id: composeCompetitionId || null,
          published_at: isDraftStatus ? null : new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Supabase database sync note:', err);
    }

    if (editingArticleId) {
      setArticles((prev) =>
        prev.map((art) =>
          art.id === editingArticleId
            ? {
                ...art,
                headline: composeHeadline.trim(),
                subtitle: composeSubtitle.trim(),
                body: composeBody.trim(),
                category: composeType,
                images: composeImageUrl.trim() ? [composeImageUrl.trim()] : art.images,
                status: articleStatus,
                matchId: composeMatchId,
                matchTitle: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
                teamId: composeTeamId,
                teamName: selectedTeam?.name || selectedMatch.homeTeam,
                competitionId: composeCompetitionId,
                competitionName: selectedComp?.name || selectedMatch.competition,
                timestamp: timestampText,
              }
            : art
        )
      );
      triggerToast(isDraftStatus ? 'Draft updated successfully.' : 'Article updated and published live!');
    } else {
      const newArticle: ArticlePost = {
        id: `art_${Date.now()}`,
        headline: composeHeadline.trim(),
        subtitle: composeSubtitle.trim(),
        body: composeBody.trim(),
        category: composeType,
        timestamp: timestampText,
        publishedAt: new Date().toISOString(),
        isToday: true,
        authorName: 'Alex Mercer',
        authorHandle: '@alexmercer',
        authorAvatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        roleBadge: 'Lead Sports Correspondent',
        images: composeImageUrl.trim()
          ? [composeImageUrl.trim()]
          : ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'],
        status: articleStatus,
        viewsCount: isDraftStatus ? 0 : 1,
        matchId: composeMatchId,
        matchTitle: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
        teamId: composeTeamId,
        teamName: selectedTeam?.name || selectedMatch.homeTeam,
        competitionId: composeCompetitionId,
        competitionName: selectedComp?.name || selectedMatch.competition,
        interactions: {
          likesCount: 0,
          repostsCount: 0,
          commentsCount: 0,
          viewsCount: isDraftStatus ? 0 : 1,
          bookmarksCount: 0,
        },
      };

      setArticles((prev) => [newArticle, ...prev]);
      triggerToast(
        isDraftStatus
          ? 'Saved article as working draft.'
          : '🚀 Article published live to the ESN Newsroom!'
      );
    }

    setIsSavingArticle(false);
    closeComposeModal();
    setActiveTab('articles');
  };

  // Delete Draft Article
  const handleDeleteArticle = async (id: string) => {
    try {
      await supabase.from('news_articles').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error note:', err);
    }
    setArticles((prev) => prev.filter((a) => a.id !== id));
    triggerToast('Draft article deleted.');
  };

  // Open View Modal
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
    composeSubtitle,
    setComposeSubtitle,
    composeBody,
    setComposeBody,
    composeMatchId,
    setComposeMatchId,
    composeTeamId,
    setComposeTeamId,
    composeCompetitionId,
    setComposeCompetitionId,
    composeImageUrl,
    setComposeImageUrl,
    isSavingArticle,
    handleSaveArticle,
    handleDeleteArticle,
    handleMarkNotificationRead,
  };
};
