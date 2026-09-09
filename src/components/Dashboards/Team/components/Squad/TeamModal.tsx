import React, { useState, useRef } from 'react';
import { Player, TeamData, FormationType, Playstyle, InMatchRoles } from './types';
import { Crown, Check, Upload, Shield, Zap, Sparkles, Activity, Image, ChevronDown, X, Sparkle, Target, CornerDownRight } from 'lucide-react';
import { FORMATIONS } from './initialData';

const SAMPLE_CRESTS = [
  { name: 'Egerton FC', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80' },
  { name: 'Red Lions', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80' },
  { name: 'Blue Hawks', url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80' },
  { name: 'Golden Eagles', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80' },
  { name: 'Green Warriors', url: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100&auto=format&fit=crop&q=80' },
  { name: 'Royal Strikers', url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80' },
];

const PLAYSTYLES: Playstyle[] = [
  'Possession Game',
  'Quick Counter',
  'Long Ball Counter',
  'Out Wide',
  'Long Ball',
];

const FORMATIONS_LIST: FormationType[] = [
  '4-4-1-1',
  '4-3-3',
  '4-2-1-3',
  '4-2-2-2',
  '3-2-4-1',
];

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectiveStrength: number;
  players: Player[];
  teamName: string;
  teamCrest: string;
  currentTeamId: string;
  teamsList: TeamData[];
  onSelectTeam: (teamId: string) => void;
  onSetCaptain: (playerId: string) => void;
  inMatchRoles?: InMatchRoles;
  onUpdateInMatchRoles?: (roles: InMatchRoles) => void;
  onUploadCrest?: (file: File) => Promise<void> | void;
  onSelectSampleCrest?: (url: string) => void;
  formation?: FormationType | string;
  playstyle?: Playstyle | string;
  onSelectFormation?: (formation: FormationType) => void;
  onSelectPlaystyle?: (playstyle: Playstyle) => void;
  onAutoPick?: () => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  collectiveStrength,
  players,
  teamName,
  teamCrest,
  currentTeamId,
  teamsList,
  onSelectTeam,
  onSetCaptain,
  inMatchRoles = {
    captainId: players[0]?.id || '',
    cornerTakerId: players[1]?.id || '',
    rightFreeKickTakerId: players[2]?.id || '',
    leftFreeKickTakerId: players[3]?.id || '',
    penaltyTakerId: players[0]?.id || '',
  },
  onUpdateInMatchRoles,
  onUploadCrest,
  onSelectSampleCrest,
  formation = '4-3-3',
  playstyle = 'Possession Game',
  onSelectFormation,
  onSelectPlaystyle,
  onAutoPick,
  isCoach = true,
  onPermissionDenied,
}) => {
  const [subView, setSubView] = useState<'main' | 'roles' | 'sample_crests' | 'formation_playstyle' | 'teams'>('main');
  const [activeRoleDropdown, setActiveRoleDropdown] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentCaptain = players.find((p) => p.isCaptain) || players[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCoach) {
      if (onPermissionDenied) {
        onPermissionDenied('Permission Denied: Only Head Coach can upload team crest.');
      }
      return;
    }
    const file = e.target.files?.[0];
    if (file && onUploadCrest) {
      setIsUploading(true);
      try {
        await onUploadCrest(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSelectRolePlayer = (roleKey: keyof InMatchRoles, playerId: string) => {
    if (!isCoach) {
      if (onPermissionDenied) {
        onPermissionDenied('Permission Denied: Only Head Coach can assign in-match roles.');
      }
      return;
    }
    const updatedRoles = {
      ...inMatchRoles,
      [roleKey]: playerId,
    };
    if (roleKey === 'captainId') {
      onSetCaptain(playerId);
    }
    if (onUpdateInMatchRoles) {
      onUpdateInMatchRoles(updatedRoles);
    }
    // Only collapse the player dropdown so coach can select another role
    setActiveRoleDropdown(null);
  };

  const getPlayerName = (id: string, fallbackIdx = 0) => {
    const found = players.find((p) => p.id === id);
    if (found) return found.name;
    return players[fallbackIdx]?.name || 'Unassigned';
  };

  const roleDefinitions = [
    { key: 'captainId' as keyof InMatchRoles, label: 'Team Captain', icon: Crown, color: 'text-amber-400' },
    { key: 'cornerTakerId' as keyof InMatchRoles, label: 'Corner Taker', icon: CornerDownRight, color: 'text-blue-400' },
    { key: 'rightFreeKickTakerId' as keyof InMatchRoles, label: 'Right Free-kick Taker', icon: Target, color: 'text-emerald-400' },
    { key: 'leftFreeKickTakerId' as keyof InMatchRoles, label: 'Left Free-kick Taker', icon: Target, color: 'text-cyan-400' },
    { key: 'penaltyTakerId' as keyof InMatchRoles, label: 'Penalty Taker', icon: Zap, color: 'text-rose-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-100">
      {/* Hidden file input for crest upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[620px] max-h-[90vh] bg-[#0F172A] rounded-[24px] overflow-hidden shadow-2xl text-slate-100 border border-[#2A3B5C] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#1E293B]">
          <h2 className="text-[19px] font-black tracking-tight text-white font-sans flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>
              {subView === 'roles'
                ? 'In-Match Roles & Captaincy'
                : subView === 'sample_crests'
                ? 'Choose Team Crest from Sample'
                : subView === 'formation_playstyle'
                ? 'Formation & Tactical Playstyle'
                : subView === 'teams'
                ? 'Select Team Preset'
                : `${teamName} Game Plan`}
            </span>
          </h2>
          <button
            onClick={() => {
              if (subView !== 'main') {
                setSubView('main');
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#334155] text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        {subView === 'main' ? (
          <div className="px-6 pb-6 pt-4 grid grid-cols-12 gap-6 items-center overflow-y-auto">
            {/* Left Column: Crest, Game Plan title, Strength, Upload Option */}
            <div className="col-span-5 flex flex-col items-center text-center">
              {/* Team Crest with options */}
              <div className="relative group w-[92px] h-[92px] mb-2 p-2 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center shadow-md">
                <img
                  src={teamCrest}
                  alt={teamName}
                  className="w-full h-full object-contain drop-shadow-md pointer-events-none"
                />
              </div>

              {/* Icon Change Controls: Upload or Sample */}
              {isCoach && (
                <div className="flex items-center gap-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload photo"
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubView('sample_crests')}
                    title="Choose from sample icons"
                    className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-blue-500/30"
                  >
                    <Image className="w-3 h-3 text-blue-400" />
                    <span>Samples</span>
                  </button>
                </div>
              )}

              {/* Game Plan Title */}
              <h3 className="text-[16px] font-black text-white mb-0.5 font-sans">
                {teamName}
              </h3>
              <p className="text-[11px] text-emerald-400 font-bold mb-2">
                {formation} • {playstyle}
              </p>

              {/* Collective Strength & Auto-Optimize */}
              <div className="bg-[#1E293B]/70 p-2.5 rounded-xl border border-[#334155] w-full space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Collective Strength
                  </span>
                  <span className="font-efootball-num font-black text-[28px] text-[#e6ff00] leading-none block mt-0.5">
                    {collectiveStrength}
                  </span>
                </div>

                {isCoach && onAutoPick && (
                  <button
                    type="button"
                    onClick={onAutoPick}
                    className="w-full py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Sparkle className="w-3 h-3 text-amber-400" />
                    <span>Auto-Optimize</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Menu Actions */}
            <div className="col-span-7 flex flex-col divide-y divide-[#1E293B] border-l border-[#1E293B] pl-6">
              {/* 1. In-Match Roles & Captaincy */}
              <button
                onClick={() => setSubView('roles')}
                className="flex items-center gap-3.5 py-3.5 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-black text-white group-hover:text-blue-400 transition-colors truncate">
                    In-Match Roles & Captaincy
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    Captain: {getPlayerName(inMatchRoles.captainId, 0)}
                  </span>
                </div>
              </button>

              {/* 2. Formation and Playstyle */}
              <button
                onClick={() => setSubView('formation_playstyle')}
                className="flex items-center gap-3.5 py-3.5 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-black text-white group-hover:text-blue-400 transition-colors truncate">
                    Formation & Playstyle
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    {formation} • {playstyle}
                  </span>
                </div>
              </button>

              {/* 3. Choose from Sample Icons */}
              <button
                onClick={() => setSubView('sample_crests')}
                className="flex items-center gap-3.5 py-3.5 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Image className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                    Change Team Icon / Crest
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    Choose from sample or upload badge
                  </span>
                </div>
              </button>

              {/* 4. Base Team Presets */}
              <button
                onClick={() => setSubView('teams')}
                className="flex items-center gap-3.5 py-3.5 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-black text-white group-hover:text-purple-400 transition-colors truncate">
                    Base Team Presets
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    Preloaded setups & tactics
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : subView === 'roles' ? (
          /* IN-MATCH ROLES MODULE WITH 11-PLAYER DROPDOWNS & AUTO-CLOSE */
          <div className="px-6 pb-6 pt-3 flex flex-col max-h-[75vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#1E293B]">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Assign In-Match Roles (Starting XI)
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2.5">
              {roleDefinitions.map((role) => {
                const isExpanded = activeRoleDropdown === role.key;
                const assignedPlayerId = inMatchRoles[role.key];
                const currentPlayerName = getPlayerName(assignedPlayerId);
                const IconComp = role.icon;

                return (
                  <div
                    key={role.key}
                    className="bg-[#1E293B]/70 border border-[#334155] rounded-xl p-3 transition-all"
                  >
                    {/* Role Header (Shows option & current player when not selected) */}
                    <button
                      type="button"
                      onClick={() => setActiveRoleDropdown(isExpanded ? null : role.key)}
                      className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <IconComp className={`w-4 h-4 ${role.color}`} />
                        </div>
                        <div>
                          <span className="text-[13px] font-bold text-white block">{role.label}</span>
                          <span className="text-[11px] text-blue-400 font-semibold block">
                            Current: {currentPlayerName}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown of First 11 Players */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#334155] grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-in fade-in duration-100 max-h-48 overflow-y-auto">
                        {players.slice(0, 11).map((player) => {
                          const isAssigned = assignedPlayerId === player.id;
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => handleSelectRolePlayer(role.key, player.id)}
                              className={`p-2 rounded-lg text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                                isAssigned
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-slate-400">#{player.number}</span>
                                <span className="truncate">{player.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">{player.position}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: Back to main or Done */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubView('main')}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#00b04f] hover:bg-[#009944] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : subView === 'formation_playstyle' ? (
          /* FORMATION AND PLAYSTYLE SELECTOR WITH AUTO-CLOSE */
          <div className="px-6 pb-6 pt-3 flex flex-col max-h-[75vh] overflow-y-auto space-y-4">
            {/* Formations List */}
            <div>
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                Select Formation (Auto-Applies & Closes)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FORMATIONS_LIST.map((f) => {
                  const template = FORMATIONS[f];
                  const isSelected = formation === f;
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        if (!isCoach) {
                          if (onPermissionDenied) onPermissionDenied('Only Coach can change formation.');
                          return;
                        }
                        if (onSelectFormation) onSelectFormation(f);
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'border-[#0077ff] bg-[#0077ff]/20 text-[#00a8ff] font-bold shadow-md ring-2 ring-[#0077ff]/30'
                          : 'border-[#334155] bg-[#1E293B]/50 hover:bg-[#1E293B] text-slate-200'
                      }`}
                    >
                      <div className="relative w-full h-[48px] bg-[#0c2411] rounded-md overflow-hidden border border-emerald-800/40">
                        {template?.coords.map((slot, idx) => (
                          <div
                            key={idx}
                            style={{
                              left: `${slot.x}%`,
                              top: `${slot.y}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className={`absolute w-1.5 h-1.5 rounded-full ${
                              slot.position === 'GK' ? 'bg-amber-400' : isSelected ? 'bg-[#00d2ff]' : 'bg-white'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between w-full px-1">
                        <span className="text-xs font-bold">{f}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#00a8ff]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playstyles List */}
            <div className="pt-2 border-t border-[#1E293B]">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                Select Tactical Playstyle (Auto-Applies & Closes)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PLAYSTYLES.map((p) => {
                  const isSelected = playstyle === p;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        if (!isCoach) {
                          if (onPermissionDenied) onPermissionDenied('Only Coach can change playstyle.');
                          return;
                        }
                        if (onSelectPlaystyle) onSelectPlaystyle(p);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer ${
                        isSelected
                          ? 'border-[#0077ff] bg-[#0077ff]/20 text-[#00a8ff] font-bold shadow-sm'
                          : 'border-[#334155] bg-[#1E293B]/50 hover:bg-[#1E293B] text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-semibold">{p}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#00a8ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : subView === 'sample_crests' ? (
          /* SAMPLE CRESTS GALLERY */
          <div className="px-6 pb-6 pt-3 flex flex-col max-h-[75vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Choose from Sample Club Icons
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Or Upload Custom File</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SAMPLE_CRESTS.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => {
                    if (onSelectSampleCrest) {
                      onSelectSampleCrest(sample.url);
                    }
                    setSubView('main');
                  }}
                  className="p-3 bg-[#1E293B]/60 border border-[#334155] hover:border-blue-500 rounded-xl flex flex-col items-center gap-2.5 transition-all active:scale-95 cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-800 p-2 flex items-center justify-center">
                    <img src={sample.url} alt={sample.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    {sample.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Base Team Presets */
          <div className="px-6 pb-6 pt-3 flex flex-col max-h-[75vh] overflow-y-auto space-y-3">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Choose Preloaded Team Setup
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamsList.map((t) => {
                const isSelected = t.id === currentTeamId;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTeam(t.id);
                      setSubView('main');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/15 text-blue-400 font-bold shadow-md'
                        : 'border-[#1E293B] hover:border-slate-500 bg-[#1E293B]/40 text-slate-200 hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center p-1 bg-slate-800 rounded-lg">
                      <img src={t.crestUrl} alt={t.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13.5px] font-bold truncate text-white">{t.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {t.manager.name} • {t.formation}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamModal;


