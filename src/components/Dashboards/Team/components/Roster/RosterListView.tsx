import React, { useState, useRef } from 'react';
import { Search, UserPlus, Shield, Star } from 'lucide-react';
import type { Player, UserRole, PlayerPosition } from '../../types';
import { KitsSection } from '../Kits/KitsSection';

interface RosterListViewProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  positionFilter: string;
  setPositionFilter: (pos: string) => void;
  currentRole: UserRole;
  onOpenInviteModal: () => void;
  filteredRoster: Player[];
  startingXI: number[];
  roster: Player[];
  onUpdatePlayerStatus: (playerId: string, status: 'Fit' | 'Active' | 'Injured' | 'Suspended' | 'Recovering') => void;
  onUploadPlayerImage?: (playerId: string, imageUrl: string) => void;
  teamId?: string;
  onShowToast?: (msg: string) => void;
}

export const RosterListView: React.FC<RosterListViewProps> = ({
  searchTerm,
  setSearchTerm,
  positionFilter,
  setPositionFilter,
  currentRole,
  onOpenInviteModal,
  filteredRoster,
  startingXI,
  roster,
  onUpdatePlayerStatus,
  onUploadPlayerImage,
  teamId,
  onShowToast,
}) => {
  const isCoach = currentRole === 'COACH';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPlayerForImage, setSelectedPlayerForImage] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedPlayerForImage) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      if (onUploadPlayerImage) {
        onUploadPlayerImage(selectedPlayerForImage, imageUrl);
      }
      setSelectedPlayerForImage(null);
    }
  };

  const getPositionColor = (pos: PlayerPosition) => {
    switch (pos) {
      case 'GK':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DF':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'MD':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'FW':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-12">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* 1. EMBEDDED CONVENIENTLY COMPACT KITS SECTION */}
      <KitsSection currentRole={currentRole} teamId={teamId} onShowToast={onShowToast} />

      {/* 2. INTEGRATED PLAYERS LIST SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A3441] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <span>Players List & Trading Cards</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {roster.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Player athletic profiles, EA-style rating cards, and squad availability statuses.
          </p>
        </div>

        {/* Invite Player Action Button */}
        <button
          onClick={onOpenInviteModal}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Player</span>
        </button>
      </div>

      {/* 3. SEARCH & POSITION FILTER BAR */}
      <div className="bg-[#161B22] p-4 rounded-2xl border border-[#2A3441] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player by name or jersey number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-[#0D1117] border border-[#2A3441] rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Positions (GK, DF, MD, FW)</option>
            <option value="GK">Goalkeepers (GK)</option>
            <option value="DF">Defenders (DF)</option>
            <option value="MD">Midfielders (MD)</option>
            <option value="FW">Forwards (FW)</option>
          </select>
        </div>
      </div>

      {/* 4. COMPACT FOOTBALL PLAYER CARDS GRID (MINIMAL, ELEGANT, JUST NAME, RATING, POSITION, NUMBER) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredRoster.map((player) => {
          const isStarting = startingXI.includes(roster.findIndex((p) => p.id === player.id));
          return (
            <div
              key={player.id}
              className="relative rounded-2xl bg-gradient-to-b from-[#1C2331] via-[#161B22] to-[#0D1117] border border-[#2A3441] p-3 shadow-md hover:border-emerald-500/50 transition-all space-y-2 group overflow-hidden flex flex-col justify-between"
            >
              {/* Top Row: Rating, Position & Jersey Number */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {/* Rating Badge */}
                  <div className="px-2 py-0.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black font-mono text-xs shadow-xs flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-slate-950" />
                    <span>{player.rating}</span>
                  </div>

                  {/* Position Pill */}
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase border ${getPositionColor(player.position)}`}>
                    {player.position}
                  </span>
                </div>

                <span className="font-mono font-black text-xs text-slate-400">#{player.number}</span>
              </div>

              {/* Player Portrait & Name */}
              <div className="flex flex-col items-center text-center pt-1 space-y-1.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-800 border border-[#2A3441] shrink-0 shadow-sm group-hover:border-emerald-400 transition-colors">
                  <img src={player.cardImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt={player.name} className="w-full h-full object-cover" />
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-xs text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">
                    {player.name}
                  </h3>
                  {isStarting && (
                    <span className="text-[8.5px] font-black uppercase text-emerald-400 block mt-0.5">
                      Starting XI
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Status Pill / Quick Update */}
              <div className="pt-1 border-t border-[#2A3441]/60 flex items-center justify-between text-[10px]">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                  player.status === 'Fit' || player.status === 'Active'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : player.status === 'Recovering'
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {player.status}
                </span>

                <select
                  value={player.status}
                  onChange={(e) => onUpdatePlayerStatus(player.id, e.target.value as any)}
                  className="bg-[#0D1117] border border-[#2A3441] text-slate-300 text-[9px] font-bold rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Fit">Fit</option>
                  <option value="Recovering">Rec</option>
                  <option value="Injured">Inj</option>
                  <option value="Suspended">Susp</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
