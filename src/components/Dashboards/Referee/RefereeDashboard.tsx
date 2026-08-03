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
    isLoading,
    selectedFixtureId,
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
    cancelMatch,
    submitMatchReport,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row pb-20 md:pb-8">
      {/* TASK 10 — DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/60 p-4 space-y-6 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black shadow">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight">Referee Portal</h2>
            <span className="text-[10px] text-slate-400 font-mono">Egerton Sports</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <p className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Navigation</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'my_matches' && (activeTab === 'match_details' || activeTab === 'report'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D4AF37] text-slate-950 font-black shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <RefereeHeader
          currentUserName={currentUserName}
          authError={authError}
          successMsg={successMsg}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          myMatchesCount={fixtures.length}
        />

        {activeTab === 'home' && (
          <RefereeHomeOverview
            upcomingAssignment={upcomingAssignment}
            countdownStr={countdownStr}
            setSelectedFixtureId={setSelectedFixtureId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'my_matches' && (
          <MyMatchesView
            fixtures={fixtures}
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

      {/* TASK 11 — MOBILE NAVIGATION (BOTTOM NAV BAR ONLY) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'my_matches' && (activeTab === 'match_details' || activeTab === 'report'));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                isActive ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default RefereeDashboard;
