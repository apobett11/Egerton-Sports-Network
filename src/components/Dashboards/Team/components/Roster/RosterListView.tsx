import React, { useState, useRef } from 'react';
import { Search, UserPlus, MoreVertical, Upload, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Player, UserRole } from '../../types';

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
  onUpdatePlayerStatus: (playerId: string, status: 'Active' | 'Injured' | 'Suspended') => void;
  onUploadPlayerImage?: (playerId: string, imageUrl: string) => void;
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
}) => {
  const isCoach = currentRole === 'COACH';
  const [activeMenuPlayerId, setActiveMenuPlayerId] = useState<string | null>(null);
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

  return (
    <div className="space-y-4">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1F1F1F] p-4 rounded-xl border border-[#2A2A2A]">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player by name or #..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg pl-9 pr-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
            />
          </div>

          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
          >
            <option value="ALL">All Positions</option>
            <option value="GK">GK</option>
            <option value="DF">DF</option>
            <option value="MD">MD</option>
            <option value="FW">FW</option>
          </select>
        </div>

        {/* TASK 11: Replace Add Player with Invite Player */}
        {isCoach && (
          <button
            onClick={onOpenInviteModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Player</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRoster.map(player => {
          const isStarting = startingXI.includes(roster.findIndex(p => p.id === player.id));
          const isMenuOpen = activeMenuPlayerId === player.id;
          const status = player.status || 'Active';

          return (
            <div
              key={player.id}
              className="relative p-3 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 min-h-[44px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-full bg-[#111111] border border-[#2A2A2A] overflow-hidden shrink-0 group">
                  <img
                    src={player.cardImage}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                  {isCoach && (
                    <button
                      onClick={() => {
                        setSelectedPlayerForImage(player.id);
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                      title="Upload Image"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-100 truncate">{player.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      #{player.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] md:text-xs font-medium text-gray-400">
                      Pos: <strong className="text-gray-200">{player.position}</strong>
                    </span>
                    <span className="text-gray-600">•</span>
                    <span
                      className={`text-[11px] md:text-xs font-semibold ${
                        status === 'Fit' || status === 'Active'
                          ? 'text-emerald-400'
                          : status === 'Injured'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="font-mono text-base md:text-lg font-bold text-white">
                    {player.rating}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isStarting ? 'text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {isStarting ? 'XI START' : 'BENCH'}
                  </span>
                </div>

                {/* TASK 10: Replace Delete Icon with Three-Dot Menu */}
                {isCoach && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuPlayerId(isMenuOpen ? null : player.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Player options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Three-Dot Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-12 z-50 w-44 bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 space-y-1 animate-fade-in">
                        <button
                          onClick={() => {
                            onUpdatePlayerStatus(player.id, 'Active');
                            setActiveMenuPlayerId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-[#252525] rounded-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Active</span>
                        </button>

                        <button
                          onClick={() => {
                            onUpdatePlayerStatus(player.id, 'Injured');
                            setActiveMenuPlayerId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-[#252525] rounded-lg transition-colors cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Mark Injured</span>
                        </button>

                        <button
                          onClick={() => {
                            onUpdatePlayerStatus(player.id, 'Suspended');
                            setActiveMenuPlayerId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-[#252525] rounded-lg transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Mark Suspended</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPlayerForImage(player.id);
                            if (fileInputRef.current) fileInputRef.current.click();
                            setActiveMenuPlayerId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-[#252525] rounded-lg transition-colors cursor-pointer border-t border-[#2A2A2A] pt-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span>Upload Image</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RosterListView;
