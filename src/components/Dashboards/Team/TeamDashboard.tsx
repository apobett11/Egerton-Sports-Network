import React from 'react';
import {
  Zap,
  Trash2,
  X,
  ArrowRightLeft,
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  Newspaper,
} from 'lucide-react';
import type { PlayerPosition } from './types';
import { initialFixtures, initialStandings, formationCoordinates } from './mockData';
import { useTeamDashboard } from './hooks/useTeamDashboard';
import { Homepage } from './components/Homepage';
import { LoginPage } from './components/LoginPage';
import { SettingsPage } from './components/SettingsPage';
import { SquadPage } from './components/SquadPage';
import { StandingsPage } from './components/StandingsPage';
import { TeamSidebar } from './components/Sidebar/TeamSidebar';
import { TeamHeader } from './components/Header/TeamHeader';
import { PitchCanvas } from './components/Tactics/PitchCanvas';
import { TacticsControls } from './components/Tactics/TacticsControls';
import { RosterListView } from './components/Roster/RosterListView';
import { RoleAssignmentsView } from './components/Roles/RoleAssignmentsView';
import { NewsFeed } from '../../MainFeed/NewsFeed';
import { mockNews } from '../../../mockData';

export const TeamDashboard: React.FC = () => {
  const {
    isLoggedIn,
    currentRole,
    setCurrentRole,
    activeView,
    setActiveView,
    darkMode,
    setDarkMode,
    roster,
    startingXI,
    formation,
    setFormation,
    activePlaystyle,
    setActivePlaystyle,
    playstyleSliders,
    setPlaystyleSliders,
    selectedPitchSlot,
    setSelectedPitchSlot,
    showSwapModal,
    setShowSwapModal,
    searchTerm,
    setSearchTerm,
    positionFilter,
    setPositionFilter,
    showAddPlayerModal,
    setShowAddPlayerModal,
    playerToDelete,
    setPlayerToDelete,
    newPlayer,
    setNewPlayer,
    roleAssignments,
    setRoleAssignments,
    toastMessage,
    showToast,
    handleLogin,
    handleLogout,
    handleRoleToggle,
    collectiveRating,
    collectiveStrength,
    benchPlayers,
    handleSaveSquadDraft,
    handleSubmitMatchSquad,
    handleSwapPlayer,
    handleAddPlayer,
    handleDeletePlayer,
  } = useTeamDashboard();

  const activeCoordinates = formationCoordinates[formation] || formationCoordinates['4-4-1-1'];

  const filteredRoster = roster.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || player.number.toString().includes(searchTerm);
    const matchesPos = positionFilter === 'ALL' || player.position === positionFilter;
    return matchesSearch && matchesPos;
  });

  const selectedPlayer = selectedPitchSlot !== null ? roster[startingXI[selectedPitchSlot]] : null;
  const selectedNodeCoord = selectedPitchSlot !== null ? activeCoordinates[selectedPitchSlot] : null;

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 antialiased flex flex-col md:flex-row font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-2.5 animate-bounce text-xs md:text-sm font-semibold">
          <Zap className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <TeamSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        handleLogout={handleLogout}
      />

      {/* MAIN CONTENT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* PERSISTENT HEADER BAR */}
        <TeamHeader
          currentRole={currentRole}
          activeView={activeView}
          setActiveView={setActiveView}
          handleRoleToggle={handleRoleToggle}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* MAIN VIEWS WORKSPACE CANVAS */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* PAGE 1: HOMEPAGE */}
          {activeView === 'DASHBOARD' && (
            <Homepage
              onNavigateToMatchCenter={() => setActiveView('TACTICS')}
              matches={initialFixtures}
              standings={initialStandings}
            />
          )}

          {/* PAGE 2: TACTICS & PITCH */}
          {activeView === 'TACTICS' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7">
                <PitchCanvas
                  formation={formation}
                  startingXI={startingXI}
                  roster={roster}
                  selectedPitchSlot={selectedPitchSlot}
                  setSelectedPitchSlot={setSelectedPitchSlot}
                />
              </div>

              <div className="md:col-span-5">
                <TacticsControls
                  collectiveRating={collectiveRating}
                  collectiveStrength={collectiveStrength}
                  formation={formation}
                  setFormation={setFormation}
                  activePlaystyle={activePlaystyle}
                  setActivePlaystyle={setActivePlaystyle}
                  playstyleSliders={playstyleSliders}
                  setPlaystyleSliders={setPlaystyleSliders}
                  startingXILength={startingXI.length}
                  handleSaveSquadDraft={handleSaveSquadDraft}
                  handleSubmitMatchSquad={handleSubmitMatchSquad}
                  showToast={showToast}
                />
              </div>
            </div>
          )}

          {/* PAGE 3: ROSTER & SUBS */}
          {activeView === 'ROSTER' && (
            <RosterListView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              positionFilter={positionFilter}
              setPositionFilter={setPositionFilter}
              currentRole={currentRole}
              setShowAddPlayerModal={setShowAddPlayerModal}
              filteredRoster={filteredRoster}
              startingXI={startingXI}
              roster={roster}
              setPlayerToDelete={setPlayerToDelete}
            />
          )}

          {/* PAGE 4: MATCH ROLES */}
          {activeView === 'ROLES' && (
            <RoleAssignmentsView
              roleAssignments={roleAssignments}
              setRoleAssignments={setRoleAssignments}
              roster={roster}
              currentRole={currentRole}
              showToast={showToast}
            />
          )}

          {/* PAGE 5: STANDINGS */}
          {activeView === 'STANDINGS' && (
            <StandingsPage standings={initialStandings} fixtures={initialFixtures} />
          )}

          {/* PAGE 6: TEAM NEWS */}
          {activeView === 'NEWS' && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-emerald-400" /> Egerton FC Team Bulletin & Announcements
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Official club announcements, match previews, squad injury reports, transfer updates, and tactical briefings.
                </p>
              </div>
              <NewsFeed newsItems={mockNews} />
            </div>
          )}

          {/* PAGE 7: SETTINGS */}
          {activeView === 'SETTINGS' && (
            <SettingsPage
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              showToast={showToast}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden bg-[#1A1A1A] border-t border-[#2A2A2A] py-2 px-3 sticky bottom-0 z-40 flex items-center justify-around select-none">
          <button
            onClick={() => setActiveView('DASHBOARD')}
            className={`flex flex-col items-center gap-1 transition-all min-h-[44px] justify-center cursor-pointer ${
              activeView === 'DASHBOARD' ? 'text-emerald-400 font-bold' : 'text-gray-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Home</span>
          </button>

          <button
            onClick={() => setActiveView('TACTICS')}
            className={`flex flex-col items-center gap-1 transition-all min-h-[44px] justify-center cursor-pointer ${
              activeView === 'TACTICS' ? 'text-emerald-400 font-bold' : 'text-gray-400'
            }`}
          >
            <span>⚽</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold">Pitch</span>
          </button>

          <button
            onClick={() => setActiveView('ROSTER')}
            className={`flex flex-col items-center gap-1 transition-all min-h-[44px] justify-center cursor-pointer ${
              activeView === 'ROSTER' ? 'text-emerald-400 font-bold' : 'text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Squad</span>
          </button>

          <button
            onClick={() => setActiveView('STANDINGS')}
            className={`flex flex-col items-center gap-1 transition-all min-h-[44px] justify-center cursor-pointer ${
              activeView === 'STANDINGS' ? 'text-emerald-400 font-bold' : 'text-gray-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Table</span>
          </button>

          <button
            onClick={() => setActiveView('SETTINGS')}
            className={`flex flex-col items-center gap-1 transition-all min-h-[44px] justify-center cursor-pointer ${
              activeView === 'SETTINGS' ? 'text-emerald-400 font-bold' : 'text-gray-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Setup</span>
          </button>
        </nav>
      </div>

      {/* SLIDE-OVER PLAYER INSPECTOR DRAWER */}
      {selectedPlayer && selectedNodeCoord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="flex-1" onClick={() => setSelectedPitchSlot(null)} />

          <div className="w-full max-w-md bg-[#1F1F1F] border-l border-[#2A2A2A] h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Pitch Node #{selectedPitchSlot! + 1}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs md:text-sm font-semibold text-gray-200">
                    {selectedNodeCoord.roleLabel}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPitchSlot(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
                <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border-2 border-emerald-500/50 overflow-hidden shrink-0 shadow-md">
                  <img
                    src={selectedPlayer.cardImage}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold tracking-wide text-gray-100">
                    {selectedPlayer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      #{selectedPlayer.number}
                    </span>
                    <span className="text-xs font-semibold text-gray-300">
                      Position: {selectedPlayer.position}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111111] p-3.5 rounded-xl border border-[#2A2A2A]">
                  <span className="text-[11px] md:text-xs font-medium text-gray-400 block mb-1">
                    Overall Rating
                  </span>
                  <span className="font-mono text-base md:text-lg font-bold text-white">
                    {selectedPlayer.rating} OVR
                  </span>
                </div>

                <div className="bg-[#111111] p-3.5 rounded-xl border border-[#2A2A2A]">
                  <span className="text-[11px] md:text-xs font-medium text-gray-400 block mb-1">
                    Fitness / Stamina
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#2A2A2A] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${selectedPlayer.stamina}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {selectedPlayer.stamina}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A] space-y-2.5">
                <h4 className="text-xs md:text-sm font-semibold text-gray-200 mb-2">Athletic Breakdown</h4>

                {[
                  { label: 'Speed', val: selectedPlayer.speed },
                  { label: 'Shooting', val: selectedPlayer.shooting },
                  { label: 'Passing', val: selectedPlayer.passing },
                  { label: 'Dribbling', val: selectedPlayer.dribbling },
                  { label: 'Defense', val: selectedPlayer.defense },
                  { label: 'Physical', val: selectedPlayer.physical }
                ].map(st => (
                  <div key={st.label} className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-400">{st.label}</span>
                    <span className="font-mono font-bold text-white">{st.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSwapModal(true)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Swap Player (Substitute)</span>
            </button>
          </div>
        </div>
      )}

      {/* SWAP PLAYER MODAL */}
      {showSwapModal && selectedPlayer && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div>
                <h3 className="text-sm md:text-base font-semibold tracking-wide text-gray-100">
                  Substitute for {selectedPlayer.name} (#{selectedPlayer.number})
                </h3>
                <p className="text-[11px] md:text-xs font-medium text-gray-400">
                  Select an available bench player to swap onto the pitch
                </p>
              </div>
              <button
                onClick={() => setShowSwapModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {benchPlayers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No bench players available.</p>
              ) : (
                benchPlayers.map(benchP => {
                  const benchRosterIdx = roster.findIndex(p => p.id === benchP.id);
                  return (
                    <button
                      key={benchP.id}
                      onClick={() => handleSwapPlayer(benchRosterIdx)}
                      className="w-full p-3 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:border-emerald-500 transition-all flex items-center justify-between min-h-[44px] text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1F1F1F] overflow-hidden shrink-0">
                          <img src={benchP.cardImage} alt={benchP.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-xs md:text-sm font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors">
                            {benchP.name} (#{benchP.number})
                          </div>
                          <div className="text-[11px] font-medium text-gray-400">
                            {benchP.position} • Fit: {benchP.stamina}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs md:text-sm font-bold text-white">
                          {benchP.rating} OVR
                        </span>
                        <div className="p-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* COACH ADD PLAYER MODAL */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div>
                <h3 className="text-sm md:text-base font-semibold tracking-wide text-gray-100">
                  Register New Squad Athlete
                </h3>
                <p className="text-[11px] md:text-xs font-medium text-gray-400">
                  Coach authority action
                </p>
              </div>
              <button
                onClick={() => setShowAddPlayerModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Athlete Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Marcus Thorne"
                  value={newPlayer.name}
                  onChange={e => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Jersey Number</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={newPlayer.number}
                    onChange={e => setNewPlayer(prev => ({ ...prev, number: Number(e.target.value) }))}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Position</label>
                  <select
                    value={newPlayer.position}
                    onChange={e => setNewPlayer(prev => ({ ...prev, position: e.target.value as PlayerPosition }))}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  >
                    <option value="GK">GK (Goalkeeper)</option>
                    <option value="DF">DF (Defender)</option>
                    <option value="MD">MD (Midfielder)</option>
                    <option value="FW">FW (Forward)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Overall Rating (OVR)</label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  required
                  value={newPlayer.rating}
                  onChange={e => setNewPlayer(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 bg-[#111111] hover:bg-[#2A2A2A] text-gray-300 text-xs md:text-sm font-semibold rounded-lg transition-colors min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer shadow-md"
                >
                  Register Athlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-100">
                Remove {playerToDelete.name}?
              </h3>
              <p className="text-[11px] md:text-xs text-gray-400 mt-1">
                This action will delete #{playerToDelete.number} from the squad roster.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPlayerToDelete(null)}
                className="px-4 py-2 bg-[#111111] hover:bg-[#2A2A2A] text-gray-300 text-xs md:text-sm font-semibold rounded-lg transition-colors min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlayer}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;
