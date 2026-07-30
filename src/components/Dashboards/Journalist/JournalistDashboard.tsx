import React from 'react';
import {
  Home,
  Bell,
  BarChart3,
  User,
  Settings,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useJournalistDashboard } from './hooks/useJournalistDashboard';
import { JournalistHeader } from './components/Header/JournalistHeader';
import { JournalistHomeView } from './components/Home/JournalistHomeView';
import { ArticleComposerView } from './components/Composer/ArticleComposerView';
import { TipsInboxView } from './components/Tips/TipsInboxView';
import { JournalistAnalyticsView } from './components/Analytics/JournalistAnalyticsView';

export const JournalistDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const {
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    searchQuery,
    setSearchQuery,
    isMatchLive,
    setIsMatchLive,
    liveScoreA,
    liveScoreB,
    liveMatchStatusState,
    liveMinuteState,
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
    drafts: _drafts,
    tips,
    notifications: _notifications,
    ratingData,
    toastMessage,
    triggerToast,
    composerTitle,
    setComposerTitle,
    composerCategory,
    setComposerCategory,
    composerExcerpt,
    setComposerExcerpt,
    composerContent,
    setComposerContent,
    composerImageUrl,
    setComposerImageUrl,
    composerTagsInput,
    setComposerTagsInput,
    composerIsBreaking,
    setComposerIsBreaking,
    editingArticleId,
    hasRecoveredDraft,
    isSavingArticle,
    handlePublishMatchEvent,
    handleSaveArticle,
    handleEditDraft: _handleEditDraft,
    handleDeleteDraft: _handleDeleteDraft,
    handleConvertTipToDraft,
    handleClaimTip,
    handleMarkNotificationRead: _handleMarkNotificationRead,
    handleMarkAllNotificationsRead: _handleMarkAllNotificationsRead,
    filteredArticles: _filteredArticles,
    unreadNotificationsCount,
    HERO_MATCH_LIVE,
    HERO_MATCH_NEXT,
    TRENDING_TEAMS,
    MOCK_ANALYTICS,
  } = useJournalistDashboard();

  const bgClass = darkMode ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#F6F8FA] text-slate-800';
  const cardBg = darkMode ? 'bg-[#141A24] border-slate-800' : 'bg-white border-[#D9E2EC] shadow-sm';
  const hoverBg = darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50';

  const todayArticles = articles.filter((a) => a.isToday || a.timestamp === 'Just now');
  const todayFlaggedArticles = articles.filter((a) => a.status === 'disputed');
  const olderArticles = articles.filter((a) => !a.isToday && a.timestamp !== 'Just now');

  const getFilteredArticles = (postList: typeof articles) => {
    if (!searchQuery.trim()) return postList;
    const q = searchQuery.toLowerCase();
    return postList.filter(
      (a) => a.headline.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} font-sans transition-colors duration-200 pb-16`}>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 bg-[#148A54] text-white rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-400/30">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* STICKY HEADER */}
      <JournalistHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotificationsCount={unreadNotificationsCount}
        onLogout={onLogout}
      />

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR (DESKTOP) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-22 space-y-4">
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-2`}>
            <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#148A54]">
              Navigation Menu
            </div>

            <nav className="space-y-1 font-bold text-xs">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-[#148A54] text-white shadow-xs'
                    : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('compose')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'compose'
                    ? 'bg-[#148A54] text-white shadow-xs'
                    : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Compose Article</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-[#148A54] text-white shadow-xs'
                    : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Anonymous Tips Inbox</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#148A54] text-white shadow-xs'
                    : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Journalist Performance</span>
              </button>

              <button
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Press Profile & Portfolio</span>
              </button>

              <button
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Journalist Settings</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* MAIN FEED CONTENT */}
        <main className="lg:col-span-9 space-y-6">
          {activeTab === 'home' && (
            <JournalistHomeView
              cardBg={cardBg}
              hoverBg={hoverBg}
              isMatchLive={isMatchLive}
              setIsMatchLive={setIsMatchLive}
              liveMatchStatusState={liveMatchStatusState}
              liveMinuteState={liveMinuteState}
              liveScoreA={liveScoreA}
              liveScoreB={liveScoreB}
              setIsEventComposerOpen={setIsEventComposerOpen}
              HERO_MATCH_LIVE={HERO_MATCH_LIVE}
              HERO_MATCH_NEXT={HERO_MATCH_NEXT}
              TRENDING_TEAMS={TRENDING_TEAMS}
              todayArticles={todayArticles}
              todayFlaggedArticles={todayFlaggedArticles}
              olderArticles={olderArticles}
              getFilteredArticles={getFilteredArticles}
              triggerToast={triggerToast}
              setComposeHeadline={setComposerTitle}
              setComposeBody={setComposerContent}
              setIsComposeOpen={() => setActiveTab('compose')}
            />
          )}

          {activeTab === 'compose' && (
            <ArticleComposerView
              cardBg={cardBg}
              composerTitle={composerTitle}
              setComposerTitle={setComposerTitle}
              composerCategory={composerCategory}
              setComposerCategory={setComposerCategory}
              composerExcerpt={composerExcerpt}
              setComposerExcerpt={setComposerExcerpt}
              composerContent={composerContent}
              setComposerContent={setComposerContent}
              composerImageUrl={composerImageUrl}
              setComposerImageUrl={setComposerImageUrl}
              composerTagsInput={composerTagsInput}
              setComposerTagsInput={setComposerTagsInput}
              composerIsBreaking={composerIsBreaking}
              setComposerIsBreaking={setComposerIsBreaking}
              editingArticleId={editingArticleId}
              handleSaveArticle={handleSaveArticle}
              hasRecoveredDraft={hasRecoveredDraft}
              isSavingArticle={isSavingArticle}
            />
          )}

          {activeTab === 'notifications' && (
            <TipsInboxView
              cardBg={cardBg}
              tips={tips}
              handleClaimTip={handleClaimTip}
              handleConvertTipToDraft={handleConvertTipToDraft}
            />
          )}

          {activeTab === 'analytics' && (
            <JournalistAnalyticsView
              cardBg={cardBg}
              ratingData={ratingData}
              analytics={MOCK_ANALYTICS}
            />
          )}
        </main>
      </div>

      {/* EVENT COMPOSER MODAL */}
      {isEventComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="event-composer-title">
          <div className={`w-full max-w-md ${cardBg} p-6 rounded-2xl shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h3 id="event-composer-title" className="font-black text-sm text-white">Broadcast Live Match Event</h3>
              <button
                onClick={() => setIsEventComposerOpen(false)}
                aria-label="Close modal"
                className="p-2 text-gray-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishMatchEvent} className="space-y-4 text-xs font-semibold">
              <div>
                <label htmlFor="composer-target-select" className="block text-gray-400 uppercase font-bold mb-1">Target Team</label>
                <select
                  id="composer-target-select"
                  value={composerTarget}
                  onChange={(e) => setComposerTarget(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                >
                  <option value="home">Home ({HERO_MATCH_LIVE.homeTeam})</option>
                  <option value="away">Away ({HERO_MATCH_LIVE.awayTeam})</option>
                  <option value="match">Match Event</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="composer-type-select" className="block text-gray-400 uppercase font-bold mb-1">Event Type</label>
                  <select
                    id="composer-type-select"
                    value={composerEventType}
                    onChange={(e) => setComposerEventType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  >
                    <option value="goal">Goal ⚽</option>
                    <option value="yellow">Yellow Card 🟨</option>
                    <option value="red">Red Card 🟥</option>
                    <option value="sub">Substitution 🔄</option>
                    <option value="ht">Half Time (HT)</option>
                    <option value="ft">Full Time (FT)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="composer-minute-input" className="block text-gray-400 uppercase font-bold mb-1">Match Minute</label>
                  <input
                    id="composer-minute-input"
                    type="number"
                    min="1"
                    max="120"
                    value={composerMinute}
                    onChange={(e) => setComposerMinute(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="composer-detail-input" className="block text-gray-400 uppercase font-bold mb-1">Event Detail Description</label>
                <input
                  id="composer-detail-input"
                  type="text"
                  value={composerDetailText}
                  onChange={(e) => setComposerDetailText(e.target.value)}
                  placeholder="e.g. Scored by #10 Striker from 20 yards"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingEvent}
                className="w-full py-3 rounded-xl bg-[#148A54] hover:bg-[#107244] text-white font-black text-xs shadow-lg transition-colors cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                Broadcast Event to Feed
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalistDashboard;
