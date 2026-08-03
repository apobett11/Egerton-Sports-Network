import React from 'react';
import { LoadingSpinner } from '../../../components/common/UIComponents';
import { useRefereeDashboard } from './hooks/useRefereeDashboard';
import { RefereeHeader } from './components/Header/RefereeHeader';
import { RefereeHomeOverview } from './components/Home/RefereeHomeOverview';
import { MyMatchesView } from './components/MyMatches/MyMatchesView';
import { MatchDetailsPage } from './components/MatchDetails/MatchDetailsPage';
import { MatchReportWorkflow } from './components/MatchReport/MatchReportWorkflow';
import { RefereeSettingsView } from './components/Settings/RefereeSettingsView';
import { RefereeProfileView } from './components/Profile/RefereeProfileView';
import { Home, Calendar, Settings, User, ShieldCheck } from 'lucide-react';
import type { RefereeTab } from './types';

export const RefereeDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const {
    currentUserName,
    activeTab,
    setActiveTab,
    fixtures,
    upcomingMatches,
    pastMatches,
    announcements,
    isLoading,
    setSelectedFixtureId,
    selectedFixture,
    upcomingAssignment,
    countdownStr,
    homeLineup,
    awayLineup,
    profileData,
    authError,
    successMsg,
    isSubmitting,
    isComposeVisible,
    isJournalModalOpen,
    setIsJournalModalOpen,
    cancelMatch,
    submitMatchReport,
    submitMatchJournal,
    handleUpdateProfile,
  } = useRefereeDashboard();

  if (isLoading) return <LoadingSpinner label="Loading official referee dashboard..." />;

  const navItems: Array<{ id: RefereeTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'my_matches', label: 'My Matches', icon: <Calendar className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col md:flex-row pb-20 md:pb-8">
      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#2A2A2A] bg-[#111111] p-4 space-y-6 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-3 border-b border-[#2A2A2A]">
          <div className="w-8 h-8 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] text-emerald-400 flex items-center justify-center font-black shadow">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight">REFEREE PORTAL</h2>
            <span className="text-[10px] text-gray-400 font-mono">Egerton Sports</span>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <p className="px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Navigation</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'my_matches' && (activeTab === 'match_details' || activeTab === 'report'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1F1F1F] text-emerald-400 border border-[#2A2A2A] shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
        <RefereeHeader
          currentUserName={currentUserName}
          authError={authError}
          successMsg={successMsg}
        />

        {activeTab === 'home' && (
          <RefereeHomeOverview
            upcomingAssignment={upcomingAssignment}
            countdownStr={countdownStr}
            announcements={announcements}
            profileData={profileData}
            isComposeVisible={isComposeVisible}
            isJournalModalOpen={isJournalModalOpen}
            setIsJournalModalOpen={setIsJournalModalOpen}
            onSubmitJournal={submitMatchJournal}
            setSelectedFixtureId={setSelectedFixtureId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'my_matches' && (
          <MyMatchesView
            upcomingMatches={upcomingMatches}
            pastMatches={pastMatches}
            setSelectedFixtureId={setSelectedFixtureId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'match_details' && (
          <MatchDetailsPage
            selectedFixture={selectedFixture}
            currentUserName={currentUserName}
            onEndMatch={() => setActiveTab('report')}
            onCancelMatch={cancelMatch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'report' && (
          <MatchReportWorkflow
            selectedFixture={selectedFixture}
            homeLineup={homeLineup}
            awayLineup={awayLineup}
            isSubmitting={isSubmitting}
            onSubmitReport={submitMatchReport}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <RefereeSettingsView
            profileData={profileData}
            onUpdateProfile={handleUpdateProfile}
            onLogout={onLogout}
          />
        )}

        {activeTab === 'profile' && (
          <RefereeProfileView
            profileData={profileData}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (>=48PX TOUCH TARGETS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-md border-t border-[#2A2A2A] px-4 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'my_matches' && (activeTab === 'match_details' || activeTab === 'report'));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-3 py-1 rounded-xl text-[10px] transition-all cursor-pointer ${
                isActive ? 'text-emerald-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default RefereeDashboard;
