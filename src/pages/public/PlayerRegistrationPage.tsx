import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchTeamById, updatePlayerInfo } from '../../components/Dashboards/Team/lib/supabaseClient';
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  Phone,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  UserCheck
} from 'lucide-react';

interface PlayerRegistrationPageProps {
  onNavigate?: (path: string) => void;
}

interface ExistingPlayer {
  id: string;
  first_name?: string;
  last_name?: string;
  jersey_number?: number;
  position?: string;
  phone?: string;
  team_id?: string;
  profile_id?: string;
  profiles?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    bio?: string;
    phone?: string;
    role?: string;
  };
}

// Preset athletic avatar icons for players who prefer an icon
const AVATAR_ICON_PRESETS = [
  { id: 'icon_star', label: 'Playmaker', bg: 'from-amber-500 to-orange-600', emoji: '⭐' },
  { id: 'icon_striker', label: 'Striker', bg: 'from-rose-500 to-red-600', emoji: '⚽' },
  { id: 'icon_shield', label: 'Defender', bg: 'from-blue-500 to-indigo-600', emoji: '🛡️' },
  { id: 'icon_gk', label: 'Goalkeeper', bg: 'from-emerald-500 to-teal-600', emoji: '🧤' },
  { id: 'icon_speed', label: 'Winger', bg: 'from-purple-500 to-violet-600', emoji: '⚡' },
  { id: 'icon_captain', label: 'Captain', bg: 'from-yellow-400 to-amber-500', emoji: '👑' },
];

const POSITION_CATEGORIES = [
  { key: 'GK', label: 'Goalkeeper', defaultDetail: 'GK' },
  { key: 'DEF', label: 'Defender', defaultDetail: 'CB' },
  { key: 'MID', label: 'Midfielder', defaultDetail: 'CM' },
  { key: 'FWD', label: 'Striker / Forward', defaultDetail: 'ST' },
];

const DETAILED_POSITIONS: Record<string, { code: string; name: string }[]> = {
  GK: [
    { code: 'GK', name: 'Goalkeeper (GK)' },
  ],
  DEF: [
    { code: 'CB', name: 'Centre Back (CB)' },
    { code: 'LB', name: 'Left Back (LB)' },
    { code: 'RB', name: 'Right Back (RB)' },
    { code: 'LWB', name: 'Left Wing Back (LWB)' },
    { code: 'RWB', name: 'Right Wing Back (RWB)' },
  ],
  MID: [
    { code: 'CDM', name: 'Defensive Midfielder (CDM)' },
    { code: 'CM', name: 'Central Midfielder (CM)' },
    { code: 'CAM', name: 'Attacking Midfielder (CAM)' },
    { code: 'LM', name: 'Left Midfielder (LM)' },
    { code: 'RM', name: 'Right Midfielder (RM)' },
  ],
  FWD: [
    { code: 'ST', name: 'Striker (ST)' },
    { code: 'CF', name: 'Centre Forward (CF)' },
    { code: 'LW', name: 'Left Winger (LW)' },
    { code: 'RW', name: 'Right Winger (RW)' },
  ],
};

