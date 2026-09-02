import React, { useState, useRef } from 'react';
import { Player, TeamData, FormationType, Playstyle } from './types';
import { Crown, Check, Upload, Shield, Zap, Sparkles, Activity } from 'lucide-react';

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
  onUploadCrest?: (file: File) => Promise<void>;
  formation?: FormationType | string;
  playstyle?: Playstyle | string;
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
  onUploadCrest,
  formation = '4-3-3',
  playstyle = 'Possession Game',
  isCoach = true,
  onPermissionDenied,
}) => {
  const [subView, setSubView] = useState<'main' | 'roles' | 'teams' | 'tactics'>('main');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentCaptain = players.find((p) => p.isCaptain) || players[0];

  const handleOpenTeams = () => {
    if (!isCoach) {
      if (onPermissionDenied) {
        onPermissionDenied('Permission Denied: Only Head Coach can change team presets.');
      }
      return;
    }
    setSubView('teams');
  };

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
      <div className="relative w-full max-w-[620px] bg-[#0F172A] rounded-[24px] overflow-hidden shadow-2xl text-slate-100 border border-[#2A3B5C] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#1E293B]">
          <h2 className="text-[20px] font-black tracking-tight text-white font-sans flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>
              {subView === 'roles'
                ? 'In-Match Roles & Captaincy'
                : subView === 'teams'
                ? 'Select Team Preset'
                : subView === 'tactics'
                ? 'Tactical Game Plan & Playstyle'
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
            className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#334155] text-blue-400 flex items-center justify-center transition-colors shadow-sm focus:outline-none active:scale-90 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-blue-400 stroke-[2.8]">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {subView === 'main' ? (
          <div className="px-6 pb-6 pt-3 grid grid-cols-12 gap-6 items-center">
            {/* Left Column: Crest, Game Plan title, Strength, Upload Option */}
            <div className="col-span-5 flex flex-col items-center text-center">
              {/* Team Crest with hover upload overlay */}
              <div className="relative group w-[90px] h-[90px] mb-2 p-1.5 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center shadow-md">
                <img
                  src={teamCrest}
                  alt={teamName}
                  className="w-full h-full object-contain drop-shadow-md pointer-events-none"
                />
                {isCoach && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload new crest image"
                    className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{isUploading ? 'Uploading...' : 'Change Logo'}</span>
                  </button>
                )}
              </div>

              {/* Game Plan Title */}
              <h3 className="text-[17px] font-black text-white mb-0.5 font-sans">
                {teamName}
              </h3>
              <p className="text-[11px] text-emerald-400 font-bold mb-2">
                {formation} • {playstyle}
              </p>

              {/* Collective Strength */}
              <div className="bg-[#1E293B]/70 p-2.5 rounded-xl border border-[#334155] w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Collective Strength
                </span>
                <span className="font-efootball-num font-black text-[32px] text-[#e6ff00] leading-none block mt-0.5">
                  {collectiveStrength}
                </span>
              </div>
            </div>

            {/* Right Column: Menu Actions */}
            <div className="col-span-7 flex flex-col divide-y divide-[#1E293B] border-l border-[#1E293B] pl-6">
              {/* 1. In-Match Roles */}
              <button
                onClick={() => setSubView('roles')}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-white group-hover:text-blue-400 transition-colors">
                    In-Match Roles & Captaincy
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Captain: {currentCaptain?.name || 'None appointed'}
                  </span>
                </div>
              </button>

              {/* 2. Tactical Game Plan Info */}
              <button
                onClick={() => setSubView('tactics')}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-white group-hover:text-emerald-400 transition-colors">
                    Formation & Playstyle Details
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formation} ({playstyle})
                  </span>
                </div>
              </button>

              {/* 3. Upload Club Crest / Badge */}
              {isCoach && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3.5 py-3 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-white group-hover:text-amber-400 transition-colors">
                      Upload Team Icon / Crest
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      PNG / JPG Club Badge
                    </span>
                  </div>
                </button>
              )}

              {/* 4. Switch Team Preset */}
              <button
                onClick={handleOpenTeams}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-[#1E293B]/60 rounded-xl px-2.5 -mx-2.5 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-white group-hover:text-purple-400 transition-colors">
                    Base Team Presets
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Load tactical setups & formations
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : subView === 'roles' ? (
          /* In-Match Roles: Assign Captain */
          <div className="px-6 pb-6 pt-2">
            <h4 className="text-[12px] font-black text-slate-400 mb-3 uppercase tracking-wider">
              {isCoach ? 'Select Team Captain (Coach Authority)' : 'Team Captain'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
              {players.map((p) => {
                const isCap = p.isCaptain;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!isCoach) {
                        if (onPermissionDenied) {
                          onPermissionDenied('Permission Denied: Only Head Coach can appoint or change the Team Captain.');
                        }
                        return;
                      }
                      onSetCaptain(p.id);
                      setSubView('main');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all active:scale-95 cursor-pointer ${
                      isCap
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold shadow-sm'
                        : 'border-[#1E293B] hover:border-slate-500 bg-[#1E293B]/50 text-slate-200 hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold truncate text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{p.position} • {p.rating}</span>
                    </div>
                    {isCap && <Crown className="w-4 h-4 ml-auto text-orange-400 fill-orange-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : subView === 'tactics' ? (
          /* Tactics & Playstyle Details */
          <div className="px-6 pb-6 pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#1E293B]/80 border border-[#334155] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Formation</span>
                <span className="text-lg font-black text-white block">{formation}</span>
                <p className="text-[11px] text-emerald-400">Balanced dynamic pitch coordinates</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1E293B]/80 border border-[#334155] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Playstyle</span>
                <span className="text-lg font-black text-white block">{playstyle}</span>
                <p className="text-[11px] text-blue-400">High-tempo tactical build-up</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1E293B]/80 border border-[#334155] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Pitch Dimensions & Auto-Save</span>
                <span className="text-emerald-400">Database Synced</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All changes to player coordinates, starting 11 selections, and substitutions are instantly committed to the database.
              </p>
            </div>
          </div>
        ) : (
          /* Base Team Presets */
          <div className="px-6 pb-6 pt-2">
            <h4 className="text-[12px] font-black text-slate-400 mb-3 uppercase tracking-wider">
              Choose Team Preset
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
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
                    {/* Club Crest */}
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center p-1 bg-slate-800 rounded-lg">
                      <img src={t.crestUrl} alt={t.name} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[14px] font-bold truncate text-white">{t.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {t.manager.name} • {t.formation}
                      </span>
                    </div>

                    {isSelected && <Check className="w-5 h-5 text-blue-400 flex-shrink-0 ml-auto" />}
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

