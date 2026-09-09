import React, { useState, useRef } from 'react';
import { Search, UserPlus, Shield, Star, Trash2, Copy, Check, ExternalLink, MessageCircle, AlertTriangle } from 'lucide-react';
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
  teamName?: string;
  onShowToast?: (msg: string) => void;
  onDeletePlayer?: (playerId: string) => void;
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
  teamName = 'Your Team',
  onShowToast,
  onDeletePlayer,
}) => {
  const isCoach = currentRole === 'COACH';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPlayerForImage, setSelectedPlayerForImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const registrationUrl = `${window.location.origin}/#/register/player?teamId=${teamId || ''}`;
  const whatsappText = `⚽ Official Invitation: Join ${teamName} on Egerton Sports Network!\n\nRegister your player profile here:\n${registrationUrl}\n\nYour profile will appear directly in our squad roster.`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  const handleCopyRegistrationLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopiedLink(true);
      if (onShowToast) onShowToast('📋 Player registration link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      if (onShowToast) onShowToast(`Registration Link: ${registrationUrl}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!playerToDelete || !onDeletePlayer) return;
    setIsDeleting(true);
    try {
      await onDeletePlayer(playerToDelete.id);
      if (onShowToast) onShowToast(`Removed ${playerToDelete.name} from squad.`);
      setPlayerToDelete(null);
    } catch (err: any) {
      if (onShowToast) onShowToast(`Failed to remove player: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

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

      {/* 1.5 DEDICATED TEAM PLAYER REGISTRATION LINK BANNER */}
      <div className="bg-gradient-to-r from-[#161B22] via-[#1C2331] to-[#161B22] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Team Player Registration Link</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Direct Intake Form
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Share this dedicated link with players via WhatsApp or SMS. Submitting the form registers them directly into <strong className="text-emerald-400">{teamName}</strong>'s squad.
          </p>
          <div className="pt-1">
            <code className="text-[11px] font-mono text-slate-400 bg-[#0D1117] px-2.5 py-1 rounded-md border border-[#2A3441] inline-block select-all max-w-full truncate">
              {registrationUrl}
            </code>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopyRegistrationLink}
            className="px-3.5 py-2 bg-[#0D1117] hover:bg-[#2A3441] text-slate-200 text-xs font-bold rounded-xl border border-[#2A3441] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Copy Registration URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            title="Direct Share via WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white text-transparent" />
            <span>Share via WhatsApp</span>
          </a>

          <a
            href={`#/register/player?teamId=${teamId || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open Registration Form"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Form</span>
          </a>
        </div>
      </div>

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

                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-slate-400">#{player.number}</span>
                  {isCoach && onDeletePlayer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayerToDelete(player);
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={`Remove ${player.name} from squad`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
                  data-testid="player-status-select"
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

      {/* Delete Player Confirmation Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161B22] border border-[#2A3441] rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Remove Player from Squad?</h3>
                <p className="text-xs text-slate-400">This will remove the player from your official roster.</p>
              </div>
            </div>

            <div className="p-3 bg-[#0D1117] rounded-xl border border-[#2A3441] text-xs">
              <div className="text-white font-bold">{playerToDelete.name}</div>
              <div className="text-slate-400 text-[11px]">#{playerToDelete.number} • {playerToDelete.position}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2A3441]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlayerToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Remove Player'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

