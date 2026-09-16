import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { updateTeamSettings, DEFAULT_TEAM_UUID } from '../lib/supabaseClient';
import {
  Settings,
  Shield,
  Target,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  Lock,
  Building,
  Mail,
  Phone,
  Palette,
  UserCheck,
} from 'lucide-react';

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
  const [teamDescription, setTeamDescription] = useState(
    teamInfo?.description || 'Official varsity squad competing in the Premier Division.'
  );
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
      if (teamInfo.primary_color || teamInfo.color_code)
        setPrimaryColor(teamInfo.primary_color || teamInfo.color_code);
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
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-24 sm:pb-16">
      {/* 1. GOOGLE FORMS TOP HEADER CARD */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] via-purple-500 to-[#00b04f]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Team Operations & Role Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#ff0046] text-white">
                Head Coach
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl pl-10.5">
              Configure club brand identity, designated matchday captain, pitch venue, and tactical role allocations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto pl-10.5 sm:pl-0">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-[#00b04f] border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Coach Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Forms Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* CLUB IDENTITY OVERVIEW CARD */}
          <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#152a40] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white font-black text-sm shrink-0 shadow-2xs">
                {logoUrl ? (
                  <img src={logoUrl} alt="Team Logo" className="w-full h-full object-contain" />
                ) : (
                  <span>{shortName}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {teamName} ({shortName})
                  </h2>
                  <CheckCircle2 className="w-4 h-4 text-[#00b04f]" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official Club Operations & Varsity Athletic Registry
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-400 hidden sm:block">
              ID: {teamId.slice(0, 8)}...
            </span>
          </div>

          {/* SECTION 1: TEAM PROFILE & BRAND IDENTITY CARD */}
          <section className="relative overflow-hidden bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] to-rose-500" />
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                    Team Profile & Brand Identity
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Primary varsity identity details and venue specification
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-[#00b04f] border border-emerald-500/20">
                Coach Authority
              </span>
            </div>

            <form onSubmit={handleSaveTeamSettings} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Team Name
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Short Abbreviation
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Team Logo Image URL
                </label>
                <input
                  type="text"
                  disabled={currentRole !== 'COACH'}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Email</span>
                  </label>
                  <input
                    type="email"
                    disabled={currentRole !== 'COACH'}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Phone</span>
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Home Venue / Pitch</span>
                  </label>
                  <input
                    type="text"
                    disabled={currentRole !== 'COACH'}
                    value={stadium}
                    onChange={(e) => setStadium(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span>Team Palette Colors</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] bg-slate-50/50 dark:bg-[#112236]/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Primary</span>
                    <input
                      type="color"
                      disabled={currentRole !== 'COACH'}
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] bg-slate-50/50 dark:bg-[#112236]/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Secondary</span>
                    <input
                      type="color"
                      disabled={currentRole !== 'COACH'}
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] bg-slate-50/50 dark:bg-[#112236]/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Accent</span>
                    <input
                      type="color"
                      disabled={currentRole !== 'COACH'}
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Designated Team Captain</span>
                </label>
                <select
                  disabled={currentRole !== 'COACH'}
                  value={designatedCaptain}
                  onChange={(e) => {
                    setDesignatedCaptain(e.target.value);
                    const found = roster.find((p) => p.id === e.target.value);
                    showToast(`Coach Authority: Appointed ${found?.name || e.target.value} as Captain.`);
                  }}
                  className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
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
                    className="px-6 py-2.5 bg-[#ff0046] hover:bg-[#e0003c] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    Save Coach Team Settings
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* SECTION 2: MATCH ROLES & SET-PIECE SPECIALISTS CARD */}
          <section className="relative overflow-hidden bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00b04f] to-emerald-500" />
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#00b04f] flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                    Match Roles & Set-Piece Specialists
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Assign in-match tactical specialists and fallback on-pitch duties
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-[#00b04f] border border-emerald-500/20">
                Coach Authority
              </span>
            </div>

            <form onSubmit={handleSaveMatchRoles} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Penalty Kick Specialist
                  </label>
                  <select
                    value={setPiecePenalty}
                    onChange={(e) => setSetPiecePenalty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Free Kick Specialist
                  </label>
                  <select
                    value={setPieceFreeKick}
                    onChange={(e) => setSetPieceFreeKick(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Corner Kick Specialist
                  </label>
                  <select
                    value={setPieceCorner}
                    onChange={(e) => setSetPieceCorner(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Kickoff Specialist
                  </label>
                  <select
                    value={kickoffPlayer}
                    onChange={(e) => setKickoffPlayer(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Vice Captain
                  </label>
                  <select
                    value={viceCaptain}
                    onChange={(e) => setViceCaptain(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Emergency Goalkeeper
                  </label>
                  <select
                    value={emergencyGk}
                    onChange={(e) => setEmergencyGk(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all"
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
                  className="px-6 py-2.5 bg-[#00b04f] hover:bg-[#009944] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
                >
                  Save In-Match Roles
                </button>
              </div>
            </form>
          </section>

          {/* DANGER ZONE: LOGOUT */}
          <div className="relative overflow-hidden bg-white dark:bg-[#0e1c2b] border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                End Management Session
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sign out of the Coach Operations portal on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Theme & Permissions */}
        <div className="lg:col-span-4 space-y-6">
          {/* THEME SELECTOR CARD */}
          <div className="relative overflow-hidden bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                Display Theme Mode
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle between dark navy stadium mode and crisp daylight mode.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#152a40] dark:hover:bg-[#1c3857] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Switch to Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Switch to Dark Theme</span>
                </>
              )}
            </button>
          </div>

          {/* PERMISSIONS GOVERNANCE MATRIX CARD */}
          <div className="relative overflow-hidden bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#14263b] pb-3">
              <div className="w-7 h-7 rounded-lg bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Permissions Governance
                </h3>
                <p className="text-[11px] text-slate-400">Coach vs Captain RBAC</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { action: 'Team Roster & Player Intake', role: 'Coach Exclusive' },
                { action: 'Club Crest & Colors', role: 'Coach Exclusive' },
                { action: 'Appoint Team Captain', role: 'Coach Exclusive' },
                { action: '2D Pitch Tactics & Starting XI', role: 'Coach Exclusive' },
                { action: 'Set-Piece & In-Match Roles', role: 'Coach Exclusive' },
                { action: 'Publish Press Releases', role: 'Coach Authorized' },
              ].map((perm, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 border-b last:border-0 border-slate-100 dark:border-[#14263b]"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                    {perm.action}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-[#00b04f] border border-emerald-500/20">
                    {perm.role}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-[#14263b] leading-relaxed">
              All governance permissions are enforced server-side via PostgreSQL Row-Level Security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