export const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ onNavigate }) => {
  const [teamId, setTeamId] = useState<string>('');
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<ExistingPlayer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Player Selection (from roster dropdown)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<ExistingPlayer | null>(null);

  // Form Fields
  const [preferredSquadName, setPreferredSquadName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [roleCategory, setRoleCategory] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [detailedPosition, setDetailedPosition] = useState<string>('CM');

  // Avatar / Profile Picture
  const [avatarMode, setAvatarMode] = useState<'upload' | 'icon'>('icon');
  const [selectedPresetIcon, setSelectedPresetIcon] = useState<string>('icon_star');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [updatedSummary, setUpdatedSummary] = useState<any>(null);

  // Extract teamId from URL hash or query params
  useEffect(() => {
    let resolvedId = '';
    const hash = window.location.hash || '';
    const searchPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.substring(1);
    if (searchPart) {
      const params = new URLSearchParams(searchPart);
      resolvedId = params.get('teamId') || params.get('team') || '';
    }

    if (resolvedId) {
      setTeamId(resolvedId);
      loadTeamAndPlayers(resolvedId);
    } else {
      loadAllTeams();
    }
  }, []);

  const loadTeamAndPlayers = async (id: string) => {
    setIsLoadingData(true);
    try {
      // 1. Fetch team metadata
      let t = await fetchTeamById(id);
      if (!t) {
        const { data } = await supabase.from('teams').select('*').eq('id', id).maybeSingle();
        t = data;
      }
      setTeamInfo(t);

      // 2. Fetch existing players in this team for dropdown
      const { data: players, error } = await supabase
        .from('players')
        .select(`
          id,
          first_name,
          last_name,
          jersey_number,
          position,
          phone,
          preferred_foot,
          team_id,
          profile_id,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            phone,
            role
          )
        `)
        .eq('team_id', id)
        .order('jersey_number', { ascending: true });

      if (error) {
        console.warn('[PlayerUpdateDashboard] Error fetching team players:', error);
      }

      const playerList: ExistingPlayer[] = (players || []).map((p: any) => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      }));

      setTeamPlayers(playerList);

      // Auto-select first player if available and none chosen
      if (playerList.length > 0 && !selectedPlayerId) {
        handleSelectPlayer(playerList[0].id, playerList);
      }
    } catch (err) {
      console.warn('[PlayerUpdateDashboard] Load error:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAllTeams = async () => {
    setIsLoadingData(true);
    try {
      const { data } = await supabase.from('teams').select('id, name, short_name, logo_url').order('name');
      if (data && data.length > 0) {
        setAvailableTeams(data);
        const firstTeamId = data[0].id;
        setTeamId(firstTeamId);
        setTeamInfo(data[0]);
        await loadTeamAndPlayers(firstTeamId);
      }
    } catch (err) {
      console.warn('[PlayerUpdateDashboard] Failed to load teams list:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTeamChange = async (newTeamId: string) => {
    setTeamId(newTeamId);
    setSelectedPlayerId('');
    setSelectedPlayer(null);
    const sel = availableTeams.find((t) => t.id === newTeamId);
    if (sel) setTeamInfo(sel);
    await loadTeamAndPlayers(newTeamId);
  };

  const handleSelectPlayer = (playerId: string, list: ExistingPlayer[] = teamPlayers) => {
    setSelectedPlayerId(playerId);
    const p = list.find((item) => item.id === playerId) || null;
    setSelectedPlayer(p);

    if (p) {
      // Initialize preferred squad name from profile bio or default
      const currentBio = p.profiles?.bio || '';
      setPreferredSquadName(currentBio);

      // Initialize phone
      const currentPhone = p.phone || p.profiles?.phone || '';
      setPhone(currentPhone);

      // Initialize position
      const pos = (p.position || 'MID').toUpperCase();
      if (pos === 'GK' || pos.includes('GOAL')) {
        setRoleCategory('GK');
        setDetailedPosition('GK');
      } else if (pos === 'DEF' || pos === 'DF' || ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) {
        setRoleCategory('DEF');
        setDetailedPosition(['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos) ? pos : 'CB');
      } else if (pos === 'FWD' || pos === 'FW' || ['ST', 'CF', 'LW', 'RW'].includes(pos)) {
        setRoleCategory('FWD');
        setDetailedPosition(['ST', 'CF', 'LW', 'RW'].includes(pos) ? pos : 'ST');
      } else {
        setRoleCategory('MID');
        setDetailedPosition(['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos) ? pos : 'CM');
      }

      // Initialize avatar
      const existingAvatar = p.profiles?.avatar_url || '';
      if (existingAvatar.startsWith('data:image') || existingAvatar.startsWith('http')) {
        setAvatarMode('upload');
        setUploadedImageUrl(existingAvatar);
      } else if (existingAvatar.startsWith('icon_')) {
        setAvatarMode('icon');
        setSelectedPresetIcon(existingAvatar);
      }
    }
  };

  const handleRoleCategoryChange = (category: 'GK' | 'DEF' | 'MID' | 'FWD') => {
    setRoleCategory(category);
    const defaultPos = POSITION_CATEGORIES.find((c) => c.key === category)?.defaultDetail || 'CM';
    setDetailedPosition(defaultPos);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setUploadedImageUrl(result);
          setAvatarMode('upload');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPlayer) {
      setErrorMsg('Please select your name from the team roster list.');
      return;
    }

    if (!preferredSquadName.trim()) {
      setErrorMsg('Please enter your preferred squad name (what people know you as).');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please provide your phone or WhatsApp number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine final avatar string: uploaded image or preset icon
      const finalAvatar = avatarMode === 'upload' ? uploadedImageUrl : selectedPresetIcon;

      // Update player info atomically in database by UID
      const res = await updatePlayerInfo({
        playerId: selectedPlayer.id,
        teamId,
        preferredSquadName: preferredSquadName.trim(),
        phone: phone.trim(),
        position: roleCategory,
        photoUrl: finalAvatar || undefined,
        profileId: selectedPlayer.profile_id,
      });

      if (!res.success && res.error) {
        throw new Error(res.error);
      }

      const officialFullName = [selectedPlayer.first_name, selectedPlayer.last_name].filter(Boolean).join(' ') || `Player #${selectedPlayer.jersey_number || '?'}`;

      setUpdatedSummary({
        officialName: officialFullName,
        preferredSquadName: preferredSquadName.trim(),
        teamName: teamInfo?.name || 'Selected Team',
        jersey: selectedPlayer.jersey_number,
        position: detailedPosition,
        role: roleCategory,
        phone: phone.trim(),
        avatar: finalAvatar,
        avatarMode,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update squad information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentOfficialName = selectedPlayer
    ? [selectedPlayer.first_name, selectedPlayer.last_name].filter(Boolean).join(' ') || `Player #${selectedPlayer.jersey_number || '?'}`
    : '';

  // Success view with updated squad card preview
  if (isSuccess && updatedSummary) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#161B22] border border-emerald-500/40 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Squad Profile Updated!</h2>
            <p className="text-xs text-slate-300">
              Your details for <strong className="text-emerald-400">{updatedSummary.teamName}</strong> are active on the roster.
            </p>
          </div>

          {/* Player Squad Badge Card */}
          <div className="bg-[#0D1117] border border-[#2A3441] rounded-2xl p-4 text-xs space-y-3 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-[#2A3441]">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-700">
                {updatedSummary.avatarMode === 'upload' && updatedSummary.avatar ? (
                  <img src={updatedSummary.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">
                    {AVATAR_ICON_PRESETS.find((p) => p.id === updatedSummary.avatar)?.emoji || '⚽'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Preferred Squad Name</div>
                <div className="text-sm font-black text-white truncate">{updatedSummary.preferredSquadName}</div>
                <div className="text-[11px] text-slate-400 truncate">Official: {updatedSummary.officialName}</div>
              </div>
              {updatedSummary.jersey && (
                <div className="text-right shrink-0">
                  <span className="text-base font-black font-mono text-emerald-400">#{updatedSummary.jersey}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Position</span>
                <span className="text-emerald-400 font-bold">{updatedSummary.position} ({updatedSummary.role})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Contact</span>
                <span className="text-slate-200 font-bold truncate block">{updatedSummary.phone}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2A3441] flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Roster Status:</span>
              <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Active & Verified</span>
              </span>
            </div>
          </div>

          <p className="text-[11.5px] text-slate-400 leading-relaxed">
            Your coach can now see your preferred squad name on the tactics board, match lineups, and team roster.
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('/home');
                else window.location.hash = '/home';
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Matchdays & Live Scores</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="w-full py-2.5 bg-[#0D1117] hover:bg-[#1C2331] text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-[#2A3441] transition-all cursor-pointer"
            >
              Make Another Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-lg w-full mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/home');
              else window.location.hash = '/home';
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to LiveScore</span>
          </button>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest font-black flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Squad Profile Update</span>
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Team Branding Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-[#2A3441]">
            <div className="w-14 h-14 rounded-2xl bg-[#0D1117] border border-[#2A3441] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              {teamInfo?.logo_url ? (
                <img src={teamInfo.logo_url} alt={teamInfo.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-7 h-7 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Official Player Update Portal
              </span>
              <h1 className="text-xl font-black text-white truncate">
                {teamInfo?.name || 'Egerton Squad Update'}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                Update your preferred squad name, phone, playing position & avatar
              </p>
            </div>
          </div>

          {/* Team Selector if not tied to specific teamId */}
          {availableTeams.length > 1 && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Select Team</label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.short_name || 'CLUB'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoadingData ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading Squad Roster...</span>
            </div>
          ) : teamPlayers.length === 0 ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>No athletes registered on squad roster yet</span>
              </div>
              <p className="text-slate-400">
                Please ask your coach to register your name first in the Coach Dashboard, then return to update your squad details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* STEP 1: Select Player Name from Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select Your Name from Roster</span>
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => handleSelectPlayer(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Select Your Name --</option>
                  {teamPlayers.map((p) => {
                    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || `Player #${p.jersey_number || '?'}`;
                    const jersey = p.jersey_number ? `#${p.jersey_number}` : 'No #';
                    const pos = p.position || 'Player';
                    return (
                      <option key={p.id} value={p.id}>
                        {name} ({jersey} • {pos})
                      </option>
                    );
                  })}
                </select>
                <span className="text-[11px] text-slate-400 block">
                  Select your name to link this update directly to your student record.
                </span>
              </div>

              {/* STEP 2: Official Registered Name (Unchangeable) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Official Registered Name (Unchangeable)</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">Locked</span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={currentOfficialName || 'No player selected'}
                  className="w-full bg-[#0D1117]/60 border border-[#2A3441] rounded-xl px-3 py-2 text-slate-400 font-bold cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  🔒 Your registered official name is locked to preserve academic and league records.
                </span>
              </div>

              {/* STEP 3: Preferred Squad Name */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Preferred Squad Name (What people know you as) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oliech, Mariga, Drogba, El Niño"
                  value={preferredSquadName}
                  onChange={(e) => setPreferredSquadName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2.5 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <span className="text-[11px] text-slate-400 block">
                  This preferred name will be displayed on the squad list, tactics board, and match scoreboards.
                </span>
              </div>

              {/* STEP 4: Phone / WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Phone / WhatsApp Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl pl-9 pr-3 py-2.5 text-white font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* STEP 5: Playing Position & Role (Goalkeeper to Striker) */}
              <div className="space-y-2 pt-2 border-t border-[#2A3441]/60">
                <label className="block text-slate-300 font-bold">
                  Playing Position & Role <span className="text-rose-400">*</span>
                </label>

                {/* Main Role Category Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {POSITION_CATEGORIES.map((cat) => {
                    const isSelected = roleCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleRoleCategoryChange(cat.key as any)}
                        className={`py-2 px-2 rounded-xl font-bold text-center text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-[#0D1117] border-[#2A3441] text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Specific Position Selection */}
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-bold text-slate-400">
                    Specific Tactical Position (from Goalkeeper to Striker)
                  </label>
                  <select
                    value={detailedPosition}
                    onChange={(e) => setDetailedPosition(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {(DETAILED_POSITIONS[roleCategory] || []).map((pos) => (
                      <option key={pos.code} value={pos.code}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 6: Profile Picture / Avatar Selection */}
              <div className="space-y-3 pt-2 border-t border-[#2A3441]/60">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold">Profile Picture / Avatar</label>
                  <div className="flex items-center gap-1 bg-[#0D1117] border border-[#2A3441] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setAvatarMode('icon')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        avatarMode === 'icon'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Use Icon
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarMode('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        avatarMode === 'upload'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload Photo
                    </button>
                  </div>
                </div>

                {avatarMode === 'icon' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {AVATAR_ICON_PRESETS.map((preset) => {
                        const isChosen = selectedPresetIcon === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedPresetIcon(preset.id)}
                            className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-gradient-to-b ' + preset.bg + ' border-white text-white scale-105 shadow-md'
                                : 'bg-[#0D1117] border-[#2A3441] text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <span className="text-xl">{preset.emoji}</span>
                            <span className="text-[10px] font-bold truncate max-w-full">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Choose an athletic squad icon to represent your profile on match sheets and lineups.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#0D1117] border border-[#2A3441] flex items-center justify-center overflow-hidden shrink-0">
                        {uploadedImageUrl ? (
                          <img src={uploadedImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-[#0D1117] hover:bg-[#1C2331] text-white border border-[#2A3441] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{uploadedImageUrl ? 'Change Photo' : 'Select Photo from Device'}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block">
                          PNG, JPG, or WebP up to 5MB.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedPlayer}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Squad Profile Updates...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Squad Information</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistrationPage;
