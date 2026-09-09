import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Shield,
  Star,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  Shirt,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
  Palette,
  Image as ImageIcon,
  X,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Activity,
  Hash,
  UserCheck,
} from 'lucide-react';
import type { Player, UserRole, PlayerPosition, KitConfig } from '../../types';
import { initialKits } from '../../mockData';
import { uploadKitImageToStorage, saveTeamKitsConfig } from '../../lib/supabaseClient';

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

type SortCriterion = 'rating' | 'number' | 'name' | 'position' | 'status';

interface KitItem {
  id: 'home' | 'away' | 'third' | 'gk';
  typeLabel: string;
  colorName?: string;
  imageUrl?: string;
  primaryColor?: string;
  stripeColor?: string | null;
  accentColor?: string;
}

const PRESET_SWATCHES = [
  { name: 'Emerald', hex: '#00b04f' },
  { name: 'Red', hex: '#ff0046' },
  { name: 'Royal Blue', hex: '#0080ff' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Arctic White', hex: '#ffffff' },
  { name: 'Obsidian Black', hex: '#0f172a' },
  { name: 'Coral', hex: '#f43f5e' },
  { name: 'Sky Cyan', hex: '#06b6d4' },
  { name: 'Amber', hex: '#f59e0b' },
];

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
  teamId = 'de307384-d113-4956-a5cc-96c20579e0fa',
  teamName = 'Your Team',
  onShowToast,
  onDeletePlayer,
}) => {
  const isCoach = currentRole === 'COACH';

  // Sub-main menus: Players Directory vs Team Kits
  const [activeSubMenu, setActiveSubMenu] = useState<'players' | 'kits'>('players');

  // Sorting state for players
  const [sortBy, setSortBy] = useState<SortCriterion>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Link copy state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Player deletion state
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Player Image upload state
  const playerFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPlayerForImage, setSelectedPlayerForImage] = useState<string | null>(null);

  // Team Kits State (Exactly 4 cards: Home, Away, Third, GK)
  const KITS_CACHE_KEY = `egerton_kits_${teamId}`;
  const [kits, setKits] = useState<KitItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(KITS_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn('Could not read kits cache:', e);
      }
    }
    // Fallback to initialKits mapped to exactly 4 cards
    const initialMap: Record<string, KitConfig> = {};
    (initialKits as KitConfig[]).forEach((k) => {
      initialMap[k.id] = k;
    });

    return [
      {
        id: 'home',
        typeLabel: 'Home Kit',
        colorName: initialMap.home?.name || 'Egerton Royal Gold',
        imageUrl: initialMap.home?.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
        primaryColor: initialMap.home?.primaryBg || '#D4AF37',
        stripeColor: initialMap.home?.stripeColor || '#0F172A',
        accentColor: initialMap.home?.accentColor || '#FFFFFF',
      },
      {
        id: 'away',
        typeLabel: 'Away Kit',
        colorName: initialMap.away?.name || 'Arctic Obsidian',
        imageUrl: initialMap.away?.imageUrl || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&auto=format&fit=crop&q=80',
        primaryColor: initialMap.away?.primaryBg || '#FFFFFF',
        stripeColor: initialMap.away?.stripeColor || '#0F172A',
        accentColor: initialMap.away?.accentColor || '#D4AF37',
      },
      {
        id: 'third',
        typeLabel: 'Third Kit',
        colorName: initialMap.third?.name || 'Midnight Neon',
        imageUrl: initialMap.third?.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=400&auto=format&fit=crop&q=80',
        primaryColor: initialMap.third?.primaryBg || '#0F172A',
        stripeColor: initialMap.third?.stripeColor || null,
        accentColor: initialMap.third?.accentColor || '#10B981',
      },
      {
        id: 'gk',
        typeLabel: 'Goalkeeper Kit',
        colorName: initialMap.gk?.name || 'Electric Coral',
        imageUrl: initialMap.gk?.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&auto=format&fit=crop&q=80',
        primaryColor: initialMap.gk?.primaryBg || '#F43F5E',
        stripeColor: initialMap.gk?.stripeColor || null,
        accentColor: initialMap.gk?.accentColor || '#FFFFFF',
      },
    ];
  });

  // Popup Modal state for editing a Kit
  const [editingKit, setEditingKit] = useState<KitItem | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');
  const [editColorName, setEditColorName] = useState<string>('');
  const [editPrimaryColor, setEditPrimaryColor] = useState<string>('#00b04f');
  const [hasStripe, setHasStripe] = useState<boolean>(false);
  const [editStripeColor, setEditStripeColor] = useState<string>('#0f172a');
  const [editAccentColor, setEditAccentColor] = useState<string>('#ffffff');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const kitFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handlePlayerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedPlayerForImage) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      if (onUploadPlayerImage) {
        onUploadPlayerImage(selectedPlayerForImage, imageUrl);
      }
      setSelectedPlayerForImage(null);
    }
  };

  // Open Kit Edit Modal
  const handleOpenEditKit = (kit: KitItem) => {
    setEditingKit(kit);
    setEditPhotoUrl(kit.imageUrl || '');
    setEditColorName(kit.colorName || '');
    setEditPrimaryColor(kit.primaryColor || '#00b04f');
    setHasStripe(Boolean(kit.stripeColor));
    setEditStripeColor(kit.stripeColor || '#0f172a');
    setEditAccentColor(kit.accentColor || '#ffffff');
  };

  // Upload kit photo from file input
  const handleKitFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingKit) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);
      try {
        const localPreview = URL.createObjectURL(file);
        setEditPhotoUrl(localPreview);
        try {
          const publicUrl = await uploadKitImageToStorage(file, editingKit.id);
          if (publicUrl) setEditPhotoUrl(publicUrl);
        } catch (uploadErr) {
          console.warn('Storage upload fallback to local preview:', uploadErr);
        }
        if (onShowToast) onShowToast('Kit photo selected!');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  // Save Kit changes
  const handleSaveKitModal = async () => {
    if (!editingKit) return;

    const updatedList: KitItem[] = kits.map((k) => {
      if (k.id === editingKit.id) {
        return {
          ...k,
          colorName: editColorName.trim() || undefined,
          imageUrl: editPhotoUrl.trim() || undefined,
          primaryColor: editPrimaryColor || undefined,
          stripeColor: hasStripe ? editStripeColor : null,
          accentColor: editAccentColor || undefined,
        };
      }
      return k;
    });

    setKits(updatedList);
    try {
      localStorage.setItem(KITS_CACHE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to cache kits:', e);
    }

    try {
      // Sync to Supabase format
      const supabaseKitsPayload: KitConfig[] = updatedList.map((item) => ({
        id: item.id,
        name: item.colorName || item.typeLabel,
        description: `Official ${item.typeLabel}`,
        primaryBg: item.primaryColor || '#00b04f',
        stripeColor: item.stripeColor || null,
        accentColor: item.accentColor || '#ffffff',
        collarColor: item.accentColor || '#ffffff',
        imageUrl: item.imageUrl,
        updatedAt: new Date().toISOString(),
      }));
      await saveTeamKitsConfig(teamId, supabaseKitsPayload);
    } catch (err) {
      console.warn('Sync kits error:', err);
    }

    if (onShowToast) onShowToast(`${editingKit.typeLabel} configured successfully!`);
    setEditingKit(null);
  };

  // Position and Status sorting weight maps
  const POSITION_WEIGHT: Record<string, number> = {
    GK: 1,
    DF: 2,
    MD: 3,
    FW: 4,
  };

  const STATUS_WEIGHT: Record<string, number> = {
    Fit: 1,
    Active: 2,
    Recovering: 3,
    Injured: 4,
    Suspended: 5,
  };

  // Multi-criteria sorting logic
  const handleSortClick = (criterion: SortCriterion) => {
    if (sortBy === criterion) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(criterion);
      if (criterion === 'rating') setSortOrder('desc');
      else setSortOrder('asc');
    }
  };

  const sortedRoster = useMemo(() => {
    const list = [...filteredRoster];
    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'rating') {
        comp = (a.rating || 0) - (b.rating || 0);
      } else if (sortBy === 'number') {
        comp = (a.number || 0) - (b.number || 0);
      } else if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortBy === 'position') {
        const pA = POSITION_WEIGHT[a.position] || 99;
        const pB = POSITION_WEIGHT[b.position] || 99;
        comp = pA - pB;
      } else if (sortBy === 'status') {
        const sA = STATUS_WEIGHT[a.status] || 99;
        const sB = STATUS_WEIGHT[b.status] || 99;
        comp = sA - sB;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredRoster, sortBy, sortOrder]);

  // Identify athletes with pending/incomplete details
  const pendingPlayers = useMemo(() => {
    return roster.filter(
      (p) =>
        p.status === 'Recovering' ||
        !p.cardImage ||
        p.cardImage.includes('unsplash') ||
        p.number >= 80 ||
        (p as any).isPendingRegistration
    );
  }, [roster]);

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
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-20">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={playerFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePlayerImageChange}
      />
      <input
        type="file"
        ref={kitFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleKitFileSelected}
      />

      {/* ========================================================================= */}
      {/* SUB-MAIN MENUS: SEGMENTED CONTROLS (APPLE DESIGN HIG) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-4">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSubMenu('players')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubMenu === 'players'
                ? 'bg-white dark:bg-[#1c3554] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players Directory</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                activeSubMenu === 'players'
                  ? 'bg-[#ff0046]/15 text-[#ff0046]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {roster.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubMenu('kits')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubMenu === 'kits'
                ? 'bg-white dark:bg-[#1c3554] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Team Kits</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                activeSubMenu === 'kits'
                  ? 'bg-[#00b04f]/15 text-[#00b04f]'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              4 Kits
            </span>
          </button>
        </div>

        {activeSubMenu === 'players' && (
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-4 py-2 bg-transparent hover:bg-[#ff0046] active:bg-[#ff0046] text-[#ff0046] hover:text-white active:text-white border border-[#ff0046] text-xs font-black rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite New Player</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-MENU 1: PLAYERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubMenu === 'players' && (
        <div className="space-y-7 animate-in fade-in duration-150">
          {/* 1. MAIN HEADING */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-blue-500" />
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Players Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                {roster.length} Athletes Registered
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Complete student-athlete roster records, direct player intake link, and squad sorting.
            </p>
          </div>

          {/* 2. PLAYERS YET TO FILL IN DETAILS & INTAKE LINK SECTION */}
          <section className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Athletes Awaiting Details & Profile Completion
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {pendingPlayers.length} Incomplete
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Athletes registered on squad who need to finalize profile credentials, photos, or jersey numbers.
                </p>
              </div>

              {/* Action Buttons for Intake Link */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyRegistrationLink}
                  className="px-3.5 py-1.5 bg-transparent hover:bg-[#0080ff] active:bg-[#0080ff] text-[#0080ff] hover:text-white active:text-white border border-[#0080ff] text-xs font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Registration Link'}</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-transparent hover:bg-[#00b04f] active:bg-[#00b04f] text-[#00b04f] hover:text-white active:text-white border border-[#00b04f] text-xs font-black rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </a>

                <a
                  href={`#/register/player?teamId=${teamId || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-transparent hover:bg-slate-700 active:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-white active:text-white border border-slate-300 dark:border-slate-600 text-xs font-bold rounded-full flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Intake Form</span>
                </a>
              </div>
            </div>

            {/* Incomplete / Pending athletes horizontal list */}
            {pendingPlayers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                {pendingPlayers.slice(0, 4).map((player) => (
                  <div
                    key={player.id}
                    className="p-2.5 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-dashed border-amber-500/30 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {player.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {player.name}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pending profile details</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRegistrationLink}
                      className="p-1.5 text-slate-400 hover:text-[#0080ff] transition-colors cursor-pointer"
                      title="Copy link to send to athlete"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-xs text-[#00b04f] font-semibold flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>All current athletes have fully completed profile credentials!</span>
              </div>
            )}

            {/* Direct Intake URL display */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Direct Intake Link:</span>
              <code className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-[#f8f9fa] dark:bg-[#112236] px-3 py-1 rounded-md border border-[#e6e8ec] dark:border-[#1a2e45] inline-block select-all truncate flex-1">
                {registrationUrl}
              </code>
            </div>
          </section>

          {/* SPACE BETWEEN SECTIONS */}
          <div className="my-8 border-t border-[#e6e8ec] dark:border-[#1a2e45]" />

          {/* 3. THE PLAYERS SECTION WITH WAYS TO ARRANGE THEM */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Squad Players</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    {sortedRoster.length} Available
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Arrange players by rating, jersey number, name, position, or current fitness status.
                </p>
              </div>

              {/* MULTI-CRITERIA ARRANGE CONTROLS */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Arrange by:</span>
                </span>

                {/* Sort by Rating */}
                <button
                  type="button"
                  onClick={() => handleSortClick('rating')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    sortBy === 'rating'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white dark:bg-[#112236] text-slate-700 dark:text-slate-300 border border-[#e6e8ec] dark:border-[#1a2e45] hover:border-amber-500'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>Rating</span>
                  {sortBy === 'rating' && (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                  )}
                </button>

                {/* Sort by Number */}
                <button
                  type="button"
                  onClick={() => handleSortClick('number')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    sortBy === 'number'
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'bg-white dark:bg-[#112236] text-slate-700 dark:text-slate-300 border border-[#e6e8ec] dark:border-[#1a2e45] hover:border-blue-500'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  <span>Number</span>
                  {sortBy === 'number' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>

                {/* Sort by Name */}
                <button
                  type="button"
                  onClick={() => handleSortClick('name')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    sortBy === 'name'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-[#112236] text-slate-700 dark:text-slate-300 border border-[#e6e8ec] dark:border-[#1a2e45] hover:border-slate-500'
                  }`}
                >
                  <span>Name</span>
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>

                {/* Sort by Position */}
                <button
                  type="button"
                  onClick={() => handleSortClick('position')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    sortBy === 'position'
                      ? 'bg-[#00b04f] text-white shadow-xs'
                      : 'bg-white dark:bg-[#112236] text-slate-700 dark:text-slate-300 border border-[#e6e8ec] dark:border-[#1a2e45] hover:border-[#00b04f]'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Position</span>
                  {sortBy === 'position' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>

                {/* Sort by Status */}
                <button
                  type="button"
                  onClick={() => handleSortClick('status')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    sortBy === 'status'
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-white dark:bg-[#112236] text-slate-700 dark:text-slate-300 border border-[#e6e8ec] dark:border-[#1a2e45] hover:border-[#ff0046]'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Status</span>
                  {sortBy === 'status' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* SEARCH & POSITION FILTER BAR */}
            <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player by name or jersey number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-semibold focus:outline-none focus:ring-1 focus:ring-[#00b04f]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'ALL', label: 'ALL' },
                  { id: 'GK', label: 'GK' },
                  { id: 'DF', label: 'DF' },
                  { id: 'MD', label: 'MD' },
                  { id: 'FW', label: 'FW' },
                ].map((item) => {
                  const isActive = positionFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPositionFilter(item.id)}
                      className={`px-3 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#00b04f] text-white shadow-xs'
                          : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PLAYER CARDS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sortedRoster.map((player) => {
                const isStarting = startingXI.includes(roster.findIndex((p) => p.id === player.id));
                return (
                  <div
                    key={player.id}
                    className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-3 shadow-xs hover:border-[#00b04f]/40 hover:shadow-md transition-all flex flex-col justify-between gap-2.5 relative group"
                  >
                    {/* Top Row: Rating, Position, Number, and Delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* Rating Badge */}
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-amber-500 text-slate-950 font-black font-mono text-[10px] flex items-center gap-0.5 shadow-2xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{player.rating}</span>
                        </span>

                        {/* Position Pill */}
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase ${getPositionBadgeStyle(player.position)}`}>
                          {player.position}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-mono font-black text-[11px] text-slate-400">
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
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-[#e6e8ec] dark:border-[#1a2e45] shrink-0 group-hover:border-[#00b04f] transition-colors">
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
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase truncate ${
                          player.status === 'Fit' || player.status === 'Active'
                            ? 'bg-[#00b04f]/15 text-[#00b04f]'
                            : player.status === 'Recovering'
                            ? 'bg-blue-500/15 text-blue-500'
                            : 'bg-[#ff0046]/15 text-[#ff0046]'
                        }`}
                      >
                        {player.status}
                      </span>

                      <select
                        data-testid="player-status-select"
                        value={player.status}
                        onChange={(e) => onUpdatePlayerStatus(player.id, e.target.value as any)}
                        className="bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#00b04f] cursor-pointer"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MENU 2: TEAM KITS (4 CARDS: HOME, AWAY, THIRD, GK) */}
      {/* ========================================================================= */}
      {activeSubMenu === 'kits' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Main Heading for Team Kits */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Shirt className="w-5 h-5 text-[#00b04f]" />
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Official Team Kits
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f]">
                4 Registered Kits
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Configure uniform identity, upload kit photo imagery, define color names, and edit strip palettes in the customizer popup.
            </p>
          </div>

          {/* EXACTLY 4 CARDS: HOME, AWAY, THIRD, GK */}
          {/* Rule: Each card will only show what has been set. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kits.map((kit) => {
              const hasPhoto = Boolean(kit.imageUrl);
              const hasColorName = Boolean(kit.colorName);
              const hasStripColors = Boolean(kit.primaryColor);

              return (
                <div
                  key={kit.id}
                  onClick={() => handleOpenEditKit(kit)}
                  className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] hover:border-[#00b04f] dark:hover:border-[#00b04f] rounded-2xl p-4 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    {/* Header Row: Kit Type & Edit Prompt */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00b04f]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          {kit.typeLabel}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {kit.id.toUpperCase()}
                      </span>
                    </div>

                    {/* Strip color bar: ONLY SHOW IF SET */}
                    {hasStripColors && (
                      <div className="h-2 w-full rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ backgroundColor: kit.primaryColor }}
                          className="h-full flex-1"
                          title={`Primary: ${kit.primaryColor}`}
                        />
                        {kit.stripeColor && (
                          <div
                            style={{ backgroundColor: kit.stripeColor }}
                            className="h-full w-4"
                            title={`Stripe: ${kit.stripeColor}`}
                          />
                        )}
                        {kit.accentColor && (
                          <div
                            style={{ backgroundColor: kit.accentColor }}
                            className="h-full w-2"
                            title={`Accent: ${kit.accentColor}`}
                          />
                        )}
                      </div>
                    )}

                    {/* Photo: ONLY SHOW IF SET */}
                    <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-center">
                      {hasPhoto ? (
                        <img
                          src={kit.imageUrl}
                          alt={kit.typeLabel}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400 p-4 text-center">
                          <Shirt className="w-8 h-8 stroke-1" />
                          <span className="text-[11px] font-semibold">No photo uploaded</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 text-xs font-bold shadow-md">
                          Click to Configure
                        </span>
                      </div>
                    </div>

                    {/* Color Name: ONLY SHOW IF SET */}
                    {hasColorName && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Color Identity
                        </span>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {kit.colorName}
                        </div>
                      </div>
                    )}

                    {/* Strip Colors Palette: ONLY SHOW WHAT HAS BEEN SET */}
                    {hasStripColors && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Strip Palette
                        </span>
                        <div className="flex items-center gap-2">
                          {kit.primaryColor && (
                            <div className="flex items-center gap-1">
                              <span
                                style={{ backgroundColor: kit.primaryColor }}
                                className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs"
                              />
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {kit.primaryColor}
                              </span>
                            </div>
                          )}
                          {kit.stripeColor && (
                            <div className="flex items-center gap-1">
                              <span
                                style={{ backgroundColor: kit.stripeColor }}
                                className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs"
                              />
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {kit.stripeColor}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button: Edit Kit */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditKit(kit);
                    }}
                    className="w-full py-2 bg-transparent hover:bg-[#00b04f] active:bg-[#00b04f] text-[#00b04f] hover:text-white active:text-white border border-[#00b04f] text-xs font-black rounded-full transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Edit Kit Details</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: EDIT KIT (PHOTO UPLOAD, COLOR NAME, STRIP COLORS) */}
      {/* ========================================================================= */}
      {editingKit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-3">
              <div className="flex items-center gap-2.5">
                <Shirt className="w-5 h-5 text-[#00b04f]" />
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider text-slate-900 dark:text-white">
                    Customize {editingKit.typeLabel}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload kit imagery, name the color, and customize uniform strip colors.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKit(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* 1. UPLOAD PHOTO OF THE KIT */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                  Kit Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-center shrink-0">
                    {editPhotoUrl ? (
                      <img src={editPhotoUrl} alt="Kit preview" className="w-full h-full object-cover" />
                    ) : (
                      <Shirt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <button
                      type="button"
                      onClick={() => kitFileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="px-4 py-2 bg-transparent hover:bg-[#0080ff] active:bg-[#0080ff] text-[#0080ff] hover:text-white active:text-white border border-[#0080ff] text-xs font-black rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{editPhotoUrl ? 'Replace Photo' : 'Upload Kit Photo'}</span>
                    </button>
                    {editPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditPhotoUrl('')}
                        className="text-[11px] text-rose-500 hover:underline block cursor-pointer font-semibold"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP uniforms up to 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. CHOOSE NAME OF THE COLOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                  Color Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Egerton Royal Gold, Obsidian Navy, Neon Emerald"
                  value={editColorName}
                  onChange={(e) => setEditColorName(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-semibold focus:outline-none focus:ring-1 focus:ring-[#00b04f]"
                />
                <span className="text-[10px] text-slate-400 block">
                  This identity label appears on squad matchday programs and match cards.
                </span>
              </div>

              {/* 3. EDIT COLORS OF THE STRIP */}
              <div className="space-y-3 pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Strip Colors & Design
                  </label>
                  {/* Live Strip Preview Bar */}
                  <div className="w-28 h-4 rounded-full overflow-hidden flex border border-black/10 shadow-inner">
                    <div style={{ backgroundColor: editPrimaryColor }} className="h-full flex-1" />
                    {hasStripe && (
                      <div style={{ backgroundColor: editStripeColor }} className="h-full w-5" />
                    )}
                    <div style={{ backgroundColor: editAccentColor }} className="h-full w-2" />
                  </div>
                </div>

                {/* Primary Color Picker */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    Primary Strip Color
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-[#e6e8ec] dark:border-[#1a2e45] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editPrimaryColor}
                      onChange={(e) => setEditPrimaryColor(e.target.value)}
                      className="w-28 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_SWATCHES.slice(0, 5).map((swatch) => (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => setEditPrimaryColor(swatch.hex)}
                          style={{ backgroundColor: swatch.hex }}
                          className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 cursor-pointer hover:scale-110 transition-transform shadow-2xs"
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Secondary / Stripe Color Toggle & Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableStripe"
                      checked={hasStripe}
                      onChange={(e) => setHasStripe(e.target.checked)}
                      className="rounded border-[#e6e8ec] text-[#00b04f] focus:ring-[#00b04f] cursor-pointer"
                    />
                    <label
                      htmlFor="enableStripe"
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Include Secondary Stripe Color
                    </label>
                  </div>

                  {hasStripe && (
                    <div className="flex items-center gap-3 pt-1 pl-5">
                      <input
                        type="color"
                        value={editStripeColor}
                        onChange={(e) => setEditStripeColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-[#e6e8ec] dark:border-[#1a2e45] cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editStripeColor}
                        onChange={(e) => setEditStripeColor(e.target.value)}
                        className="w-28 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_SWATCHES.slice(3, 8).map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => setEditStripeColor(swatch.hex)}
                            style={{ backgroundColor: swatch.hex }}
                            className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 cursor-pointer hover:scale-110 transition-transform shadow-2xs"
                            title={swatch.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accent / Collar Color Picker */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    Accent & Collar Trim
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editAccentColor}
                      onChange={(e) => setEditAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-[#e6e8ec] dark:border-[#1a2e45] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editAccentColor}
                      onChange={(e) => setEditAccentColor(e.target.value)}
                      className="w-28 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e6e8ec] dark:border-[#1a2e45]">
              <button
                type="button"
                onClick={() => setEditingKit(null)}
                className="px-4 py-2 rounded-full bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveKitModal}
                className="px-5 py-2 rounded-full bg-transparent hover:bg-[#00b04f] active:bg-[#00b04f] text-[#00b04f] hover:text-white active:text-white border border-[#00b04f] text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Kit Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE PLAYER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-5 shadow-2xl space-y-4">
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

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] rounded-lg border border-[#e6e8ec] dark:border-[#1a2e45] text-xs">
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

