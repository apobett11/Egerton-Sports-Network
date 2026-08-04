import React from 'react';
import {
  Home,
  FileText,
  BarChart3,
  User,
  Settings,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { useJournalistDashboard } from './hooks/useJournalistDashboard';
import { JournalistHeader } from './components/Header/JournalistHeader';
import { JournalistHomeView } from './components/Home/JournalistHomeView';
import { JournalistArticlesView } from './components/Articles/JournalistArticlesView';
import { JournalistAnalyticsView } from './components/Analytics/JournalistAnalyticsView';
import { ArticleComposerModal } from './components/Composer/ArticleComposerModal';
import { MatchSelectorModal } from './components/Modals/MatchSelectorModal';
import { ViewArticleModal } from './components/Modals/ViewArticleModal';
import { ProfileModal } from './components/Modals/ProfileModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { NotificationsModal } from './components/Modals/NotificationsModal';

export const JournalistDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const {
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    isLoadingData,
    loadError,
    retryLoad,
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
    // Form state
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
  } = useJournalistDashboard();

  const bgClass = darkMode ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#F6F8FA] text-slate-900';
  const cardBg = darkMode ? 'bg-[#141A24] border-slate-800' : 'bg-white border-[#D9E2EC] shadow-xs';
  const hoverBg = darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50';

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={`min-h-screen ${bgClass} font-sans transition-colors duration-200 pb-24 md:pb-12`}>
      {/* DATABASE LOADING OVERLAY */}
      {isLoadingData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-2xl">
            <div className="w-8 h-8 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-extrabold text-slate-200">Connecting to production Supabase database...</p>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-400/30">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <JournalistHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={onLogout}
      />

      {/* DATABASE ERROR BANNER WITH RETRY */}
      {loadError && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-bold text-rose-400">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Database Query Notice: {loadError}</span>
            </span>
            <button
              onClick={retryLoad}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry DB Fetch
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER (DESKTOP SIDEBAR + CONTENT) */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
          <div className={`p-4 rounded-3xl border ${cardBg} space-y-2 shadow-xs`}>
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-500">
              Newsroom Navigation
            </div>

            <nav className="space-y-1 font-bold text-xs">
              {/* HOME */}
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : darkMode
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home Newsroom</span>
              </button>

              {/* ARTICLES */}
              <button
                onClick={() => setActiveTab('articles')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'articles'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : darkMode
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Articles Archive</span>
              </button>

              {/* ANALYTICS */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : darkMode
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Journalist Analytics</span>
              </button>

              {/* PROFILE */}
              <button
                onClick={() => setIsProfileOpen(true)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 text-emerald-500" />
                <span>Press Credentials</span>
              </button>

              {/* SETTINGS */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Newsroom Settings</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* MAIN VIEW FEED */}
        <main className="lg:col-span-9 space-y-6">
          {activeTab === 'home' && (
            <JournalistHomeView
              currentEvent={currentEvent}
              onOpenMatchSelector={() => setIsMatchSelectorOpen(true)}
              onOpenCompose={() => openComposeModal()}
              onNavigateTab={(tab) => setActiveTab(tab)}
              performanceMetrics={performanceMetrics}
              articles={articles}
              onViewArticle={handleViewArticle}
              triggerToast={triggerToast}
              cardBg={cardBg}
              hoverBg={hoverBg}
            />
          )}

          {activeTab === 'articles' && (
            <JournalistArticlesView
              articles={articles}
              competitions={competitions}
              teams={teams}
              onOpenCompose={openComposeModal}
              onViewArticle={handleViewArticle}
              onDeleteArticle={handleDeleteArticle}
              cardBg={cardBg}
              hoverBg={hoverBg}
            />
          )}

          {activeTab === 'analytics' && (
            <JournalistAnalyticsView
              metrics={performanceMetrics}
              cardBg={cardBg}
            />
          )}
        </main>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) FOR COMPOSE */}
      <button
        onClick={() => openComposeModal()}
        aria-label="Compose Article"
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 p-4 md:px-5 md:py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-2xl shadow-emerald-900/50 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-emerald-400/40"
        title="Compose Article"
      >
        <Plus className="w-5 h-5 md:w-6 md:h-6" />
        <span className="hidden md:inline font-extrabold tracking-tight">Compose</span>
      </button>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 dark:bg-black/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around text-slate-400">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'home' ? 'text-emerald-400 font-extrabold' : 'hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'articles' ? 'text-emerald-400 font-extrabold' : 'hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold">Articles</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            activeTab === 'analytics' ? 'text-emerald-400 font-extrabold' : 'hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Analytics</span>
        </button>

        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center gap-1 cursor-pointer hover:text-slate-200 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>

      {/* MODALS */}
      <MatchSelectorModal
        isOpen={isMatchSelectorOpen}
        onClose={() => setIsMatchSelectorOpen(false)}
        matches={matches}
        currentEventId={currentEvent.id}
        onSelectMatch={selectCurrentEvent}
        cardBg={cardBg}
      />

      <ArticleComposerModal
        isOpen={isComposeModalOpen}
        onClose={closeComposeModal}
        composeType={composeType}
        setComposeType={setComposeType}
        composeHeadline={composeHeadline}
        setComposeHeadline={setComposeHeadline}
        composeSubtitle={composeSubtitle}
        setComposeSubtitle={setComposeSubtitle}
        composeBody={composeBody}
        setComposeBody={setComposeBody}
        composeMatchId={composeMatchId}
        setComposeMatchId={setComposeMatchId}
        composeTeamId={composeTeamId}
        setComposeTeamId={setComposeTeamId}
        composeCompetitionId={composeCompetitionId}
        setComposeCompetitionId={setComposeCompetitionId}
        composeImageUrl={composeImageUrl}
        setComposeImageUrl={setComposeImageUrl}
        matches={matches}
        competitions={competitions}
        teams={teams}
        currentEvent={currentEvent}
        editingArticleId={editingArticleId}
        isSavingArticle={isSavingArticle}
        handleSaveArticle={handleSaveArticle}
        cardBg={cardBg}
      />

      <ViewArticleModal
        isOpen={isViewArticleModalOpen}
        onClose={() => setIsViewArticleModalOpen(false)}
        article={viewingArticle}
        onEdit={(art) => openComposeModal(art)}
        onDelete={(id) => handleDeleteArticle(id)}
        cardBg={cardBg}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        cardBg={cardBg}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        cardBg={cardBg}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        cardBg={cardBg}
      />
    </div>
  );
};

export default JournalistDashboard;
