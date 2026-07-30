import React, { useState } from 'react';
import { Player, UserRole, PlayerPosition } from '../types';

interface SquadPageProps {
    roster: Player[];
    setRoster: React.Dispatch<React.SetStateAction<Player[]>>;
    startingXI: number[];
    setStartingXI: React.Dispatch<React.SetStateAction<number[]>>;
    currentRole: UserRole;
    showToast: (msg: string) => void;
    formation: string;
    setFormation: (form: string) => void;
    activePlaystyle: string;
    setActivePlaystyle: (style: string) => void;
}

interface JerseyConfig {
    id: 'away' | 'home' | 'third';
    name: string;
    description: string;
    primaryBg: string;
    stripeColor: string | null;
    accentColor: string;
    collarColor: string;
}

// 3 jerseys configuration
const jerseysConfig: JerseyConfig[] = [
    {
        id: 'away',
        name: 'Gold Trim Away Kit',
        description: 'Elegant white with vertical gold stripes and collar accent',
        primaryBg: '#FFFFFF',
        stripeColor: '#D4AF37',
        accentColor: '#101415',
        collarColor: '#D4AF37'
    },
    {
        id: 'home',
        name: 'Standard Home Kit',
        description: 'Elite gold with high-contrast slate stripes and details',
        primaryBg: '#D4AF37',
        stripeColor: '#1E293B',
        accentColor: '#FFFFFF',
        collarColor: '#1E293B'
    },
    {
        id: 'third',
        name: 'Midnight Third Kit',
        description: 'Stealth matte black with golden neon collar trim',
        primaryBg: '#101415',
        stripeColor: null,
        accentColor: '#D4AF37',
        collarColor: '#D4AF37'
    }
];

