import { useState, useEffect, useCallback } from 'react';
import type { MatchEvent, MatchEventType, MatchStatus } from '../../../../types';
import type { TabType, ProfileTabType, ArticlePost, AnonymousTip, NotificationItem, ArticleCategory } from '../JournalistTypes';
import { ApiService } from '../../../../services/api';
import { broadcastLocalRealtimeEvent } from '../../../../hooks/useLiveMatchRealtime';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import {
  HERO_MATCH_LIVE,
  HERO_MATCH_NEXT,
  JOURNALIST_RATING_DATA,
  TRENDING_TEAMS,
  INITIAL_ARTICLES,
  DRAFT_ARTICLES,
  ANONYMOUS_TIPS,
  NOTIFICATIONS_DATA,
  MOCK_ANALYTICS,
} from '../JournalistMockData';

export const useJournalistDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [profileTab, setProfileTab] = useState<ProfileTabType>('published');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('esn_journalist_theme');
    return saved ? saved === 'dark' : true;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMatchLive, setIsMatchLive] = useState<boolean>(true);

  // Live Match Engine State & Dedicated Event Composer State
  const [liveFixtureId] = useState<string>('a1111111-1111-1111-1111-111111111111');
  const [liveScoreA, setLiveScoreA] = useState<number>(2);
  const [liveScoreB, setLiveScoreB] = useState<number>(1);
  const [liveMatchStatusState, setLiveMatchStatusState] = useState<MatchStatus>('LIVE');
  const [liveMinuteState, setLiveMinuteState] = useState<string>("74'");
  const [liveMatchEventsList, setLiveMatchEventsList] = useState<MatchEvent[]>([
    { id: 'evt-1', minute: 23, type: 'goal', eventTarget: 'home', detailText: 'Egerton FC - Scored by Striker' },
    { id: 'evt-2', minute: 41, type: 'yellow', eventTarget: 'away', detailText: 'Njoro City FC - Midfielder booking' },
    { id: 'evt-3', minute: 68, type: 'goal', eventTarget: 'home', detailText: 'Egerton FC - Header from corner' }
  ]);

  // Match Event Composer Modal State
  const [isEventComposerOpen, setIsEventComposerOpen] = useState<boolean>(false);
  const [composerTarget, setComposerTarget] = useState<'home' | 'away' | 'match'>('home');
  const [composerEventType, setComposerEventType] = useState<MatchEventType>('goal');
  const [composerMinute, setComposerMinute] = useState<number>(75);
  const [composerDetailText, setComposerDetailText] = useState<string>('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState<boolean>(false);

  // Core Data Collections
  const [articles, setArticles] = useState<ArticlePost[]>(INITIAL_ARTICLES);
  const [drafts, setDrafts] = useState<ArticlePost[]>(DRAFT_ARTICLES);
  const [tips, setTips] = useState<AnonymousTip[]>(ANONYMOUS_TIPS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS_DATA);
  const [ratingData] = useState(JOURNALIST_RATING_DATA);

  // UI Drawer & Modal states
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Article Composer Form State with Auto Draft Recovery
  const {
    value: composerDraftState,
    setValue: setComposerDraftState,
    clearDraft,
    resetForm: resetComposerForm,
    hasRecoveredDraft,
  } = useDraftRecovery(
    {
      title: '',
      category: 'match_report' as ArticleCategory,
      excerpt: '',
      content: '',
      imageUrl: '',
      tagsInput: '',
      isBreaking: false,
    },
    { key: 'journalist_article_composer' }
  );

  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isSavingArticle, setIsSavingArticle] = useState<boolean>(false);

  // Protect Unsaved Article Changes
  const isComposerDirty =
    activeTab === 'compose' &&
    (!!composerDraftState.title.trim() || !!composerDraftState.content.trim());
  useUnsavedChanges(isComposerDirty);

  // Synchronize Dark Mode Theme Effect & ESC key listener
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('esn_journalist_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('esn_journalist_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEventComposerOpen(false);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
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

  const handlePublishMatchEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEvent) return;
    if (liveMatchStatusState === 'FT') {
      triggerToast('Match is at FULL TIME. Event entry is locked.');
      return;
    }

    setIsSubmittingEvent(true);

    let newScoreA = liveScoreA;
    let newScoreB = liveScoreB;
    let newStatus: MatchStatus = liveMatchStatusState;

    if (composerEventType === 'goal') {
      if (composerTarget === 'home') newScoreA += 1;
      if (composerTarget === 'away') newScoreB += 1;
    } else if (composerEventType === 'kickoff') {
      newStatus = 'LIVE';
      setLiveMinuteState("1'");
    } else if (composerEventType === 'ht') {
      newStatus = 'HT';
      setLiveMinuteState('HT');
    } else if (composerEventType === 'second_half') {
      newStatus = 'LIVE';
      setLiveMinuteState("46'");
    } else if (composerEventType === 'ft') {
      newStatus = 'FT';
      setLiveMinuteState('FT');
    } else if (composerEventType === 'suspended') {
      newStatus = 'POSTPONED';
    } else if (composerEventType === 'resumed') {
      newStatus = 'LIVE';
    }

    setLiveScoreA(newScoreA);
    setLiveScoreB(newScoreB);
    setLiveMatchStatusState(newStatus);

    const newEvt: MatchEvent = {
      id: `evt_${Date.now()}`,
      fixtureId: liveFixtureId,
      minute: composerMinute,
      type: composerEventType,
      eventTarget: composerTarget,
      teamId: composerTarget === 'home' ? '66666666-6666-6666-6666-666666666666' : composerTarget === 'away' ? '77777777-7777-7777-7777-777777777777' : undefined,
      detailText: composerDetailText.trim() || `${composerTarget.toUpperCase()} - ${composerEventType.replace('_', ' ').toUpperCase()}`,
      createdAt: new Date().toISOString()
    };

    setLiveMatchEventsList((prev) => [...prev, newEvt]);

    try {
      await ApiService.createMatchEvent({
        fixtureId: liveFixtureId,
        type: composerEventType,
        eventTarget: composerTarget,
        minute: composerMinute,
        detailText: newEvt.detailText,
        newScoreHome: newScoreA,
        newScoreAway: newScoreB,
        newStatus,
        isOfficial: false
      });
    } catch (err) {
      console.warn('Failed to publish match event:', err);
    }

    broadcastLocalRealtimeEvent(newEvt, {
      id: liveFixtureId,
      scoreA: newScoreA,
      scoreB: newScoreB,
      status: newStatus
    });

    setIsSubmittingEvent(false);
    setIsEventComposerOpen(false);
    setComposerDetailText('');
    triggerToast(`Live Media Update Broadcasted: ${composerEventType.toUpperCase()} at ${composerMinute}'!`);
  };

  const handleSaveArticle = async (isDraftStatus: boolean) => {
    if (isSavingArticle) return;

    if (!composerDraftState.title.trim()) {
      triggerToast('Please provide an article headline title.');
      return;
    }

    setIsSavingArticle(true);

    if (editingArticleId) {
      if (isDraftStatus) {
        setDrafts((prev) =>
          prev.map((art) =>
            art.id === editingArticleId
              ? {
                  ...art,
                  headline: composerDraftState.title,
                  subtitle: composerDraftState.excerpt,
                  body: composerDraftState.content,
                  category: composerDraftState.category,
                  images: composerDraftState.imageUrl ? [composerDraftState.imageUrl] : art.images,
                  timestamp: 'Just now'
                }
              : art
          )
        );
        triggerToast('Draft article updated successfully.');
      } else {
        const targetDraft = drafts.find((d) => d.id === editingArticleId);
        const publishedArticle: ArticlePost = {
          id: editingArticleId,
          headline: composerDraftState.title,
          subtitle: composerDraftState.excerpt || 'Exclusive story published from live press console.',
          body: composerDraftState.content,
          category: composerDraftState.category,
          timestamp: 'Just now',
          authorName: 'Alex Mercer',
          authorHandle: '@alexmercer',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          roleBadge: 'Senior Sports Journalist',
          images: composerDraftState.imageUrl ? [composerDraftState.imageUrl] : ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'],
          status: 'published',
          interactions: targetDraft?.interactions || {
            likesCount: 0,
            repostsCount: 0,
            commentsCount: 0,
            viewsCount: 1,
            bookmarksCount: 0
          }
        };

        setDrafts((prev) => prev.filter((d) => d.id !== editingArticleId));
        setArticles((prev) => [publishedArticle, ...prev]);
        triggerToast('🚀 Article officially published live to the Campus News Feed!');
      }
    } else {
      const newId = `art_${Date.now()}`;
      const newPost: ArticlePost = {
        id: newId,
        headline: composerDraftState.title,
        subtitle: composerDraftState.excerpt || 'Exclusive story published from live press console.',
        body: composerDraftState.content,
        category: composerDraftState.category,
        timestamp: 'Just now',
        authorName: 'Alex Mercer',
        authorHandle: '@alexmercer',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        roleBadge: 'Senior Sports Journalist',
        images: composerDraftState.imageUrl ? [composerDraftState.imageUrl] : ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'],
        status: isDraftStatus ? 'draft' : 'published',
        interactions: {
          likesCount: 0,
          repostsCount: 0,
          commentsCount: 0,
          viewsCount: 1,
          bookmarksCount: 0
        }
      };

      if (isDraftStatus) {
        setDrafts((prev) => [newPost, ...prev]);
        triggerToast('Saved article as working draft.');
      } else {
        setArticles((prev) => [newPost, ...prev]);
        triggerToast('🚀 Article published live to the Campus News Feed!');
      }
    }

    clearDraft();
    resetComposerForm();
    setEditingArticleId(null);
    setIsSavingArticle(false);
    setActiveTab('home');
  };

  const handleEditDraft = (draft: ArticlePost) => {
    setEditingArticleId(draft.id);
    setComposerDraftState({
      title: draft.headline,
      category: draft.category,
      excerpt: draft.subtitle || '',
      content: draft.body || '',
      imageUrl: draft.images?.[0] || '',
      tagsInput: '',
      isBreaking: false,
    });
    setActiveTab('compose');
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    triggerToast('Draft article deleted.');
  };

  const handleConvertTipToDraft = (tip: AnonymousTip) => {
    const draftId = `draft_tip_${Date.now()}`;
    const newDraft: ArticlePost = {
      id: draftId,
      headline: `INVESTIGATION: ${tip.matchContext || 'Anonymous Tip Scoop'}`,
      subtitle: `Based on anonymous submission from ${tip.sourceCategory}`,
      body: `INVESTIGATIVE REPORT (Converted from Tip ID: ${tip.id})\n\nEvidence Summary:\n${tip.tipText}`,
      category: 'transfer_rumour',
      timestamp: 'Drafting Now',
      authorName: 'Alex Mercer',
      authorHandle: '@alexmercer',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      roleBadge: 'Senior Sports Journalist',
      images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80'],
      status: 'draft',
      interactions: {
        likesCount: 0,
        repostsCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        bookmarksCount: 0
      }
    };

    setDrafts((prev) => [newDraft, ...prev]);
    setTips((prev) => prev.map((t) => (t.id === tip.id ? { ...t, isSaved: true, isRead: true } : t)));
    triggerToast(`Tip #${tip.id} converted into a working draft! Opening composer...`);

    handleEditDraft(newDraft);
  };

  const handleClaimTip = (id: string) => {
    setTips((prev) => prev.map((t) => (t.id === id ? { ...t, isRead: true, isSaved: true } : t)));
    triggerToast('Tip claimed for private journalist investigation.');
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    triggerToast('All notifications marked as read.');
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return {
    activeTab,
    setActiveTab,
    profileTab,
    setProfileTab,
    darkMode,
    setDarkMode,
    searchQuery,
    setSearchQuery,
    isMatchLive,
    setIsMatchLive,
    liveFixtureId,
    liveScoreA,
    liveScoreB,
    liveMatchStatusState,
    liveMinuteState,
    liveMatchEventsList,
    isEventComposerOpen,
    setIsEventComposerOpen,
    composerTarget,
    setComposerTarget,
    composerEventType,
    setComposerEventType,
    composerMinute,
    setComposerMinute,
    composerDetailText,
    setComposerDetailText,
    isSubmittingEvent,
    articles,
    drafts,
    tips,
    notifications,
    ratingData,
    isProfileOpen,
    setIsProfileOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    toastMessage,
    triggerToast,
    composerTitle: composerDraftState.title,
    setComposerTitle: (title: string) => setComposerDraftState((prev) => ({ ...prev, title })),
    composerCategory: composerDraftState.category,
    setComposerCategory: (category: ArticleCategory) => setComposerDraftState((prev) => ({ ...prev, category })),
    composerExcerpt: composerDraftState.excerpt,
    setComposerExcerpt: (excerpt: string) => setComposerDraftState((prev) => ({ ...prev, excerpt })),
    composerContent: composerDraftState.content,
    setComposerContent: (content: string) => setComposerDraftState((prev) => ({ ...prev, content })),
    composerImageUrl: composerDraftState.imageUrl,
    setComposerImageUrl: (imageUrl: string) => setComposerDraftState((prev) => ({ ...prev, imageUrl })),
    composerTagsInput: composerDraftState.tagsInput,
    setComposerTagsInput: (tagsInput: string) => setComposerDraftState((prev) => ({ ...prev, tagsInput })),
    composerIsBreaking: composerDraftState.isBreaking,
    setComposerIsBreaking: (isBreaking: boolean) => setComposerDraftState((prev) => ({ ...prev, isBreaking })),
    editingArticleId,
    hasRecoveredDraft,
    isSavingArticle,
    handlePublishMatchEvent,
    handleSaveArticle,
    handleEditDraft,
    handleDeleteDraft,
    handleConvertTipToDraft,
    handleClaimTip,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    filteredArticles,
    unreadNotificationsCount,
    HERO_MATCH_LIVE,
    HERO_MATCH_NEXT,
    TRENDING_TEAMS,
    MOCK_ANALYTICS,
  };
};
