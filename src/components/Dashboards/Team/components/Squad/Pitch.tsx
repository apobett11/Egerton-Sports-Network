import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Player, FormationType, Playstyle } from './types';
import { PlayerCard } from './PlayerCard';

interface PitchProps {
  players: Player[];
  formation: FormationType;
  playstyle: Playstyle;
  onSwapPlayers: (sourcePlayerId: string, targetPlayerId: string) => void;
  onMovePlayer: (playerId: string, coord: { x: number; y: number }) => void;
  onOpenFormationModal: () => void;
  onOpenPlaystyleModal: () => void;
  isCoach?: boolean;
}

export const Pitch: React.FC<PitchProps> = ({
  players,
  formation,
  playstyle,
  onSwapPlayers,
  onMovePlayer,
  onOpenFormationModal,
  onOpenPlaystyleModal,
}) => {
  const [viewMode, setViewMode] = useState<'standard' | 'detailed'>('standard');
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [currentDragCoord, setCurrentDragCoord] = useState<{ x: number; y: number } | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; moved: boolean } | null>(null);

  // Check if currently CSS rotated in mobile portrait mode
  const getIsRotated = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth && window.innerWidth <= 860;
  }, []);

  // Compute coordinate with orientation intelligence
  const calculatePitchCoords = useCallback((clientX: number, clientY: number) => {
    if (!pitchRef.current) return { x: 50, y: 50 };
    const rect = pitchRef.current.getBoundingClientRect();
    const isRotated = getIsRotated();

    if (isRotated) {
      // 90deg clockwise rotated container:
      // Visual X maps to physical screen Y
      // Visual Y maps to physical screen right-X
      const rawX = ((clientY - rect.top) / rect.height) * 100;
      const rawY = ((rect.right - clientX) / rect.width) * 100;
      return {
        x: Math.max(9, Math.min(91, rawX)),
        y: Math.max(6, Math.min(91, rawY)),
      };
    } else {
      // Standard / Native landscape
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(9, Math.min(91, rawX)),
        y: Math.max(6, Math.min(91, rawY)),
      };
    }
  }, [getIsRotated]);

  // Touch Move / Drag Engine
  const handleDragUpdate = useCallback((clientX: number, clientY: number) => {
    if (!activeDragId || !pitchRef.current) return;

    const newCoords = calculatePitchCoords(clientX, clientY);
    setCurrentDragCoord(newCoords);

    // Smart Proximity Hit Testing
    let target: string | null = null;
    const minDistance = 12;

    for (const p of players) {
      if (p.id === activeDragId) continue;
      const px = p.coord?.x ?? 50;
      const py = p.coord?.y ?? 50;

      const dist = Math.hypot((px - newCoords.x) * 1.05, (py - newCoords.y) * 0.95);
      if (dist < minDistance) {
        target = p.id;
        break;
      }
    }

    setSwapTargetId(target);
  }, [activeDragId, calculatePitchCoords, players]);

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent, player: Player) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!pitchRef.current) return;

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false,
    };

    setActiveDragId(player.id);
    setCurrentDragCoord({
      x: player.coord?.x ?? 50,
      y: player.coord?.y ?? 50,
    });
    setSwapTargetId(null);
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragId || !dragStartRef.current) return;

    const dx = Math.abs(e.clientX - dragStartRef.current.clientX);
    const dy = Math.abs(e.clientY - dragStartRef.current.clientY);

    if (dx > 3 || dy > 3) {
      dragStartRef.current.moved = true;
    }

    handleDragUpdate(e.clientX, e.clientY);
  };

  // Pointer Up handler
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeDragId) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (swapTargetId && swapTargetId !== activeDragId) {
      onSwapPlayers(activeDragId, swapTargetId);
    } else if (dragStartRef.current?.moved && currentDragCoord) {
      onMovePlayer(activeDragId, currentDragCoord);
    }

    setActiveDragId(null);
    setCurrentDragCoord(null);
    setSwapTargetId(null);
    dragStartRef.current = null;
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent, player: Player) => {
    const touch = e.touches[0];
    if (!touch || !pitchRef.current) return;

    dragStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      moved: false,
    };

    setActiveDragId(player.id);
    setCurrentDragCoord({
      x: player.coord?.x ?? 50,
      y: player.coord?.y ?? 50,
    });
    setSwapTargetId(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !activeDragId || !dragStartRef.current) return;

    const dx = Math.abs(touch.clientX - dragStartRef.current.clientX);
    const dy = Math.abs(touch.clientY - dragStartRef.current.clientY);

    if (dx > 3 || dy > 3) {
      dragStartRef.current.moved = true;
    }

    handleDragUpdate(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!activeDragId) return;

    if (swapTargetId && swapTargetId !== activeDragId) {
      onSwapPlayers(activeDragId, swapTargetId);
    } else if (dragStartRef.current?.moved && currentDragCoord) {
      onMovePlayer(activeDragId, currentDragCoord);
    }

    setActiveDragId(null);
    setCurrentDragCoord(null);
    setSwapTargetId(null);
    dragStartRef.current = null;
  };

  // HTML5 Drag & Drop handlers
  const handleHTML5DropOnPlayer = (e: React.DragEvent, targetPlayer: Player) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetPlayer.id) {
      onSwapPlayers(sourceId, targetPlayer.id);
    }
  };

  const handleHTML5DropOnPitch = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || !pitchRef.current) return;

    const newCoords = calculatePitchCoords(e.clientX, e.clientY);
    onMovePlayer(sourceId, newCoords);
  };

  return (
    <div className="relative flex-1 h-full max-w-[620px] mx-auto flex flex-col justify-between select-none touch-none">
      {/* Top Labels: Formation (Left) & Playstyle (Right) */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-3 pb-0 text-white font-bold">
        <button
          onClick={onOpenFormationModal}
          className="text-[17px] font-sans font-bold tracking-wide hover:text-[#00d2ff] transition-colors focus:outline-none drop-shadow-md cursor-pointer"
        >
          <span>{formation}</span>
        </button>

        <button
          onClick={onOpenPlaystyleModal}
          className="text-[16px] font-sans font-semibold tracking-normal text-white hover:text-[#e2f800] transition-colors focus:outline-none drop-shadow-md cursor-pointer"
        >
          <span>{playstyle}</span>
        </button>
      </div>

      {/* Main Pitch Field Graphic Area */}
      <div
        ref={pitchRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleHTML5DropOnPitch}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="relative flex-1 w-full mx-auto px-2 overflow-hidden touch-none"
      >
        {/* Subtle Pitch Grass Turf Texture */}
        <div className="absolute inset-0 mx-4 pointer-events-none opacity-40 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_10%,transparent_20%,rgba(255,255,255,0.03)_30%,transparent_40%,rgba(255,255,255,0.03)_50%,transparent_60%,rgba(255,255,255,0.03)_70%,transparent_80%,rgba(255,255,255,0.03)_90%,transparent_100%)]" />

        {/* Free Move Tactical Grid Lines Overlay (active when isMoveMode) */}
        {isMoveMode && (
          <div className="absolute inset-0 mx-4 pointer-events-none opacity-25 bg-[linear-gradient(to_right,#00d2ff_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff_1px,transparent_1px)] bg-[size:36px_36px] animate-in fade-in duration-200" />
        )}

        {/* Top-down Pitch Markings SVG */}
        <svg
          viewBox="0 0 500 560"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          preserveAspectRatio="none"
        >
          {/* Pitch Outer Border */}
          <rect
            x="32"
            y="8"
            width="436"
            height="544"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
          />

          {/* Center Circle & Halfway Line (at top) */}
          <line x1="32" y1="8" x2="468" y2="8" stroke="white" strokeWidth="2.2" />
          <circle cx="250" cy="8" r="75" fill="none" stroke="white" strokeWidth="1.8" />
          <circle cx="250" cy="8" r="2.8" fill="white" />

          {/* Penalty Arc (above 18-yard box) */}
          <path
            d="M 195 385 C 215 350, 285 350, 305 385"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
          />

          {/* Penalty Area Box (18-yard box) */}
          <rect
            x="118"
            y="385"
            width="264"
            height="167"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
          />

          {/* Penalty Spot */}
          <circle cx="250" cy="455" r="2.8" fill="white" />

          {/* Goal Area Box (6-yard box) */}
          <rect
            x="180"
            y="492"
            width="140"
            height="60"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
          />

          {/* Corner Arcs */}
          <path d="M 32 24 A 16 16 0 0 0 48 8" fill="none" stroke="white" strokeWidth="1.6" />
          <path d="M 452 8 A 16 16 0 0 0 468 24" fill="none" stroke="white" strokeWidth="1.6" />
          <path d="M 32 536 A 16 16 0 0 0 48 552" fill="none" stroke="white" strokeWidth="1.6" />
          <path d="M 452 552 A 16 16 0 0 0 468 536" fill="none" stroke="white" strokeWidth="1.6" />
        </svg>

        {/* All Players on Pitch Layer with Touch & Drag Engine */}
        {players.map((player) => {
          const isDraggingThis = activeDragId === player.id;
          const isSwapTargetThis = swapTargetId === player.id;

          const xPos = isDraggingThis && currentDragCoord ? currentDragCoord.x : (player.coord?.x ?? 50);
          const yPos = isDraggingThis && currentDragCoord ? currentDragCoord.y : (player.coord?.y ?? 50);

          return (
            <div
              key={player.id}
              onPointerDown={(e) => handlePointerDown(e, player)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onTouchStart={(e) => handleTouchStart(e, player)}
              style={{
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: isDraggingThis
                  ? 'translate(-50%, -50%) scale(1.14) rotate(1.5deg)'
                  : 'translate(-50%, -50%)',
                transition: isDraggingThis
                  ? 'none'
                  : 'left 0.35s cubic-bezier(0.2, 0.85, 0.3, 1), top 0.35s cubic-bezier(0.2, 0.85, 0.3, 1), transform 0.2s ease',
                zIndex: isDraggingThis ? 50 : isSwapTargetThis ? 40 : 20,
              }}
              className={`absolute touch-none cursor-grab active:cursor-grabbing ${
                isDraggingThis ? 'card-dragging-glow' : ''
              }`}
            >
              <PlayerCard
                player={player}
                isDragging={isDraggingThis}
                isSwapTarget={isSwapTargetThis}
                onDrop={handleHTML5DropOnPlayer}
                viewMode={viewMode}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Pitch Tactical Bar matching screenshot WA0046 */}
      <div className="relative z-30 flex items-center justify-between px-8 pb-3 pt-0 pointer-events-none">
        {/* Left: Reposition / Free Move Toggle Button */}
        <button
          onClick={() => setIsMoveMode(!isMoveMode)}
          title={isMoveMode ? 'Tactical Grid Active' : 'Toggle Tactical Grid'}
          className={`w-[46px] h-[46px] sm:w-[48px] sm:h-[48px] rounded-full border-2 border-white flex items-center justify-center transition-all pointer-events-auto shadow-lg active:scale-95 focus:outline-none cursor-pointer ${
            isMoveMode ? 'bg-[#0085ff] shadow-[0_0_16px_#0085ff]' : 'bg-[#060b18]/80 hover:bg-white/20'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white pointer-events-none">
            <rect x="11" y="4" width="2" height="16" />
            <rect x="4" y="11" width="16" height="2" />
            <polygon points="12,1 8,6 16,6" />
            <polygon points="12,23 8,18 16,18" />
            <polygon points="1,12 6,8 6,16" />
            <polygon points="23,12 18,8 18,16" />
          </svg>
        </button>

        {/* Center: Unobstructed corridor for GK card */}
        <div className="flex-1 pointer-events-none" />

        {/* Right Action Icons Group matching WA0046 */}
        <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          {/* View Mode Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === 'standard' ? 'detailed' : 'standard')}
            title="Switch Player View"
            className={`w-[46px] h-[46px] sm:w-[48px] sm:h-[48px] rounded-full border-2 border-white flex items-center justify-center transition-all shadow-lg active:scale-95 focus:outline-none cursor-pointer ${
              viewMode === 'detailed' ? 'bg-[#0085ff] shadow-[0_0_12px_#0085ff]' : 'bg-[#060b18]/80 hover:bg-white/20'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-none stroke-white stroke-[2] pointer-events-none">
              <circle cx="12" cy="8" r="4" />
              <path d="M 4,20 C 4,15 8,14 12,14 C 16,14 20,15 20,20" strokeLinecap="round" />
            </svg>
          </button>

          {/* Camera / Screenshot Button */}
          <button
            onClick={() => {
              const el = document.body;
              el.classList.add('brightness-125');
              setTimeout(() => el.classList.remove('brightness-125'), 150);
            }}
            title="Take Tactical Screenshot"
            className="w-[48px] h-[48px] rounded-full border-2 border-white bg-[#060b18]/80 hover:bg-white/20 flex items-center justify-center transition-all shadow-lg active:scale-95 focus:outline-none cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-none stroke-white stroke-[2] pointer-events-none">
              <path d="M 4,7 L 7,7 L 9,4 L 15,4 L 17,7 L 20,7 C 21.1,7 22,7.9 22,9 L 22,19 C 22,20.1 21.1,21 20,21 L 4,21 C 2.9,21 2,20.1 2,19 L 2,9 C 2,7.9 2.9,7 4,7 Z" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
