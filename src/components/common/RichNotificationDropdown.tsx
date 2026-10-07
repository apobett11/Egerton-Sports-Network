import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import { BroadcastService, getScheduledDelayMs, type BroadcastNotification, type BroadcastReactions } from '../../services/broadcastService';

interface RichNotificationDropdownProps {
  onNavigate?: (url: string) => void;
}

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant two-tone chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
};

export const RichNotificationDropdown: React.FC<RichNotificationDropdownProps> = ({ onNavigate }) => {
  const [activeNotification, setActiveNotification] = useState<BroadcastNotification | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);
  const [userReacted, setUserReacted] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Auto-dismiss helper
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (activeNotification?.id) {
      BroadcastService.markBroadcastSeen(activeNotification.id);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setTimeout(() => {
      setActiveNotification(null);
      setProgress(100);
      setUserReacted(null);
    }, 300);
  }, [activeNotification]);

  // Display and start timer for incoming notification
  const displayNotification = useCallback((notif: BroadcastNotification) => {
    if (!notif || !notif.title) return;
    // Prevent duplicate triggers
    if (notif.id && processedIdsRef.current.has(notif.id)) {
      return;
    }
    if (notif.id) {
      processedIdsRef.current.add(notif.id);
    }

    // Audio chime
    playNotificationSound();

    // Haptics for mobile devices
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 60, 120]);
      }
    } catch {}

    // Record impression
    BroadcastService.recordImpression(notif.id);

    setActiveNotification(notif);
    setIsVisible(true);
    setProgress(100);
    setUserReacted(null);

    // Duration: 9s if has image, 6s if text-only
    const durationMs = notif.image_url ? 9000 : 6000;
    const startTime = Date.now();

    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
    }, 100);

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, durationMs);
  }, [handleDismiss]);

  // Check on mount for latest unseen broadcast (0 realtime, 0 background CPU)
  useEffect(() => {
    let isMounted = true;
    let scheduleTimer: any = null;

    const handleIncoming = (notif: BroadcastNotification) => {
      if (!isMounted || !notif || !notif.id) return;
      const lastSeenId = localStorage.getItem('esn_last_seen_broadcast_id');
      if (notif.id === lastSeenId) return;

      const delay = getScheduledDelayMs(notif.scheduled_for);
      if (delay > 0) {
        // Scheduled for exact future time (e.g. 8:20 PM)
        if (scheduleTimer) clearTimeout(scheduleTimer);
        scheduleTimer = setTimeout(() => {
          if (isMounted) {
            displayNotification(notif);
          }
        }, delay);
      } else {
        // Immediate or already due
        displayNotification(notif);
      }
    };

    // Polite delay before showing unseen broadcasts so they don't fire instantly on 1st second
    const initialDelayTimer = setTimeout(() => {
      BroadcastService.getLatestUnseenBroadcast().then((notif) => {
        if (notif && isMounted) {
          handleIncoming(notif);
        }
      });
    }, 5000);

    // Local dispatch event listener (zero network cost)
    const handleDispatched = (e: any) => {
      if (e?.detail) {
        handleIncoming(e.detail);
      }
    };
    window.addEventListener('esn_broadcast_dispatched', handleDispatched);

    return () => {
      isMounted = false;
      clearTimeout(initialDelayTimer);
      if (scheduleTimer) clearTimeout(scheduleTimer);
      window.removeEventListener('esn_broadcast_dispatched', handleDispatched);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [displayNotification]);

  // Handle Pause on Hover
  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleMouseLeave = () => {
    if (!activeNotification) return;
    const remainingTime = (progress / 100) * (activeNotification.image_url ? 9000 : 6000);
    if (remainingTime > 300) {
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const elapsed = Date.now() - startTime;
          return Math.max(0, prev - (elapsed / remainingTime) * prev);
        });
      }, 50);

      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, remainingTime);
    } else {
      handleDismiss();
    }
  };

  // Card click navigation
  const handleCardClick = () => {
    if (!activeNotification) return;
    const targetUrl = activeNotification.action_url || '#/banter';

    // Record click telemetry
    BroadcastService.recordClick(activeNotification.id);

    handleDismiss();

    if (onNavigate) {
      onNavigate(targetUrl);
    } else {
      window.location.hash = targetUrl.replace(/^#\/?/, '/');
    }
  };

  // Reaction click
  const handleReactionClick = async (
    e: React.MouseEvent,
    type: 'fire' | 'soccer' | 'trophy' | 'like'
  ) => {
    e.stopPropagation();
    if (!activeNotification) return;

    setUserReacted(type);
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40]);
      }
    } catch {}

    const updated = await BroadcastService.recordReaction(activeNotification.id, type);
    if (updated) {
      setActiveNotification((curr) => curr ? { ...curr, reactions: updated } : null);
    }
  };

  if (!activeNotification || !isVisible) {
    return null;
  }

  // Format message text to handle literal "\n" or "/n" as actual line breaks
  const formattedMessage = activeNotification.message
    ? activeNotification.message.replace(/\\n|\/n/g, '\n')
    : '';

  const reactions: BroadcastReactions = activeNotification.reactions || {
    fire: 0,
    soccer: 0,
    trophy: 0,
    like: 0,
    clicks: 0,
    impressions: 0,
  };

  const categoryLabel = (activeNotification.category || 'DERBY').toUpperCase();

  return (
    <div
      className="fixed top-2 sm:top-3 left-3 right-3 sm:left-auto sm:right-4 z-[9999] flex justify-end pointer-events-none select-none"
      role="alert"
      aria-live="assertive"
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        className={`max-w-[340px] sm:max-w-[360px] w-full bg-[#09111c]/95 border border-purple-500/35 backdrop-blur-xl rounded-xl shadow-xl shadow-black/70 p-2.5 sm:p-3 transition-all duration-300 pointer-events-auto cursor-pointer relative overflow-hidden group hover:border-purple-400/60 ${
          isVisible ? 'animate-in slide-in-from-top-4 duration-300 opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
        }`}
      >
        {/* Top Bar: Official Branding + Category Badge + Just Now + Close */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Official EgerScore Badge & Category Pill */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* EgerScore crest/logo thumbnail */}
            <div className="w-5 h-5 object-contain rounded-md bg-purple-600/20 p-0.5 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M12 2L4 5.5V11.5C4 16.8 7.4 21.2 12 22.5C16.6 21.2 20 16.8 20 11.5V5.5L12 2Z" fill="#ff0046" />
                <path d="M12 4L5.5 6.8V11.5C5.5 15.8 8.3 19.4 12 20.6C15.7 19.4 18.5 15.8 18.5 11.5V6.8L12 4Z" fill="#0e1e2d" opacity="0.3" />
                <path d="M8.5 7.5H15.5V9.3H11V11.2H14.5V13H11V15.2H15.5V17H8.5V7.5Z" fill="#ffffff" />
              </svg>
            </div>

            {/* Platform Identifier + Category */}
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-[10px] font-black text-white tracking-tight shrink-0 flex items-center gap-0.5">
                egerscore.com
                <ShieldCheck className="w-2.5 h-2.5 text-purple-400 fill-purple-400/20" />
              </span>
              <span className="text-zinc-600 text-[10px]">•</span>
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded-full border border-purple-500/30 truncate">
                {categoryLabel}
              </span>
            </div>
          </div>

          {/* Right: Relative Timestamp + Dismiss Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] text-zinc-400 font-medium">Just now</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Area with optional Side Thumbnail Media */}
        <div className="flex items-start gap-2.5 mt-2">
          {activeNotification.image_url && (
            <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden border border-zinc-800 bg-zinc-900 relative shadow-inner">
              <img
                src={activeNotification.image_url}
                alt={activeNotification.title}
                className="w-full h-full object-cover"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('derby-notification.png')) {
                    target.src = '/derby-notification.png';
                  }
                }}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="text-[11.5px] sm:text-xs font-black text-white leading-tight tracking-tight line-clamp-1">
              {activeNotification.title}
            </h4>
            <p className="text-[10px] sm:text-[10.5px] text-zinc-300 leading-snug mt-0.5 whitespace-pre-line font-medium line-clamp-2">
              {formattedMessage}
            </p>
          </div>
        </div>

        {/* Interactive Reactions Bar + Action Prompt */}
        <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
          {/* Emoji Reactions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => handleReactionClick(e, 'fire')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-90 ${
                userReacted === 'fire'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
              title="Hyped / Fire"
            >
              <span className="text-[10px]">🔥</span>
              <span className="text-[9px] font-mono">{reactions.fire || 0}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleReactionClick(e, 'soccer')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-90 ${
                userReacted === 'soccer'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
              title="Soccer / Derby"
            >
              <span className="text-[10px]">⚽</span>
              <span className="text-[9px] font-mono">{reactions.soccer || 0}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleReactionClick(e, 'trophy')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-90 ${
                userReacted === 'trophy'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
              title="Prediction Win"
            >
              <span className="text-[10px]">🏆</span>
              <span className="text-[9px] font-mono">{reactions.trophy || 0}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleReactionClick(e, 'like')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-90 ${
                userReacted === 'like'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
              title="Like"
            >
              <span className="text-[10px]">👍</span>
              <span className="text-[9px] font-mono">{reactions.like || 0}</span>
            </button>
          </div>

          {/* Action Link Prompt */}
          <div className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
            <span>View Details</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Dynamic Countdown Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 transition-all duration-75 ease-linear shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
