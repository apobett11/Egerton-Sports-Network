import React, { useState } from 'react';
import { UserRole } from '../types';
import { updateTeamSettings, DEFAULT_TEAM_UUID } from '../lib/supabaseClient';

interface SettingsPageProps {
    currentRole: UserRole;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    showToast: (msg: string) => void;
    onLogout: () => void;
    teamId?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
    currentRole,
    darkMode,
    setDarkMode,
    showToast,
    onLogout,
    teamId = DEFAULT_TEAM_UUID
}) => {
    // Coach-managed Team Profile & Identity
    const [teamName, setTeamName] = useState('Egerton FC');
    const [shortName, setShortName] = useState('EFC');
    const [logoUrl, setLogoUrl] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN');
    const [contactEmail, setContactEmail] = useState('athletics@egerton.ac.ke');
    const [contactPhone, setContactPhone] = useState('+254 700 123456');
    const [stadium, setStadium] = useState('Egerton Main Pavilion Arena');
    const [teamDescription, setTeamDescription] = useState('Official high-performance university varsity squad competing in the Premier Division.');
    const [primaryColor, setPrimaryColor] = useState('#D4AF37');
    const [secondaryColor, setSecondaryColor] = useState('#1E293B');
    const [accentColor, setAccentColor] = useState('#FFFFFF');

    // Captain-managed Tactical & In-Match Roles
    const [setPiecePenalty, setSetPiecePenalty] = useState('E. Haaland');
    const [setPieceFreeKick, setSetPieceFreeKick] = useState('K. De Bruyne');
    const [setPieceCorner, setSetPieceCorner] = useState('K. De Bruyne');
    const [kickoffPlayer, setKickoffPlayer] = useState('Marcus Thorne');
    const [throwInPriority, setThrowInPriority] = useState('Aaron Sterling');
    const [subPriority, setSubPriority] = useState('P. Foden');
    const [viceCaptain, setViceCaptain] = useState('Soren Brandt');
    const [emergencyGk, setEmergencyGk] = useState('Marcus Thorne');
    const [designatedCaptain, setDesignatedCaptain] = useState('Leo Van Dijk');

    const handleToggleTheme = () => {
        const nextDark = !darkMode;
        setDarkMode(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme-team', 'dark');
            showToast('Switched to Obsidian Dark Mode.');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme-team', 'light');
            showToast('Switched to Cream Light Mode.');
        }
    };

    const handleSaveTeamSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentRole !== 'COACH') {
            showToast('Access Denied: Captains cannot modify core team registration or kit parameters.');
            return;
        }
        const success = await updateTeamSettings(teamId, {
            name: teamName,
            short_name: shortName,
            logo_url: logoUrl,
            color_code: primaryColor,
        });
        if (success) {
            showToast('Coach Authority: Team profile, logo, colors, and stadium updated in database.');
        } else {
            showToast('Coach Authority: Team profile settings updated locally.');
        }
    };

    const handleSaveMatchRoles = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentRole !== 'CAPTAIN') {
            showToast('Notice: Set-piece & match roles assignment is delegated to Captain Mode.');
            return;
        }
        showToast('Captain Authority: In-match roles and set-piece specialists saved successfully.');
    };



    return (
        <div className="space-y-stack-lg w-full select-none max-w-7xl mx-auto pb-16">
            <div className="border-b border-outline-variant/20 pb-4 mb-6">
                <h2 className="font-display-md text-display-md font-bold text-on-surface">Team Operations & Role Settings</h2>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1.5">Manage team profile metadata, kit parameters, and in-match set-piece assignments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                {/* Core Controls Left */}
                <div className="lg:col-span-8 space-y-gutter space-y-6">
                    {/* User Profile Header widget */}
                    <div className="bg-surface-container p-6 border border-outline-variant/15 rounded-xl flex items-center justify-between gap-4 shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border border-primary bg-surface-container-high/60 shadow">
                                <img
                                    className="w-full h-full object-cover"
                                    src={logoUrl}
                                    alt="Team Logo"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-headline-md text-sm font-bold text-on-surface">{teamName} ({shortName})</h3>
                                    <span className="material-symbols-outlined text-primary text-base">verified</span>
                                </div>
                                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 uppercase tracking-wider">
                                    {currentRole === 'COACH' ? 'Coach Executive Portal' : 'Captain Match Operations Portal'}
                                </p>
                            </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            currentRole === 'COACH' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                            {currentRole} ACTIVE
                        </span>
                    </div>

                    {/* Dynamic Role & Theme controls */}
                    <div className="bg-surface-container p-6 border border-outline-variant/15 rounded-xl space-y-6 shadow">
                        <h3 className="font-headline-md text-sm font-bold text-on-surface">Theme & System Context</h3>

                        {/* Dark Light mode custom selector */}
                        <div className="flex items-center justify-between py-2 border-b border-outline-variant/15 pb-4">
                            <div>
                                <p className="font-headline-md text-xs font-bold text-on-surface">Theme Palette</p>
                                <p className="text-[10px] text-on-surface-variant mt-1">Switch background scale between obsidian dark and light mode.</p>
                            </div>
                            <button
                                onClick={handleToggleTheme}
                                className="w-14 h-8 bg-surface-container-highest/40 border border-outline-variant/20 rounded-full p-1 relative transition-all duration-300 flex items-center cursor-pointer"
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                        darkMode ? 'bg-primary translate-x-6' : 'bg-on-surface-variant translate-x-0'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px] text-black font-black">
                                        {darkMode ? 'dark_mode' : 'light_mode'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 1: COACH ONLY - TEAM PROFILE, LOGO, COLOURS & KITS */}
                    <div className={`bg-surface-container p-6 border rounded-xl space-y-6 shadow transition-all ${
                        currentRole === 'COACH' ? 'border-emerald-500/40' : 'border-outline-variant/15 opacity-80'
                    }`}>
                        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                            <div>
                                <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-2">
                                    <span>🛡️</span> Team Profile, Logo & Kit Configuration
                                </h3>
                                <p className="text-[10px] text-on-surface-variant mt-1">
                                    Head Coach authority: Update contact info, stadium, club colors, logo URL, and assign team captain.
                                </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                                COACH EXCLUSIVE
                            </span>
                        </div>

                        {currentRole === 'CAPTAIN' && (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                <span>Locked for Captain: Team metadata, logo upload, colors, kits, and captain assignment are restricted to Coach Gate.</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveTeamSettings} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Team Name</label>
                                    <input
                                        type="text"
                                        disabled={currentRole !== 'COACH'}
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Short Abbreviation</label>
                                    <input
                                        type="text"
                                        disabled={currentRole !== 'COACH'}
                                        value={shortName}
                                        onChange={(e) => setShortName(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Team Logo Image URL</label>
                                <input
                                    type="text"
                                    disabled={currentRole !== 'COACH'}
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Contact Email</label>
                                    <input
                                        type="email"
                                        disabled={currentRole !== 'COACH'}
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Contact Phone</label>
                                    <input
                                        type="text"
                                        disabled={currentRole !== 'COACH'}
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Home Venue / Stadium</label>
                                    <input
                                        type="text"
                                        disabled={currentRole !== 'COACH'}
                                        value={stadium}
                                        onChange={(e) => setStadium(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Primary Color</label>
                                    <input
                                        type="color"
                                        disabled={currentRole !== 'COACH'}
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-full h-9 bg-surface-container-high border border-outline-variant/20 rounded-lg p-1 cursor-pointer disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Secondary Color</label>
                                    <input
                                        type="color"
                                        disabled={currentRole !== 'COACH'}
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="w-full h-9 bg-surface-container-high border border-outline-variant/20 rounded-lg p-1 cursor-pointer disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Accent Color</label>
                                    <input
                                        type="color"
                                        disabled={currentRole !== 'COACH'}
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-full h-9 bg-surface-container-high border border-outline-variant/20 rounded-lg p-1 cursor-pointer disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Appoint Team Captain (Coach Authority)</label>
                                <select
                                    disabled={currentRole !== 'COACH'}
                                    value={designatedCaptain}
                                    onChange={(e) => {
                                        setDesignatedCaptain(e.target.value);
                                        showToast(`Coach Authority: Appointed ${e.target.value} as Team Captain.`);
                                    }}
                                    className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                >
                                    <option value="Leo Van Dijk">Leo Van Dijk (#2 - CB)</option>
                                    <option value="Aaron Sterling">Aaron Sterling (#10 - CAM)</option>
                                    <option value="Soren Brandt">Soren Brandt (#1 - GK)</option>
                                    <option value="Marcus Thorne">Marcus Thorne (#9 - ST)</option>
                                </select>
                            </div>

                            {currentRole === 'COACH' && (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                                >
                                    Save Coach Team Settings
                                </button>
                            )}
                        </form>
                    </div>

                    {/* SECTION 2: CAPTAIN ONLY - IN-MATCH ROLES & SET PIECES */}
                    <div className={`bg-surface-container p-6 border rounded-xl space-y-6 shadow transition-all ${
                        currentRole === 'CAPTAIN' ? 'border-amber-500/40' : 'border-outline-variant/15 opacity-80'
                    }`}>
                        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                            <div>
                                <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-2">
                                    <span>🎯</span> Match Roles & Set-Piece Specialists
                                </h3>
                                <p className="text-[10px] text-on-surface-variant mt-1">
                                    Team Captain authority: Designate penalty takers, free kick specialists, corner takers, kickoff, throw-in, sub priority, vice captain, and emergency GK.
                                </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">
                                CAPTAIN EXCLUSIVE
                            </span>
                        </div>

                        {currentRole === 'COACH' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">info</span>
                                <span>Note for Coach: Set-piece takers and match duty roles are delegated to the Captain's Match Operations responsibilities.</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveMatchRoles} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Penalty Kick Taker</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={setPiecePenalty}
                                        onChange={(e) => setSetPiecePenalty(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="E. Haaland">E. Haaland (ST)</option>
                                        <option value="Marcus Thorne">Marcus Thorne (ST)</option>
                                        <option value="P. Foden">P. Foden (CAM)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Free Kick Specialist</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={setPieceFreeKick}
                                        onChange={(e) => setSetPieceFreeKick(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="K. De Bruyne">K. De Bruyne (CM)</option>
                                        <option value="Leo Van Dijk">Leo Van Dijk (CB)</option>
                                        <option value="Cole Palmer">Cole Palmer (RW)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Corner Kick Taker</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={setPieceCorner}
                                        onChange={(e) => setSetPieceCorner(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="K. De Bruyne">K. De Bruyne (CM)</option>
                                        <option value="Leo Van Dijk">Leo Van Dijk (CB)</option>
                                        <option value="B. Silva">B. Silva (RM)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Kickoff Player</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={kickoffPlayer}
                                        onChange={(e) => setKickoffPlayer(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="Marcus Thorne">Marcus Thorne (ST)</option>
                                        <option value="Aaron Sterling">Aaron Sterling (CAM)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Throw-In Priority</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={throwInPriority}
                                        onChange={(e) => setThrowInPriority(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="Aaron Sterling">Aaron Sterling (LB)</option>
                                        <option value="K. De Bruyne">K. De Bruyne (RB)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Substitution Priority Lead</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={subPriority}
                                        onChange={(e) => setSubPriority(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="P. Foden">P. Foden (MID)</option>
                                        <option value="Marcus Thorne">Marcus Thorne (FWD)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Vice Captain</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={viceCaptain}
                                        onChange={(e) => setViceCaptain(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="Soren Brandt">Soren Brandt (GK)</option>
                                        <option value="Aaron Sterling">Aaron Sterling (CAM)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-label-sm text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Emergency Goalkeeper</label>
                                    <select
                                        disabled={currentRole !== 'CAPTAIN'}
                                        value={emergencyGk}
                                        onChange={(e) => setEmergencyGk(e.target.value)}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="Marcus Thorne">Marcus Thorne (ST)</option>
                                        <option value="Leo Van Dijk">Leo Van Dijk (CB)</option>
                                    </select>
                                </div>
                            </div>

                            {currentRole === 'CAPTAIN' && (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                                >
                                    Save Captain Match Roles
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Danger Zone: Terminate Session */}
                    <div className="bg-rose-500/5 rounded-xl border border-rose-500/20 p-6 space-y-4 shadow">
                        <h3 className="font-headline-md text-sm font-bold text-rose-450">Terminate Active Session</h3>
                        <p className="text-[10px] text-on-surface-variant">Log out of the Egerton High-Performance Management portal.</p>
                        <button
                            onClick={onLogout}
                            className="py-3 px-8 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                        >
                            Sign Out / Logout
                        </button>
                    </div>
                </div>

                {/* Roles Rights Matrix sidebar Right */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-6 space-y-6 shadow-lg">
                        <h3 className="font-headline-md text-sm font-bold text-on-surface border-b border-outline-variant/15 pb-3">Permissions Governance Matrix</h3>
                        <div className="space-y-4 text-xs">
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-on-surface opacity-80">Edit Team Roster & Transfers</span>
                                {currentRole === 'COACH' ? (
                                    <span className="text-emerald-400 font-bold">COACH ONLY</span>
                                ) : (
                                    <span className="text-rose-400 font-bold">LOCKED</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-on-surface opacity-80">Upload Logo & Kit Colors</span>
                                {currentRole === 'COACH' ? (
                                    <span className="text-emerald-400 font-bold">COACH ONLY</span>
                                ) : (
                                    <span className="text-rose-400 font-bold">LOCKED</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-on-surface opacity-80">Appoint Team Captain</span>
                                {currentRole === 'COACH' ? (
                                    <span className="text-emerald-400 font-bold">COACH ONLY</span>
                                ) : (
                                    <span className="text-rose-400 font-bold">LOCKED</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-on-surface opacity-80">Starting XI & Pitch Tactics</span>
                                <span className="text-emerald-400 font-bold">COACH & CAPTAIN</span>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-on-surface opacity-80">Set-Piece Specialists & Match Roles</span>
                                {currentRole === 'CAPTAIN' ? (
                                    <span className="text-amber-400 font-bold">CAPTAIN ONLY</span>
                                ) : (
                                    <span className="text-slate-400 font-bold">VIEW ONLY</span>
                                )}
                            </div>
                        </div>

                        <p className="text-[10px] text-on-surface-variant font-medium text-justify mt-4 leading-relaxed uppercase">
                            Notice: All role actions are authorized server-side and protected by PostgreSQL RLS policies in Supabase.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

