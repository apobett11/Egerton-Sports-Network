import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchTeamById, updatePlayerInfo, fetchTeamBySlugOrName } from '../../components/Dashboards/Team/lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import {
  Shield,
  ArrowLeft,
  Loader2,
  Camera,
  User,
  AlertCircle,
  Upload,
  Sparkles
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
  { key: 'FWD', label: 'Striker', defaultDetail: 'ST' },
];

const DETAILED_POSITIONS: Record<string, { code: string; name: string }[]> = {
  GK: [{ code: 'GK', name: 'Goalkeeper (GK)' }],
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
  const toast = (() => {
    try {
      return useToast();
    } catch {
      return null;
    }
  })();

  const [teamId, setTeamId] = useState<string>('');
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<ExistingPlayer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Player Selection (NO pre-selected player)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<ExistingPlayer | null>(null);

  // Form Fields
  const [preferredSquadName, setPreferredSquadName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [roleCategory, setRoleCategory] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [detailedPosition, setDetailedPosition] = useState<string>('CM');

  // Avatar / Profile Picture (Default is 'upload')
  const [avatarMode, setAvatarMode] = useState<'upload' | 'icon'>('upload');
  const [selectedPresetIcon, setSelectedPresetIcon] = useState<string>('icon_star');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Extract team name slug or query params (never requires or exposes UID)
  useEffect(() => {
    let teamParam = '';
    const hash = window.location.hash || '';
    const searchPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.substring(1);
    if (searchPart) {
      const params = new URLSearchParams(searchPart);
      teamParam = params.get('team') || params.get('teamId') || '';
    }

    if (teamParam) {
      loadTeamAndPlayers(teamParam);
    } else {
      loadAllTeams();
    }
  }, []);

  const loadTeamAndPlayers = async (slugOrId: string) => {
    setIsLoadingData(true);
    try {
      let t = await fetchTeamBySlugOrName(slugOrId);
      if (!t) {
        t = await fetchTeamById(slugOrId);
      }
      if (!t) {
        const { data } = await supabase.from('teams').select('*').eq('id', slugOrId).maybeSingle();
        t = data;
      }

      if (t) {
        setTeamId(t.id);
        setTeamInfo(t);

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
          .eq('team_id', t.id)
          .order('jersey_number', { ascending: true });

        if (error) {
          console.warn('[PlayerUpdate] Error loading players:', error);
        }

        const playerList: ExistingPlayer[] = (players || []).map((p: any) => ({
          ...p,
          profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        }));

        setTeamPlayers(playerList);
      } else {
        await loadAllTeams();
      }
    } catch (err) {
      console.warn('[PlayerUpdate] Load error:', err);
      await loadAllTeams();
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
      console.warn('[PlayerUpdate] Failed to load teams:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTeamChange = async (newTeamId: string) => {
    setTeamId(newTeamId);
    setSelectedPlayerId('');
    setSelectedPlayer(null);
    setPreferredSquadName('');
    setPhone('');
    const sel = availableTeams.find((t) => t.id === newTeamId);
    if (sel) setTeamInfo(sel);
    await loadTeamAndPlayers(newTeamId);
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    const p = teamPlayers.find((item) => item.id === playerId) || null;
    setSelectedPlayer(p);

    if (p) {
      setPreferredSquadName(p.profiles?.bio || '');
      setPhone(p.phone || p.profiles?.phone || '');

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

      const existingAvatar = p.profiles?.avatar_url || '';
      if (existingAvatar.startsWith('data:image') || existingAvatar.startsWith('http')) {
        setAvatarMode('upload');
        setUploadedImageUrl(existingAvatar);
      } else if (existingAvatar.startsWith('icon_')) {
        setAvatarMode('icon');
        setSelectedPresetIcon(existingAvatar);
      }
    } else {
      setPreferredSquadName('');
      setPhone('');
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
      setErrorMsg('Please select your name from the dropdown.');
      return;
    }

    if (!preferredSquadName.trim()) {
      setErrorMsg('Please enter your preferred squad name.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalAvatar = avatarMode === 'upload' ? uploadedImageUrl : selectedPresetIcon;

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

      // Show toast
      if (toast?.showSuccess) {
        toast.showSuccess('Player information updated successfully!');
      }

      // Direct to guest page
      if (onNavigate) {
        onNavigate('/home');
      } else {
        window.location.hash = '/home';
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update information. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 flex flex-col justify-start py-8 px-4 sm:px-6">
      <div className="max-w-lg w-full mx-auto space-y-4">
        {/* Back Link */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/home');
              else window.location.hash = '/home';
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to LiveScore</span>
          </button>
        </div>

        {/* Minimalist Google Form Header Card */}
        <div className="bg-[#161B22] border-t-4 border-t-emerald-500 border-x border-b border-[#2A3441] rounded-2xl p-6 shadow-xl space-y-2">
          <div className="flex items-center gap-3">
            {teamInfo?.logo_url ? (
              <img src={teamInfo.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-[#2A3441]" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-white">
                {teamInfo?.name || 'Player Information Update'}
              </h1>
              <p className="text-xs text-slate-400">
                Update your squad profile information
              </p>
            </div>
          </div>

          {availableTeams.length > 1 && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Team</label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
            <span className="text-xs font-semibold">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question 1: Select your name */}
            <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                Select your name <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => handleSelectPlayer(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                required
              >
                <option value="" disabled>Select your name</option>
                {teamPlayers.map((p) => {
                  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || `Player #${p.jersey_number || '?'}`;
                  const jersey = p.jersey_number ? `#${p.jersey_number}` : '';
                  return (
                    <option key={p.id} value={p.id}>
                      {name} {jersey ? `(${jersey})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Question 2: Preferred squad name */}
            <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                Preferred squad name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="What people know you as"
                value={preferredSquadName}
                onChange={(e) => setPreferredSquadName(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Question 3: Phone number */}
            <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                Phone number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Question 4: Playing position */}
            <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                Playing position <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {POSITION_CATEGORIES.map((cat) => {
                  const isSelected = roleCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleRoleCategoryChange(cat.key as any)}
                      className={`py-2 px-2 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-[#0D1117] border-[#2A3441] text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <select
                value={detailedPosition}
                onChange={(e) => setDetailedPosition(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {(DETAILED_POSITIONS[roleCategory] || []).map((pos) => (
                  <option key={pos.code} value={pos.code}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question 5: Profile photo (Default: Upload photo) */}
            <div className="bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  Profile photo
                </label>
                <button
                  type="button"
                  onClick={() => setAvatarMode(avatarMode === 'upload' ? 'icon' : 'upload')}
                  className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  {avatarMode === 'upload' ? 'Or choose icon' : 'Upload photo instead'}
                </button>
              </div>

              {avatarMode === 'upload' ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0D1117] border border-[#2A3441] flex items-center justify-center overflow-hidden shrink-0">
                      {uploadedImageUrl ? (
                        <img src={uploadedImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-[#0D1117] hover:bg-[#1C2331] text-white border border-[#2A3441] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{uploadedImageUrl ? 'Change photo' : 'Upload photo'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {AVATAR_ICON_PRESETS.map((preset) => {
                    const isChosen = selectedPresetIcon === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetIcon(preset.id)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          isChosen
                            ? 'bg-gradient-to-b ' + preset.bg + ' border-white text-white scale-105'
                            : 'bg-[#0D1117] border-[#2A3441] text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-lg">{preset.emoji}</span>
                        <span className="text-[10px] font-medium">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Final Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedPlayer}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Player Information</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlayerRegistrationPage;