export const SquadPage: React.FC<SquadPageProps> = ({
    roster,
    setRoster,
    startingXI,
    setStartingXI,
    currentRole,
    showToast,
    formation,
    setFormation,
    activePlaystyle,
    setActivePlaystyle
}) => {
    // Active Jersey Carousel state (Mobile View / Desktop Preview)
    const [activeJerseyIndex, setActiveJerseyIndex] = useState<number>(1); // Home Kit inside middle default

    // Touch events state for swipeable carousel
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);

    // Position ordering definitions
    const positionOrder: Record<PlayerPosition, number> = {
        'GK': 0,
        'DF': 1,
        'MD': 2,
        'FW': 3
    };

    // Sorting & Filter states
    const [sortBy, setSortBy] = useState<'position' | 'rating' | 'number' | 'name'>('position');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Apply Filter & Sorting logic
    const filteredRoster = roster.filter(player => {
        if (statusFilter === 'ALL') return true;
        return player.status === statusFilter;
    });

    const sortedPlayers = [...filteredRoster].sort((a, b) => {
        if (sortBy === 'position') {
            const diff = positionOrder[a.position] - positionOrder[b.position];
            if (diff !== 0) return diff;
            return b.rating - a.rating; // Tie breaker: rating desc
        }
        if (sortBy === 'rating') {
            return b.rating - a.rating;
        }
        if (sortBy === 'number') {
            return a.number - b.number;
        }
        return a.name.localeCompare(b.name);
    });

    // Add Player Modal states
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [newPlayerForm, setNewPlayerForm] = useState({
        name: '',
        number: 10,
        position: 'MD' as PlayerPosition,
        rating: 80,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Li0adYRQcho3yviz-jXLtvSbm31HoDarilefD50f8XPmkVXetKyZB4Jn52o39kofJna9hEpmuWEQSCmxGtspztaz2fEIGhWObti73Lc0yt-c9fJ3BWu5o8_QU57yCqQ8bVzeKaGMryfKPXtpaL_zII0gqE5xjePxuEcNbY6ophh0kFN-IMHzH6jQ_tlAEvdlW4KXeDTbByvhPLDfSqskkpDVtE74oH9diEwgfVzmQMOy7fsNfMNDicwaoaf3CdCqZnwIxGnq_9VS',
        customImageFile: '' // Object URL if uploaded
    });

    // Subtract Player Modal states
    const [showSubtractModal, setShowSubtractModal] = useState<boolean>(false);
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

    // Handle touch swipe gestures
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const diff = touchStartX - touchEndX;
        const minSwipeDistance = 50; // px

        if (diff > minSwipeDistance) {
            // Swiped Left -> next jersey index
            setActiveJerseyIndex((prev) => Math.min(prev + 1, jerseysConfig.length - 1));
        } else if (diff < -minSwipeDistance) {
            // Swiped Right -> prev jersey index
            setActiveJerseyIndex((prev) => Math.max(prev - 1, 0));
        }

        setTouchStartX(null);
        setTouchEndX(null);
    };

    // Add Player flow handler
    const handleAddPlayerSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPlayerForm.name.trim()) {
            showToast('Please enter a valid athlete name');
            return;
        }

        const newId = `p_${Date.now()}`;
        const newPlayer: Player = {
            id: newId,
            name: newPlayerForm.name.trim(),
            number: Number(newPlayerForm.number),
            position: newPlayerForm.position,
            rating: Number(newPlayerForm.rating),
            cardImage: newPlayerForm.customImageFile || newPlayerForm.cardImage,
            status: 'Fit',
            stamina: 100,
            speed: Math.floor(Math.random() * 25) + 70,
            shooting: Math.floor(Math.random() * 25) + 65,
            passing: Math.floor(Math.random() * 25) + 70,
            dribbling: Math.floor(Math.random() * 25) + 70,
            defense: Math.floor(Math.random() * 25) + 60,
            physical: Math.floor(Math.random() * 25) + 70
        };

        setRoster((prev) => [...prev, newPlayer]);
        showToast(`Successfully registered ${newPlayer.name} (#${newPlayer.number}) to Squad`);

        // Reset form
        setNewPlayerForm({
            name: '',
            number: 10,
            position: 'MD',
            rating: 80,
            cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Li0adYRQcho3yviz-jXLtvSbm31HoDarilefD50f8XPmkVXetKyZB4Jn52o39kofJna9hEpmuWEQSCmxGtspztaz2fEIGhWObti73Lc0yt-c9fJ3BWu5o8_QU57yCqQ8bVzeKaGMryfKPXtpaL_zII0gqE5xjePxuEcNbY6ophh0kFN-IMHzH6jQ_tlAEvdlW4KXeDTbByvhPLDfSqskkpDVtE74oH9diEwgfVzmQMOy7fsNfMNDicwaoaf3CdCqZnwIxGnq_9VS',
            customImageFile: ''
        });
        setShowAddModal(false);
    };

    // File upload support for photos
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const objectUrl = URL.createObjectURL(file);
            setNewPlayerForm(prev => ({
                ...prev,
                customImageFile: objectUrl
            }));
        }
    };

    // Subtract Player flow handler
    const handleDeletePlayerConfirm = () => {
        if (!playerToDelete) return;

        const targetId = playerToDelete.id;
        const targetIndex = roster.findIndex((p) => p.id === targetId);

        if (targetIndex === -1) return;

        // Formulate safe startingXI index shift array to avoid breaking UI layout
        const wasPlayerInStarting = startingXI.includes(targetIndex);
        const newStartingXI = startingXI.map((idx) => {
            if (idx === targetIndex) {
                // Find a player from original list who is not starting and not deleted
                const availableIdx = roster.findIndex((_, rIdx) => rIdx !== targetIndex && !startingXI.includes(rIdx));
                return availableIdx !== -1 ? (availableIdx > targetIndex ? availableIdx - 1 : availableIdx) : 0;
            }
            if (idx > targetIndex) {
                return idx - 1;
            }
            return idx;
        });

        // Filter from roster list
        setRoster((prev) => prev.filter((p) => p.id !== targetId));
        setStartingXI(newStartingXI);
        showToast(`${playerToDelete.name} has been removed from the registry.`);

        setPlayerToDelete(null);
        setShowSubtractModal(false);
    };

    const activeJersey = jerseysConfig[activeJerseyIndex];

    return (
        <div className="w-full space-y-8 max-w-7xl mx-auto pb-16">

            {/* Header: Title with Theme Color */}
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight uppercase">
                    THE JERSEYS
                </h1>
                <p className="text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
                    Egerton FC Official Kits Selection Directory
                </p>
            </div>

            {/* Jerseys Section with swipeable carousel on mobile and magnified preview */}
            <section className="relative bg-surface-container rounded-2xl border border-outline-variant/15 p-6 md:p-10 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>

                {/* Desktop View Jersey row & Mobile Swipeable Carousel */}
                <div
                    className="relative w-full flex items-center justify-center min-h-[320px] select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Carousel Left Arrow button */}
                    <button
                        onClick={() => setActiveJerseyIndex(prev => Math.max(prev - 1, 0))}
                        className={`absolute left-0 z-30 w-11 h-11 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary hover:bg-white/5 active:scale-95 transition-all text-xl cursor-pointer ${activeJerseyIndex === 0 ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'opacity-100'
                            }`}
                        title="Previous Kit"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back_ios_new</span>
                    </button>

                    {/* Three Jerseys Container */}
                    <div className="flex items-center justify-center gap-4 md:gap-14 w-full max-w-3xl overflow-visible relative">
                        {jerseysConfig.map((jersey, idx) => {
                            const isActive = idx === activeJerseyIndex;
                            const isLeft = idx < activeJerseyIndex;
                            const isRight = idx > activeJerseyIndex;

                            // Magnification classes definitions
                            let positionClasses = "transition-all duration-500 ease-out ";
                            if (isActive) {
                                positionClasses += "scale-110 md:scale-125 z-20 opacity-100 shadow-[0_20px_50px_rgba(212,175,55,0.25)] border-[#D4AF37]";
                            } else {
                                positionClasses += "scale-85 md:scale-90 opacity-40 z-10 blur-[0.5px] cursor-pointer hover:opacity-60 ";
                                // Force hide on small screens if not active to keep it clean, but show on large
                                if (isLeft) positionClasses += "hidden sm:flex";
                                if (isRight) positionClasses += "hidden sm:flex";
                            }

                            return (
                                <div
                                    key={jersey.id}
                                    onClick={() => setActiveJerseyIndex(idx)}
                                    className={`flex flex-col items-center w-[180px] md:w-[220px] ${positionClasses}`}
                                >
                                    {/* SVG Jersey graphic */}
                                    <div className="w-full aspect-[200/220] relative">
                                        <svg viewBox="0 0 200 220" width="100%" height="100%">
                                            <defs>
                                                <clipPath id={`jersey-clip-${jersey.id}`}>
                                                    <path d="M 75 20 L 40 35 L 25 75 L 55 85 L 65 75 L 65 200 L 135 200 L 135 75 L 145 85 L 175 75 L 160 35 L 125 20 C 122 35, 78 35, 75 20 Z" />
                                                </clipPath>

                                                <linearGradient id="aurora-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#00F5FF" />
                                                    <stop offset="50%" stopColor="#101415" />
                                                    <stop offset="100%" stopColor="#D4AF37" />
                                                </linearGradient>
                                            </defs>

                                            {/* Outer Drop Shadow */}
                                            <path
                                                d="M 75 20 L 40 35 L 25 75 L 55 85 L 65 75 L 65 200 L 135 200 L 135 75 L 145 85 L 175 75 L 160 35 L 125 20 C 122 35, 78 35, 75 20 Z"
                                                fill="#000000"
                                                opacity="0.45"
                                                transform="translate(4, 8)"
                                                filter="blur(5px)"
                                            />

                                            {/* Masked details group */}
                                            <g clipPath={`url(#jersey-clip-${jersey.id})`}>
                                                {/* Paint Base */}
                                                <rect x="0" y="0" width="200" height="220" fill={jersey.primaryBg} />

                                                {/* Home layout: Slate Grey vertical stripes */}
                                                {jersey.id === 'home' && jersey.stripeColor && (
                                                    <>
                                                        <rect x="73" y="0" width="10" height="220" fill={jersey.stripeColor} />
                                                        <rect x="95" y="0" width="10" height="220" fill={jersey.stripeColor} />
                                                        <rect x="117" y="0" width="10" height="220" fill={jersey.stripeColor} />
                                                        <rect x="51" y="0" width="10" height="220" fill={jersey.stripeColor} />
                                                        <rect x="139" y="0" width="10" height="220" fill={jersey.stripeColor} />
                                                    </>
                                                )}

                                                {/* Away details: Golden vertical stripes */}
                                                {jersey.id === 'away' && jersey.stripeColor && (
                                                    <>
                                                        <line x1="72" y1="0" x2="72" y2="220" stroke={jersey.stripeColor} strokeWidth="1.5" />
                                                        <line x1="86" y1="0" x2="86" y2="220" stroke={jersey.stripeColor} strokeWidth="1.5" />
                                                        <line x1="100" y1="0" x2="100" y2="220" stroke={jersey.stripeColor} strokeWidth="1.5" />
                                                        <line x1="114" y1="0" x2="114" y2="220" stroke={jersey.stripeColor} strokeWidth="1.5" />
                                                        <line x1="128" y1="0" x2="128" y2="220" stroke={jersey.stripeColor} strokeWidth="1.5" />
                                                    </>
                                                )}

                                                {/* Third details: aurora cyan glow gradient */}
                                                {jersey.id === 'third' && (
                                                    <rect x="0" y="0" width="200" height="220" fill="url(#aurora-grad)" opacity="0.6" />
                                                )}

                                                {/* Chess Sponsor text print */}
                                                <text
                                                    x="100"
                                                    y="130"
                                                    textAnchor="middle"
                                                    fill={jersey.accentColor}
                                                    fontSize="9"
                                                    fontWeight="900"
                                                    letterSpacing="2"
                                                    fontFamily="sans-serif"
                                                    opacity="0.85"
                                                >
                                                    AIDA ENERGY
                                                </text>

                                                {/* Egerton label */}
                                                <text
                                                    x="100"
                                                    y="108"
                                                    textAnchor="middle"
                                                    fill={jersey.accentColor}
                                                    fontSize="20"
                                                    fontWeight="black"
                                                    fontFamily="monospace"
                                                >
                                                    EGERTON
                                                </text>

                                                {/* Small Brand Logo */}
                                                <path d="M 115 72 L 121 72 L 118 76 Z" fill={jersey.accentColor} />

                                                {/* Mini Club Crest emblem */}
                                                <circle cx="82" cy="74" r="6" fill={jersey.accentColor} opacity="0.8" />
                                                <polygon points="82,70 85,74 82,78 79,74" fill={jersey.primaryBg} />
                                            </g>

                                            {/* Collar Trim */}
                                            <path
                                                d="M 75 20 C 78 35, 122 35, 125 20"
                                                fill="none"
                                                stroke={jersey.collarColor}
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />

                                            {/* Sleeve Outer Hem Trims */}
                                            <line x1="25" y1="75" x2="55" y2="85" stroke={jersey.collarColor} strokeWidth="3" />
                                            <line x1="175" y1="75" x2="145" y2="85" stroke={jersey.collarColor} strokeWidth="3" />
                                        </svg>
                                    </div>

                                    {/* Text Info */}
                                    <div className="text-center mt-4">
                                        <h4 className="text-[13px] font-black uppercase text-on-surface tracking-tight">
                                            {jersey.name}
                                        </h4>
                                        <span className="text-[9px] text-primary uppercase font-mono tracking-widest font-bold">
                                            {jersey.id.toUpperCase()}_KIT
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Carousel Right Arrow button */}
                    <button
                        onClick={() => setActiveJerseyIndex(prev => Math.min(prev + 1, jerseysConfig.length - 1))}
                        className={`absolute right-0 z-30 w-11 h-11 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary hover:bg-white/5 active:scale-95 transition-all text-xl cursor-pointer ${activeJerseyIndex === jerseysConfig.length - 1 ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'opacity-100'
                            }`}
                        title="Next Kit"
                    >
                        <span className="material-symbols-outlined font-black">arrow_forward_ios</span>
                    </button>
                </div>

                {/* Selected Jersey Description details block */}
                <div className="mt-8 pt-6 border-t border-outline-variant/15 text-center max-w-lg mx-auto">
                    <p className="text-xs text-on-surface-variant italic">
                        "{activeJersey.description}"
                    </p>
                    {/* Dots indicator for swipe state */}
                    <div className="flex gap-2 justify-center mt-4">
                        {jerseysConfig.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveJerseyIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === activeJerseyIndex ? 'w-6 bg-primary' : 'bg-outline-variant/40'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Roster Controls: Add / Subtract Players, Status Filters, Sorting */}
            <div className="bg-surface-container border border-outline-variant/15 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">

                {/* Right: Roster Management buttons (Coach Only) */}
                <div className="flex items-center gap-3">
                    {currentRole === 'COACH' ? (
                        <>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-primary/10 border border-primary/30 px-3.5 py-2 rounded-lg font-label-sm text-[11px] font-bold text-primary uppercase tracking-wide transition-all hover:bg-primary/20 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.08)]"
                            >
                                <span className="material-symbols-outlined text-[15px] font-black">person_add</span>
                                Register Athlete
                            </button>

                            <button
                                onClick={() => setShowSubtractModal(true)}
                                className="bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 rounded-lg font-label-sm text-[11px] font-bold text-rose-450 uppercase tracking-wide transition-all hover:bg-rose-500/20 text-rose-450 cursor-pointer active:scale-95 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[15px]">person_remove</span>
                                Subtract Player
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-black/40 border border-outline-variant/20 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant">
                            <span className="material-symbols-outlined text-amber-400 text-sm">lock</span>
                            <span>Coach authority required to Register or Dismiss athletes</span>
                        </div>
                    )}
                </div>

                {/* Left: Filter and Sorting logic options */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-label-sm text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                            Status Filter
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-surface-container-high border border-outline-variant/20 px-3 py-1.5 text-xs font-bold text-emerald-400 rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="ALL">All Squad Members</option>
                            <option value="Fit">Eligible (Fit)</option>
                            <option value="Recovering">Recovering</option>
                            <option value="Injured">Injured</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Unavailable">Unavailable</option>
                            <option value="Reserve">Reserve</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="font-label-sm text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                            Sort Roster
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-surface-container-high border border-outline-variant/20 px-3 py-1.5 text-xs font-bold text-primary rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="position">By Position (GK-FW)</option>
                            <option value="rating">By Overall Rating</option>
                            <option value="number">By Squad Number</option>
                            <option value="name">By Athlete Name</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Players cards rendering section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center select-none pb-2 border-b border-outline-variant/15">
                    <h2 className="font-headline-md text-base md:text-lg font-bold text-on-surface flex items-center gap-2">
                        <span>Squad Roster Roster Registry</span>
                        <span className="text-[10px] bg-primary/20 text-primary border border-primary/25 px-2.5 py-0.5 rounded font-mono font-bold">
                            {roster.length} ATHLETES
                        </span>
                    </h2>
                    <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
                        Active Sort: {sortBy === 'position' ? 'Tactical Position' : sortBy}
                    </span>
                </div>

                {/* Grid Roster */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {sortedPlayers.map((player) => (
                        <div
                            key={player.id}
                            className="bg-surface-container-high rounded-xl border border-outline-variant/15 p-3 hover:border-primary/44 hover:scale-[1.03] transition-all duration-300 shadow-md group flex flex-col justify-between"
                        >
                            {/* Card Top: image and rating */}
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden select-none bg-surface-container-highest/20 mb-3">
                                <img
                                    src={player.cardImage}
                                    alt={player.name}
                                    className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                        // Fallback if image fails to load
                                        (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Li0adYRQcho3yviz-jXLtvSbm31HoDarilefD50f8XPmkVXetKyZB4Jn52o39kofJna9hEpmuWEQSCmxGtspztaz2fEIGhWObti73Lc0yt-c9fJ3BWu5o8_QU57yCqQ8bVzeKaGMryfKPXtpaL_zII0gqE5xjePxuEcNbY6ophh0kFN-IMHzH6jQ_tlAEvdlW4KXeDTbByvhPLDfSqskkpDVtE74oH9diEwgfVzmQMOy7fsNfMNDicwaoaf3CdCqZnwIxGnq_9VS';
                                    }}
                                />

                                {/* Squad Number badge */}
                                <div className="absolute top-2 left-2 bg-black/60 border border-outline-variant/30 px-2 py-0.5 rounded text-[10px] font-black text-white leading-none">
                                    #{player.number}
                                </div>

                                {/* Captain Badge */}
                                {(player.id === 'p2' || player.name === 'Leo Van Dijk') && (
                                    <div className="absolute top-2 left-12 bg-amber-550 text-white font-mono font-black border border-outline/35 px-2 py-0.5 rounded text-[10px] leading-none shadow-md" title="Team Captain">
                                        C
                                    </div>
                                )}

                                {/* Rating Badge */}
                                <div className="absolute top-2 right-2 bg-primary text-on-primary border border-white/10 px-2 py-0.5 rounded text-[10px] font-black leading-none shadow-md">
                                    {player.rating}
                                </div>

                                {/* Playing Position badge */}
                                <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-xs border border-primary/20 px-2 py-0.5 rounded text-[9px] font-black text-primary leading-none uppercase">
                                    {player.position}
                                </div>
                            </div>

                            {/* Card details */}
                            <div className="space-y-2 mt-1">
                                <p className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                                    {player.name}
                                </p>

                                {/* Stamina display bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-on-surface-variant font-bold">
                                        <span>STAMINA</span>
                                        <span>{player.stamina}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#D4AF37] to-primary transition-all duration-300"
                                            style={{ width: `${player.stamina}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Mini Stats layout */}
                                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-outline-variant/10 text-center text-[8px] text-on-surface-variant font-mono">
                                    <div>
                                        <span className="block font-bold text-on-surface">{player.speed}</span>
                                        <span>SPD</span>
                                    </div>
                                    <div>
                                        <span className="block font-bold text-on-surface">{player.shooting}</span>
                                        <span>SHO</span>
                                    </div>
                                    <div>
                                        <span className="block font-bold text-on-surface">{player.passing}</span>
                                        <span>PAS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ADD PLAYER MODAL POPUP */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-container max-w-md w-full rounded-2xl border border-outline-variant/20 p-6 space-y-6 shadow-2xl relative">

                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15">
                            <h3 className="font-headline-md text-base md:text-lg font-black text-primary uppercase">
                                Register New Athlete
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-on-surface cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddPlayerSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                    Athlete Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Kylian Mbappé"
                                    value={newPlayerForm.name}
                                    onChange={(e) => setNewPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-surface-container-high border border-outline-variant/20 px-3.5 py-3 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/44"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Squad number */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                        Squad Number
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        required
                                        value={newPlayerForm.number}
                                        onChange={(e) => setNewPlayerForm(prev => ({ ...prev, number: Number(e.target.value) }))}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 px-3.5 py-3 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/44"
                                    />
                                </div>

                                {/* Playing Position */}
                                <div className="space-y-1">
                                    <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                        Position Group
                                    </label>
                                    <select
                                        value={newPlayerForm.position}
                                        onChange={(e) => setNewPlayerForm(prev => ({ ...prev, position: e.target.value as PlayerPosition }))}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 px-3.5 py-3 rounded-lg text-xs font-semibold text-primary focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/44 cursor-pointer"
                                    >
                                        <option value="GK">Goalkeeper (GK)</option>
                                        <option value="DF">Defender (DF)</option>
                                        <option value="MD">Midfielder (MD)</option>
                                        <option value="FW">Forward (FW)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Overall Skill Rating */}
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                        Overall Skill Score Rating
                                    </label>
                                    <span className="text-xs font-black text-primary font-mono">{newPlayerForm.rating}</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="99"
                                    value={newPlayerForm.rating}
                                    onChange={(e) => setNewPlayerForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                                    className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* Photo Upload Options */}
                            <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                                <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">
                                    Register Athlete Photo
                                </label>

                                {/* Upload local option */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className="bg-white/5 border border-outline-variant/20 py-2.5 px-4 rounded-lg font-label-sm text-[10px] font-bold text-on-surface uppercase tracking-wide cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center inline-block"
                                        >
                                            Choose Image File
                                        </label>

                                        {newPlayerForm.customImageFile ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-[9px] text-emerald-400 font-bold uppercase">Uploaded Live Preview</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-on-surface-variant font-mono">Accepts png, jpg, webp</span>
                                        )}
                                    </div>

                                    {/* Or Paste photo url link option */}
                                    <input
                                        type="text"
                                        placeholder="Or paste direct image HTTP URL link..."
                                        value={newPlayerForm.customImageFile ? '' : newPlayerForm.cardImage}
                                        disabled={!!newPlayerForm.customImageFile}
                                        onChange={(e) => setNewPlayerForm(prev => ({ ...prev, cardImage: e.target.value }))}
                                        className="w-full bg-surface-container-high border border-outline-variant/20 px-3.5 py-2.5 rounded-lg text-[10px] font-mono text-on-surface-variant focus:outline-none focus:border-primary disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/15">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 border border-outline-variant/30 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-center"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-lg text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer text-center shadow-lg shadow-primary/20"
                                >
                                    Confirm Register
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SUBTRACT PLAYER CHOOSE MODAL POPUP */}
            {showSubtractModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-container max-w-lg w-full rounded-2xl border border-outline-variant/20 p-6 space-y-5 shadow-2xl relative">

                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15">
                            <h3 className="font-headline-md text-base md:text-lg font-black text-rose-500 uppercase flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-lg">person_remove</span>
                                Dismiss Athlete Portal
                            </h3>
                            <button
                                onClick={() => setShowSubtractModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-on-surface cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <p className="text-xs text-on-surface-variant">
                            Choose an athlete below from the registry roster list to initiate official subtraction dismissal processes.
                        </p>

                        {/* List of athletes with choose action */}
                        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {roster.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/10 hover:border-outline-variant/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest/20 shrink-0">
                                            <img src={player.cardImage} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                                <span>{player.name}</span>
                                                <span className="font-mono text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-on-surface-variant">
                                                    #{player.number}
                                                </span>
                                            </h4>
                                            <span className="text-[9px] text-primary uppercase font-bold tracking-wider">
                                                {player.position} Group • {player.rating} Rated
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        onClick={() => setPlayerToDelete(player)}
                                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/35 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                                    >
                                        Choose
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-end pt-3 border-t border-outline-variant/15">
                            <button
                                onClick={() => setShowSubtractModal(false)}
                                className="border border-outline-variant/30 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-center"
                            >
                                Close Portal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUBTRACTION CONFIRMATION MODAL POPUP */}
            {playerToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs animate-fade-in">
                    <div className="bg-surface-container-high max-w-sm w-full rounded-xl border border-rose-550/40 p-6 space-y-6 shadow-2xl relative">

                        <div className="flex items-center gap-3 text-rose-500">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                            <h3 className="font-headline-md text-sm font-black uppercase tracking-wider">
                                Confirm Dismemberment
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-on-surface leading-relaxed">
                                Are you absolutely sure you want to permanently remove <span className="text-white font-bold">{playerToDelete.name}</span> (# {playerToDelete.number}) from Egerton FC squad roster list?
                            </p>
                            <p className="text-[10px] text-rose-450 uppercase font-black bg-rose-500/10 p-2.5 rounded border border-rose-500/20">
                                ⚠ This action is final and will automatically adjust starting formations lineups.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPlayerToDelete(null)}
                                className="flex-1 border border-outline-variant/30 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDeletePlayerConfirm}
                                className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-rose-700 active:scale-95 transition-all cursor-pointer text-center shadow-lg shadow-rose-900/30"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
