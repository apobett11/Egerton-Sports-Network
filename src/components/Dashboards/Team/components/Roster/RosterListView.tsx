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

  const getPositionBadgeStyle = (pos: PlayerPosition) => {
    switch (pos) {
      case 'GK':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'DF':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'MD':
        return 'bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30';
      case 'FW':
        return 'bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full select-none pb-16">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* 1. EMBEDDED KITS SECTION (FLASHSCORE STYLE) */}
      <KitsSection currentRole={currentRole} teamId={teamId} onShowToast={onShowToast} />

      {/* 2. DEDICATED TEAM PLAYER REGISTRATION LINK BANNER (FLASHSCORE CARD) */}
      <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00b04f] animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Player Direct Intake & Invitation Link
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f]">
              Self Registration
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Share this link with student-athletes. Form submissions link players automatically to <strong className="text-slate-900 dark:text-white">{teamName}</strong>.
          </p>
          <div className="pt-0.5">
            <code className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-[#f8f9fa] dark:bg-[#112236] px-2 py-0.5 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] inline-block select-all max-w-full truncate">
              {registrationUrl}
            </code>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyRegistrationLink}
            className="px-3.5 py-1.5 bg-[#f8f9fa] dark:bg-[#112236] hover:bg-slate-100 dark:hover:bg-[#152a40] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-full border border-[#e6e8ec] dark:border-[#1a2e45] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00b04f]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-[#00b04f] hover:bg-[#009944] text-white text-xs font-black rounded-full flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`#/register/player?teamId=${teamId || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold rounded-full border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open Form</span>
          </a>
        </div>
      </div>

      {/* 3. ROSTER DIRECTORY HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Players Directory & Squad Cards
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
            {roster.length} Registered
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenInviteModal}
          className="px-4 py-1.5 bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-black rounded-full transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite New Player</span>
        </button>
      </div>

      {/* 4. SEARCH & POSITION FILTER BAR (FLASHSCORE CAPSULE STYLE) */}
      <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player by name or jersey number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-semibold focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'GK', label: 'GOALKEEPERS' },
            { id: 'DF', label: 'DEFENDERS' },
            { id: 'MD', label: 'MIDFIELDERS' },
            { id: 'FW', label: 'FORWARDS' },
          ].map((item) => {
            const isActive = positionFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPositionFilter(item.id)}
                className={`px-3 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. PLAYER CARDS GRID (FLASHSCORE GUEST AESTHETIC) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredRoster.map((player) => {
          const isStarting = startingXI.includes(roster.findIndex((p) => p.id === player.id));
          return (
            <div
              key={player.id}
              className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-3 shadow-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors flex flex-col justify-between gap-2.5"
            >
              {/* Top Row: Rating, Position, Number, and Delete */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Rating Badge */}
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-amber-500 text-slate-950 font-black font-mono text-[10px] flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{player.rating}</span>
                  </span>

                  {/* Position Pill */}
                  <span className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-black uppercase ${getPositionBadgeStyle(player.position)}`}>
                    {player.position}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-[11px] text-slate-400">
                    #{player.number}
                  </span>
                  {isCoach && onDeletePlayer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayerToDelete(player);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title={`Remove ${player.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Player Image & Name */}
              <div className="flex flex-col items-center text-center space-y-1.5">
                <div className="w-12 h-12 rounded-sm overflow-hidden bg-slate-100 dark:bg-slate-800 border border-[#e6e8ec] dark:border-[#1a2e45] shrink-0">
                  <img
                    src={player.cardImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-full">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {player.name}
                  </h4>
                  {isStarting && (
                    <span className="text-[9px] font-black uppercase text-[#00b04f] block mt-0.5">
                      Starting XI
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Status Badge & Quick Selector */}
              <div className="pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between gap-1">
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase truncate ${
                  player.status === 'Fit' || player.status === 'Active'
                    ? 'bg-[#00b04f]/15 text-[#00b04f]'
                    : player.status === 'Recovering'
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-[#ff0046]/15 text-[#ff0046]'
                }`}>
                  {player.status}
                </span>

                <select
                  data-testid="player-status-select"
                  value={player.status}
                  onChange={(e) => onUpdatePlayerStatus(player.id, e.target.value as any)}
                  className="bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
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

      {/* DELETE PLAYER CONFIRMATION MODAL */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ff0046]/15 flex items-center justify-center text-[#ff0046] shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Remove Player from Squad
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will remove the player from your active roster.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] text-xs">
              <div className="font-extrabold text-slate-900 dark:text-white">{playerToDelete.name}</div>
              <div className="text-slate-400 text-[11px] font-mono">#{playerToDelete.number} • {playerToDelete.position}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlayerToDelete(null)}
                className="px-3.5 py-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-full bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-black transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterListView;
