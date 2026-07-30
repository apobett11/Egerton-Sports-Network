import React, { useState, useEffect } from 'react';
import { Player, UserRole, SquadPosition } from '../types';
import { formationCoordinates } from '../mockData';
import { loadSquadConfiguration, saveSquadConfiguration } from '../lib/supabaseClient';

interface GameDetailsPageProps {
    roster: Player[];
    startingXI: number[];
    setStartingXI: React.Dispatch<React.SetStateAction<number[]>>;
    currentRole: UserRole;
    showToast: (msg: string) => void;
    formation: string;
    setFormation: (form: string) => void;
    activePlaystyle: string;
    setActivePlaystyle: (style: string) => void;
}

export const GameDetailsPage: React.FC<GameDetailsPageProps> = ({
    roster,
    startingXI,
    setStartingXI,
    currentRole,
    showToast,
    formation,
    setFormation,
    activePlaystyle,
    setActivePlaystyle
}) => {
    const [selectedFieldSlot, setSelectedFieldSlot] = useState<number | null>(null);
    const [showSubDrawer, setShowSubDrawer] = useState(false);
    const [coords, setCoords] = useState<{ roleLabel: string; top: string; left: string }[]>([]);

    // Calculates Collective Strength (rating sum * 2 + 500)
    const collectiveStrength = startingXI.reduce((sum, idx) => sum + (roster[idx]?.rating || 0), 0) * 2 + 500;

    // Bench represents players not in startingXI
    const substitutes = roster.filter((_, idx) => !startingXI.includes(idx));

    // Load saved coordinates config from Supabase database
    useEffect(() => {
        let isCurrent = true;
        async function fetchConfig() {
            try {
                // Team is mocked as 't-egerton-fc'
                const config = await loadSquadConfiguration('t-egerton-fc', formation);
                if (!isCurrent) return;

                if (config && config.player_positions && config.player_positions.length === 11) {
                    const mapped = config.player_positions.map((pos) => ({
                        roleLabel: pos.position_name,
                        top: `${pos.y_coordinate}%`,
                        left: `${pos.x_coordinate}%`
                    }));
                    setCoords(mapped);
                    showToast(`Supabase: Loaded saved tactical pitch coordinates for ${formation}.`);
                } else {
                    const defaults = formationCoordinates[formation] || formationCoordinates['4-4-1-1'];
                    setCoords(defaults);
                }
            } catch (err) {
                console.error('[GameDetailsPage] Load failed', err);
            }
        }
        fetchConfig();
        return () => {
            isCurrent = false;
        };
    }, [formation]);

    const handleSwap = (playerIdx: number) => {
        if (selectedFieldSlot === null) return;

        const newStarting = [...startingXI];
        newStarting[selectedFieldSlot] = playerIdx;
        setStartingXI(newStarting);

        showToast(`Swapped in ${roster[playerIdx].name} for field slot ${selectedFieldSlot + 1}`);
        setSelectedFieldSlot(null);
        setShowSubDrawer(false);
    };

    const handleAutoPick = () => {
        // Select highest rated players for the 11 positions
        const sortedIndices = roster
            .map((p, idx) => ({ rating: p.rating, idx }))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 11)
            .map(item => item.idx);

        setStartingXI(sortedIndices);
        showToast('Auto-picked top 11 players by overall performance rating.');
    };

    const handleSubmitLineup = async () => {
        if (currentRole !== 'COACH') {
            showToast('Access Restricted: Official lineup submissions can only be executed by the Coach.');
            return;
        }

        const playerPositions: SquadPosition[] = activeCoordinates.map((node, idx) => {
            const player = roster[startingXI[idx]];
            return {
                player_id: player ? player.id : `p-unknown-${idx}`,
                position_name: node.roleLabel,
                x_coordinate: parseFloat(node.left),
                y_coordinate: parseFloat(node.top)
            };
        });

        const success = await saveSquadConfiguration({
            teamId: 't-egerton-fc',
            formation: formation,
            playerPositions: playerPositions,
            createdBy: 'u-user-current'
        });

        if (success) {
            showToast('Lineup and pitch layout successfully submitted and stored in Supabase.');
        } else {
            showToast('Failed to save to Supabase. Cached lineup local-backup instead.');
        }
    };

    const handleSaveDraft = async () => {
        if (currentRole !== 'COACH') {
            showToast('Access Restricted: Only Coaches can save tactical configurations.');
            return;
        }

        const playerPositions: SquadPosition[] = activeCoordinates.map((node, idx) => {
            const player = roster[startingXI[idx]];
            return {
                player_id: player ? player.id : `p-unknown-${idx}`,
                position_name: node.roleLabel,
                x_coordinate: parseFloat(node.left),
                y_coordinate: parseFloat(node.top)
            };
        });

        const success = await saveSquadConfiguration({
            teamId: 't-egerton-fc',
            formation: formation,
            playerPositions: playerPositions,
            createdBy: 'u-user-current'
        });

        if (success) {
            showToast('Tactical plan successfully saved as draft to Supabase.');
        } else {
            showToast('Draft cache stored successfully in local database repository.');
        }
    };

    // Get active coordinate nodes for selected formation
    const activeCoordinates = coords.length === 11 ? coords : (formationCoordinates[formation] || formationCoordinates['4-4-1-1']);

    return (
        <div className="w-full space-y-stack-lg max-w-7xl mx-auto pb-16">
            {/* Top Manager & Team Logo Header Card */}
            <section className="relative overflow-hidden rounded-xl border border-outline-variant/20 p-6 md:p-8 bg-surface-container glass-panel shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Club Visual Identity */}
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-black/60 rounded-full flex items-center justify-center p-4 border border-primary/30 shadow-[0_0_15px_rgba(0,255,133,0.15)] group hover:border-primary transition-all duration-300">
                            <img
                                className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
                                alt="Egerton FC Crest"
                            />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight uppercase flex items-center gap-2">
                                Egerton FC
                                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
                                    EST  1889
                                </span>
                            </h2>
                            <p className="font-label-sm text-[10px] text-primary uppercase tracking-[0.25em] font-semibold mt-1">
                                National Division One Squad
                            </p>
                        </div>
                    </div>

                    {/* Manager / Leader Profile */}
                    <div className="flex items-center gap-4 bg-surface-container-high/40 border border-outline-variant/15 p-4 rounded-xl max-w-sm w-full">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 shadow-lg">
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDteyw-V_A48uLcneGlW7cgeLngBri-BHeWmtVMUVJq4f_1RCrsPb03Rmrrfhfx_RT4UKpV-3Np_5LITD5et4A-A402JUFQTwJsDtZglorFWsWr8K9K1EmdJm_LicD28rLs7pvavaN4ub3YLUEOcshwBnmyKoMMUttXQlVWmQOKHP-wkchSgauo-4eB2MAULvvw64Drt6Ih60JLAcv4SbP5XlPM2rRVNHr5mS6yWfH8_ugfsxJkX_DdauAAiKkqK_9XJfOx_OYzauUt"
                                alt="Marcus Thorne"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">COMMANDING COACH</p>
                            <h4 className="text-xs font-black text-on-surface uppercase">Marcus Thorne</h4>
                            <p className="text-[10px] text-primary mt-0.5">Tactics Room Authorized • Pro Registry</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Interactive Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

                {/* Left Panel: Pitch & Substitutes (Col span 8) */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    {/* Formation Selection Configuration Bar */}
                    <div className="bg-surface-container border border-outline-variant/15 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="font-label-sm text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Playstyle</span>
                            <select
                                value={activePlaystyle}
                                onChange={(e) => {
                                    if (currentRole === 'CAPTAIN') {
                                        showToast('Access Denied: Captains cannot modify strategic play styles.');
                                        return;
                                    }
                                    setActivePlaystyle(e.target.value);
                                    showToast(`Tactic updated to ${e.target.value}`);
                                }}
                                className="bg-surface-container-high border border-outline-variant/20 px-3 py-1.5 text-xs font-bold text-primary rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="Quick Counter">Quick Counter</option>
                                <option value="Possession Game">Possession Game</option>
                                <option value="Long Ball">Long Ball Tactic</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="font-label-sm text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Formation</span>
                            <select
                                value={formation}
                                onChange={(e) => {
                                    if (currentRole === 'CAPTAIN') {
                                        showToast('Access Denied: Captains cannot adjust squad formations.');
                                        return;
                                    }
                                    setFormation(e.target.value);
                                    showToast(`Formation adjusted to ${e.target.value}`);
                                }}
                                className="bg-surface-container-high border border-outline-variant/20 px-3 py-1.5 text-xs font-bold text-primary rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="4-4-1-1">4-4-1-1 Plan</option>
                                <option value="4-3-3">4-3-3 Attack</option>
                                <option value="4-2-3-1">4-2-3-1 Anchor</option>
                            </select>
                        </div>

                        <button
                            onClick={handleAutoPick}
                            className="bg-white/5 hover:bg-white/10 border border-outline-variant/20 px-4 py-1.5 rounded-lg font-label-sm text-[10px] font-bold text-on-surface uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            Auto Pick
                        </button>
                    </div>

                    {/* Interactive Pitch Layout */}
                    <div id="pitch-canvas-wrapper" className="relative rounded-xl border border-outline-variant/15 overflow-hidden aspect-[4/3] flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#162a19_0%,_#0b0f0b_100%)] shadow-inner select-none min-h-[380px] md:min-h-[460px]">
                        {/* Pitch Markings */}
                        <div className="absolute inset-8 border border-white/5 rounded-sm pointer-events-none">
                            <div className="absolute left-1/2 top-0 bottom-0 border-l border-white/5"></div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/5 rounded-full"></div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                            {/* Penalty Areas */}
                            <div className="absolute left-0 top-1/4 bottom-1/4 w-28 border-r border-y border-white/5"></div>
                            <div className="absolute right-0 top-1/4 bottom-1/4 w-28 border-l border-y border-white/5"></div>
                        </div>

                        {/* Players coordinating nodes on the field */}
                        <div className="absolute inset-0">
                            {activeCoordinates.map((node, gridIdx) => {
                                const rosterIndex = startingXI[gridIdx];
                                const player = roster[rosterIndex];
                                if (!player) return null;

                                const isSelected = selectedFieldSlot === gridIdx;

                                return (
                                    <div
                                        key={gridIdx}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 group"
                                        style={{ top: node.top, left: node.left }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFieldSlot(gridIdx);
                                            setShowSubDrawer(true);
                                        }}
                                        onMouseDown={(mouseDownEvent) => {
                                            if (currentRole !== 'COACH') return; // Only coach can adjust coordinates
                                            mouseDownEvent.preventDefault();
                                            const startX = mouseDownEvent.clientX;
                                            const startY = mouseDownEvent.clientY;
                                            const initialLeft = parseFloat(node.left);
                                            const initialTop = parseFloat(node.top);

                                            const container = document.getElementById('pitch-canvas-wrapper');
                                            if (!container) return;
                                            const rect = container.getBoundingClientRect();

                                            const onMouseMove = (moveEvent: MouseEvent) => {
                                                const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
                                                const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

                                                const newLeft = Math.max(2, Math.min(98, initialLeft + deltaX));
                                                const newTop = Math.max(2, Math.min(98, initialTop + deltaY));

                                                setCoords(prev => {
                                                    const updated = [...prev];
                                                    updated[gridIdx] = {
                                                        ...updated[gridIdx],
                                                        left: `${newLeft.toFixed(1)}%`,
                                                        top: `${newTop.toFixed(1)}%`
                                                    };
                                                    return updated;
                                                });
                                            };

                                            const onMouseUp = () => {
                                                document.removeEventListener('mousemove', onMouseMove);
                                                document.removeEventListener('mouseup', onMouseUp);
                                            };

                                            document.addEventListener('mousemove', onMouseMove);
                                            document.addEventListener('mouseup', onMouseUp);
                                        }}
                                        onTouchStart={(touchStartEvent) => {
                                            if (currentRole !== 'COACH') return;
                                            const touch = touchStartEvent.touches[0];
                                            const startX = touch.clientX;
                                            const startY = touch.clientY;
                                            const initialLeft = parseFloat(node.left);
                                            const initialTop = parseFloat(node.top);

                                            const container = document.getElementById('pitch-canvas-wrapper');
                                            if (!container) return;
                                            const rect = container.getBoundingClientRect();

                                            const onTouchMove = (moveEvent: TouchEvent) => {
                                                const moveTouch = moveEvent.touches[0];
                                                const deltaX = ((moveTouch.clientX - startX) / rect.width) * 100;
                                                const deltaY = ((moveTouch.clientY - startY) / rect.height) * 100;

                                                const newLeft = Math.max(2, Math.min(98, initialLeft + deltaX));
                                                const newTop = Math.max(2, Math.min(98, initialTop + deltaY));

                                                setCoords(prev => {
                                                    const updated = [...prev];
                                                    updated[gridIdx] = {
                                                        ...updated[gridIdx],
                                                        left: `${newLeft.toFixed(1)}%`,
                                                        top: `${newTop.toFixed(1)}%`
                                                    };
                                                    return updated;
                                                });
                                            };

                                            const onTouchEnd = () => {
                                                document.removeEventListener('touchmove', onTouchMove);
                                                document.removeEventListener('touchend', onTouchEnd);
                                            };

                                            document.addEventListener('touchmove', onTouchMove, { passive: true });
                                            document.addEventListener('touchend', onTouchEnd);
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black border transition-all duration-200 ${isSelected
                                                    ? 'bg-primary text-on-primary scale-110 shadow-[0_0_20px_rgba(0,255,133,0.6)] border-white'
                                                    : 'bg-primary/20 text-primary hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,133,0.2)] border-outline/30'
                                                    }`}
                                            >
                                                {player.number}
                                            </div>

                                            <div className="bg-background/80 backdrop-blur-sm border border-outline-variant/30 px-2 py-0.5 rounded text-[9px] font-label-sm font-bold text-white whitespace-nowrap opacity-90 group-hover:opacity-100">
                                                {node.roleLabel}: {player.name.split(' ').pop()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Click to dismiss tooltip */}
                        <div
                            className="absolute inset-0 z-10"
                            onClick={() => {
                                setSelectedFieldSlot(null);
                            }}
                        ></div>
                    </div>

                    {/* Substitutes Reserve Bench */}
                    <div className="bg-surface-container border border-outline-variant/15 p-6 rounded-xl space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
                            <h3 className="font-headline-md text-sm font-bold text-on-surface">Substitutes & Reserves Bench</h3>
                            <span className="text-on-surface-variant font-label-sm text-[10px] font-bold uppercase tracking-wider">{substitutes.length} Available</span>
                        </div>

                        {selectedFieldSlot !== null && (
                            <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-xs font-semibold animate-pulse">
                                🔄 Select a player below to replace <span className="text-white font-bold">{activeCoordinates[selectedFieldSlot].roleLabel}</span> ({roster[startingXI[selectedFieldSlot]]?.name}):
                            </div>
                        )}

                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                            {substitutes.map((player) => {
                                const globalIdx = roster.findIndex(p => p.id === player.id);
                                return (
                                    <div
                                        key={player.id}
                                        onClick={() => {
                                            if (selectedFieldSlot !== null) {
                                                handleSwap(globalIdx);
                                            } else {
                                                showToast(`Click a player node on the pitch first to swap in ${player.name}.`);
                                            }
                                        }}
                                        className="flex-shrink-0 w-28 bg-surface-container-high/40 p-2.5 rounded-lg border border-outline-variant/15 hover:border-primary hover:scale-[1.02] cursor-pointer transition select-none flex flex-col justify-between"
                                    >
                                        <div className="relative w-full aspect-square rounded overflow-hidden select-none bg-surface-container-highest/20">
                                            <img src={player.cardImage} alt="" className="w-full h-full object-cover pointer-events-none" />
                                            <div className="absolute top-1 right-1 bg-black/60 border border-outline-variant/30 px-1 rounded text-[8px] font-bold text-white leading-none">
                                                #{player.number}
                                            </div>
                                        </div>
                                        <div className="mt-2.5">
                                            <p className="font-label-sm text-[9px] font-bold text-on-surface truncate">{player.name.split(' ').pop()}</p>
                                            <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${player.stamina}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Logistics and Extra Details (Col span 4) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-6 space-y-6 flex-1 flex flex-col justify-between shadow-lg">
                        <div className="space-y-6">
                            <h3 className="font-headline-md text-sm font-bold text-on-surface border-b border-outline-variant/15 pb-3">Extra Tactical Information</h3>

                            {/* Fine-Tuning Coordinates panel */}
                            {selectedFieldSlot !== null && activeCoordinates[selectedFieldSlot] && (
                                <div className="bg-surface-container-high/60 border border-outline-variant/25 p-4 rounded-xl space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-xs uppercase text-primary tracking-wider flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">tune</span>
                                        Fine-Tune Coordinates
                                    </h4>
                                    <p className="text-[10px] text-on-surface-variant font-medium">
                                        Adjust position for {activeCoordinates[selectedFieldSlot].roleLabel} ({roster[startingXI[selectedFieldSlot]]?.name || 'Empty'}):
                                    </p>

                                    <div className="space-y-3 text-[10px] font-bold">
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>X-Coordinate (Left %)</span>
                                                <span className="text-primary font-mono">{parseFloat(activeCoordinates[selectedFieldSlot].left).toFixed(1)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                disabled={currentRole !== 'COACH'}
                                                value={parseFloat(activeCoordinates[selectedFieldSlot].left)}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setCoords(prev => {
                                                        const updated = [...prev];
                                                        updated[selectedFieldSlot] = {
                                                            ...updated[selectedFieldSlot],
                                                            left: `${val}%`
                                                        };
                                                        return updated;
                                                    });
                                                }}
                                                className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>Y-Coordinate (Top %)</span>
                                                <span className="text-primary font-mono">{parseFloat(activeCoordinates[selectedFieldSlot].top).toFixed(1)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                disabled={currentRole !== 'COACH'}
                                                value={parseFloat(activeCoordinates[selectedFieldSlot].top)}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setCoords(prev => {
                                                        const updated = [...prev];
                                                        updated[selectedFieldSlot] = {
                                                            ...updated[selectedFieldSlot],
                                                            top: `${val}%`
                                                        };
                                                        return updated;
                                                    });
                                                }}
                                                className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Collective team strength rating */}
                            <div className="bg-surface-container-high/40 border border-outline-variant/20 p-4 rounded-xl">
                                <span className="font-label-sm text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Collective Team Strength</span>
                                <span className="block mt-1 font-mono font-black text-3xl text-primary tracking-tighter">{collectiveStrength}</span>
                                <div className="mt-3 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                                        style={{ width: `${Math.min(100, (collectiveStrength - 500) / 10)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Logistics Details: Venue */}
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-primary text-2xl">stadium</span>
                                <div>
                                    <p className="font-label-sm text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">VENUE</p>
                                    <p className="text-xs font-bold text-on-surface mt-1">Egerton Arena Stadium</p>
                                    <p className="text-[10px] text-on-surface-variant mt-0.5">Capacity: 22,500 • Turf: Hybrid Grass</p>
                                </div>
                            </div>

                            {/* Officials */}
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-primary text-2xl">sports</span>
                                <div>
                                    <p className="font-label-sm text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">OFFICIALS</p>
                                    <p className="text-xs font-bold text-on-surface mt-1">Mark Oliver (Main Referee)</p>
                                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-background/50 rounded-md text-[8px] text-on-surface-variant font-mono border border-outline-variant/20">VAR Ref: Simon Fox</span>
                                </div>
                            </div>

                            {/* Forecast/Conditions */}
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-primary text-2xl">sunny</span>
                                <div>
                                    <p className="font-label-sm text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">CONDITIONS</p>
                                    <p className="text-xs font-bold text-on-surface mt-1">12°C Clear Skies</p>
                                    <p className="text-[10px] text-on-surface-variant mt-0.5">Wind: 4mph NW • Humidity: 45%</p>
                                </div>
                            </div>
                        </div>

                        {/* Lineup Save and Submission Controls */}
                        <div className="space-y-3 pt-6 border-t border-outline-variant/15">
                            <button
                                onClick={handleSubmitLineup}
                                className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-xs tracking-wider uppercase shadow-lg shadow-primary/20 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">how_to_reg</span>
                                SUBMIT SELECTION
                            </button>

                            <button
                                onClick={handleSaveDraft}
                                className="w-full border border-outline-variant/30 text-on-surface py-3.5 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer font-bold"
                            >
                                SAVE DRAFT PLAN
                            </button>

                            <p className="text-[9px] text-center text-on-surface-variant uppercase font-medium tracking-wider mt-2">
                                🔒 SECURED ACCESS BY {currentRole}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
