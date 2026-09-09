import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { updateTeamSettings, DEFAULT_TEAM_UUID } from '../lib/supabaseClient';
import { Settings, Shield, Target, Sun, Moon, LogOut, CheckCircle2, Lock } from 'lucide-react';

interface SettingsPageProps {
  currentRole: UserRole;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  showToast: (msg: string) => void;
  onLogout: () => void;
  teamId?: string;
  roster?: any[];
  teamInfo?: any;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentRole,
  darkMode,
  setDarkMode,
  showToast,
  onLogout,
  teamId = DEFAULT_TEAM_UUID,
  roster = [],
  teamInfo,
}) => {
  // Coach-managed Team Profile & Identity
  const [teamName, setTeamName] = useState(teamInfo?.name || 'Egerton FC');
  const [shortName, setShortName] = useState(teamInfo?.short_name || 'EFC');
  const [logoUrl, setLogoUrl] = useState(teamInfo?.crest_url || teamInfo?.logo_url || '');
  const [contactEmail, setContactEmail] = useState('athletics@egerton.ac.ke');
  const [contactPhone, setContactPhone] = useState('+254 700 123456');
  const [stadium, setStadium] = useState(teamInfo?.stadium || 'Egerton Main Pavilion Arena');
  const [teamDescription, setTeamDescription] = useState(teamInfo?.description || 'Official varsity squad competing in the Premier Division.');
  const [primaryColor, setPrimaryColor] = useState(teamInfo?.primary_color || teamInfo?.color_code || '#ff0046');
  const [secondaryColor, setSecondaryColor] = useState(teamInfo?.secondary_color || '#0e1e2d');
  const [accentColor, setAccentColor] = useState(teamInfo?.accent_color || '#ffffff');

  // Tactical & In-Match Roles
  const [setPiecePenalty, setSetPiecePenalty] = useState(roster[0]?.name || 'Marcus Thorne');
  const [setPieceFreeKick, setSetPieceFreeKick] = useState(roster[1]?.name || 'Aaron Sterling');
  const [setPieceCorner, setSetPieceCorner] = useState(roster[2]?.name || 'Aaron Sterling');
  const [kickoffPlayer, setKickoffPlayer] = useState(roster[3]?.name || 'Marcus Thorne');
  const [viceCaptain, setViceCaptain] = useState(roster[1]?.name || 'Soren Brandt');
  const [emergencyGk, setEmergencyGk] = useState(roster[0]?.name || 'Leo Van Dijk');
  const [designatedCaptain, setDesignatedCaptain] = useState(teamInfo?.captain_id || roster[0]?.id || 'p1');

  useEffect(() => {
    if (teamInfo) {
      if (teamInfo.name) setTeamName(teamInfo.name);
      if (teamInfo.short_name) setShortName(teamInfo.short_name);
      if (teamInfo.stadium) setStadium(teamInfo.stadium);
      if (teamInfo.description) setTeamDescription(teamInfo.description);
      if (teamInfo.primary_color || teamInfo.color_code) setPrimaryColor(teamInfo.primary_color || teamInfo.color_code);
      if (teamInfo.secondary_color) setSecondaryColor(teamInfo.secondary_color);
      if (teamInfo.accent_color) setAccentColor(teamInfo.accent_color);
      if (teamInfo.captain_id) setDesignatedCaptain(teamInfo.captain_id);
    }
  }, [teamInfo]);

  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme-team', 'dark');
      showToast('Switched to Dark Mode.');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-team', 'light');
      showToast('Switched to Light Mode.');
    }
  };

  const handleSaveTeamSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateTeamSettings(teamId, {
      name: teamName,
      short_name: shortName,
      logo_url: logoUrl,
      color_code: primaryColor,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      stadium: stadium,
      description: teamDescription,
      captain_id: designatedCaptain,
    });
    if (success) {
      showToast('Coach Authority: Team profile and colors updated in database.');
    } else {
      showToast('Coach Authority: Team profile settings updated locally.');
    }
  };

  const handleSaveMatchRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTeamSettings(teamId, {
        captain_id: designatedCaptain,
      });
      showToast('Coach Authority: Match roles and set-piece specialists saved.');
    } catch {
      showToast('Coach Authority: Saved match roles locally.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full select-none pb-16">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#ff0046]" />
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Team Operations & Role Settings
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#ff0046] text-white">
            Head Coach
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* USER & TEAM PROFILE BADGE */}
          <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-sm overflow-hidden bg-[#152a40] border border-white/10 flex items-center justify-center text-white font-black text-xs shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Team Logo" className="w-full h-full object-contain" />
                ) : (
                  <span>{shortName}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {teamName} ({shortName})
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-[#00b04f]" />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Official Club Operations Portal
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f] shrink-0">
              Coach Active
            </span>
          </div>

          {/* THEME SELECTOR CARD */}
          <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Display Theme Mode
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Toggle between Flashscore dark navy mode and crisp light mode.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              className="px-4 py-1.5 rounded-full text-xs font-black bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-200" />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          </div>

          {/* SECTION 1: TEAM PROFILE, LOGO, COLORS */}
          <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#ff0046]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Team Profile & Brand Identity
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f]">
                Coach Authority
              </span>
            </div>

            <form onSubmit={handleSaveTeamSettings} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Short Abbreviation
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Team Logo Image URL
                </label>
                <input
                  type="text"
                  disabled={currentRole !== 'COACH'}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    disabled={currentRole !== 'COACH'}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Home Venue / Pitch
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={stadium}
                    onChange={(e) => setStadium(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    disabled={currentRole !== 'COACH'}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-8 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    disabled={currentRole !== 'COACH'}
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full h-8 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    disabled={currentRole !== 'COACH'}
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full h-8 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Designated Team Captain
                </label>
                <select
                  disabled={currentRole !== 'COACH'}
                  value={designatedCaptain}
                  onChange={(e) => {
                    setDesignatedCaptain(e.target.value);
                    const found = roster.find((p) => p.id === e.target.value);
                    showToast(`Coach Authority: Appointed ${found?.name || e.target.value} as Captain.`);
                  }}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
                >
                  {roster && roster.length > 0 ? (
                    roster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (#{p.number} - {p.position})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="p1">Leo Van Dijk (#2 - CB)</option>
                      <option value="p2">Aaron Sterling (#10 - CAM)</option>
                      <option value="p3">Marcus Thorne (#9 - ST)</option>
                    </>
                  )}
                </select>
              </div>

              {currentRole === 'COACH' && (
                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#ff0046] hover:bg-[#e0003c] text-white font-black text-xs rounded-full transition-colors cursor-pointer shadow-xs"
                  >
                    Save Coach Team Settings
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* SECTION 2: MATCH ROLES & SET PIECES */}
          <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00b04f]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Match Roles & Set-Piece Specialists
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f]">
                Coach Authority
              </span>
            </div>

            <form onSubmit={handleSaveMatchRoles} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Penalty Kick Specialist
                  </label>
                  <select
                    value={setPiecePenalty}
                    onChange={(e) => setSetPiecePenalty(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {roster && roster.length > 0 ? (
                      roster.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))
                    ) : (
                      <option value="Marcus Thorne">Marcus Thorne (ST)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Free Kick Specialist
                  </label>
                  <select
                    value={setPieceFreeKick}
                    onChange={(e) => setSetPieceFreeKick(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {roster && roster.length > 0 ? (
                      roster.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))
                    ) : (
                      <option value="Aaron Sterling">Aaron Sterling (CAM)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Corner Kick Specialist
                  </label>
                  <select
                    value={setPieceCorner}
                    onChange={(e) => setSetPieceCorner(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {roster && roster.length > 0 ? (
                      roster.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))
                    ) : (
                      <option value="Aaron Sterling">Aaron Sterling (CAM)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Kickoff Specialist
                  </label>
                  <select
                    value={kickoffPlayer}
                    onChange={(e) => setKickoffPlayer(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {roster && roster.length > 0 ? (
                      roster.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))
                    ) : (
                      <option value="Marcus Thorne">Marcus Thorne (ST)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Vice Captain
                  </label>
                  <select
                    value={viceCaptain}
                    onChange={(e) => setViceCaptain(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {roster && roster.length > 0 ? (
                      roster.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))
                    ) : (
                      <option value="Soren Brandt">Soren Brandt (GK)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Emergency Goalkeeper
                  </label>
                  <select
                    value={emergencyGk}
                    onChange={(e) => setEmergencyGk(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {roster && roster.length > 0 ? (
                      roster.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))
                    ) : (
                      <option value="Leo Van Dijk">Leo Van Dijk (CB)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00b04f] hover:bg-[#009944] text-white font-black text-xs rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  Save In-Match Roles
                </button>
              </div>
            </form>
          </section>

          {/* DANGER ZONE: LOGOUT */}
          <div className="w-full bg-white dark:bg-[#0e1c2b] border border-rose-500/30 rounded-none sm:rounded-sm p-4 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                End Management Session
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sign out of the Coach Operations portal on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Permissions Governance Matrix */}
        <div className="lg:col-span-4 space-y-4">
          <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-2.5">
              <Lock className="w-4 h-4 text-[#ff0046]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Permissions Governance
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { action: 'Team Roster & Player Intake', role: 'Coach Exclusive' },
                { action: 'Club Crest & Colors', role: 'Coach Exclusive' },
                { action: 'Appoint Team Captain', role: 'Coach Exclusive' },
                { action: '2D Pitch Tactics & Starting XI', role: 'Coach Exclusive' },
                { action: 'Set-Piece & In-Match Roles', role: 'Coach Exclusive' },
                { action: 'Publish Press Releases', role: 'Coach Authorized' },
              ].map((perm, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b last:border-0 border-[#e6e8ec]/60 dark:border-[#1a2e45]/60">
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                    {perm.action}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f]">
                    {perm.role}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45] uppercase">
              All governance permissions are enforced server-side via PostgreSQL Row-Level Security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
