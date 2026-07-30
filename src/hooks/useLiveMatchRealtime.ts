import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Match, MatchEvent, MatchStatus } from '../types';
import type { ToastItem } from '../components/common/ToastContainer';
import { logger } from '../lib/logger';

// Global Event Emitter for Client Realtime Broadcast Fallback
type EventCallback = (data: { event: MatchEvent; updatedMatch?: Partial<Match> }) => void;
const subscribers = new Set<EventCallback>();

export const broadcastLocalRealtimeEvent = (event: MatchEvent, updatedMatch?: Partial<Match>) => {
  subscribers.forEach((cb) => cb({ event, updatedMatch }));
};

export const useLiveMatchRealtime = (
  initialMatches: Match[],
  onMatchUpdated?: (matches: Match[]) => void
) => {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const matchesRef = useRef<Match[]>(initialMatches);

  useEffect(() => {
    setMatches(initialMatches);
    matchesRef.current = initialMatches;
  }, [initialMatches]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 queued

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Process live match event update
  const processMatchEvent = useCallback(
    (evt: MatchEvent, updatedMatch?: Partial<Match>) => {
      setMatches((prevMatches) => {
        const nextMatches = prevMatches.map((m) => {
          if (m.id !== (evt.fixtureId || updatedMatch?.id || prevMatches[0]?.id)) {
            return m;
          }

          let scoreA = m.scoreA;
          let scoreB = m.scoreB;
          let status: MatchStatus = m.status;
          let minute = m.minute;

          if (evt.eventTarget === 'home' && evt.type === 'goal') {
            scoreA = (updatedMatch?.scoreA !== undefined) ? updatedMatch.scoreA : scoreA + 1;
          } else if (evt.eventTarget === 'away' && evt.type === 'goal') {
            scoreB = (updatedMatch?.scoreB !== undefined) ? updatedMatch.scoreB : scoreB + 1;
          }

          if (evt.type === 'kickoff') {
            status = 'LIVE';
            minute = "1'";
          } else if (evt.type === 'ht') {
            status = 'HT';
            minute = 'HT';
          } else if (evt.type === 'second_half') {
            status = 'LIVE';
            minute = "46'";
          } else if (evt.type === 'ft') {
            status = 'FT';
            minute = 'FT';
          } else if (evt.type === 'suspended') {
            status = 'POSTPONED';
          } else if (evt.type === 'resumed') {
            status = 'LIVE';
          }

          if (updatedMatch?.status) status = updatedMatch.status as MatchStatus;

          let newEvents = [...(m.events || [])];
          if (evt.isOfficial) {
            // REFEREE OVERRIDE MECHANISM:
            // Remove any temporary unverified journalist news event for the same minute & target
            newEvents = newEvents.filter(
              (e) => !(e.isOfficial === false && e.minute === evt.minute && e.type === evt.type && e.eventTarget === evt.eventTarget)
            );
          }

          if (!newEvents.some((e) => e.id === evt.id)) {
            newEvents.push(evt);
          }

          return {
            ...m,
            scoreA,
            scoreB,
            status,
            minute,
            events: newEvents
          };
        });

        if (onMatchUpdated) {
          onMatchUpdated(nextMatches);
        }
        return nextMatches;
      });

      // Generate Toast
      let toastIcon = '⚡';
      let toastTitle = 'Match Update';
      let toastType: ToastItem['type'] = 'info';

      switch (evt.type) {
        case 'goal':
          toastIcon = '⚽';
          toastTitle = 'GOAL!';
          toastType = 'goal';
          break;
        case 'yellow':
          toastIcon = '🟨';
          toastTitle = 'Yellow Card';
          toastType = 'yellow';
          break;
        case 'red':
          toastIcon = '🟥';
          toastTitle = 'Red Card!';
          toastType = 'red';
          break;
        case 'injury':
          toastIcon = '🤕';
          toastTitle = 'Injury Time-out';
          toastType = 'injury';
          break;
        case 'sub_in':
        case 'sub_out':
          toastIcon = '🔄';
          toastTitle = 'Substitution';
          toastType = 'sub';
          break;
        case 'kickoff':
          toastIcon = '⚽';
          toastTitle = 'Match Kickoff!';
          toastType = 'status';
          break;
        case 'ht':
          toastIcon = '⏸';
          toastTitle = 'Half Time';
          toastType = 'status';
          break;
        case 'second_half':
          toastIcon = '▶';
          toastTitle = 'Second Half Started';
          toastType = 'status';
          break;
        case 'ft':
          toastIcon = '🏁';
          toastTitle = 'Full Time - Match Ended';
          toastType = 'status';
          break;
      }

      addToast({
        icon: toastIcon,
        title: toastTitle,
        message: evt.detailText || `Event recorded at ${evt.minute}'`,
        type: toastType
      });
    },
    [addToast, onMatchUpdated]
  );

  // Subscribe to Supabase Realtime postgres_changes + Local fallback subscriber
  useEffect(() => {
    const localCallback: EventCallback = ({ event, updatedMatch }) => {
      processMatchEvent(event, updatedMatch);
    };
    subscribers.add(localCallback);

    const channelId = `live_match_channel_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setMatches((prev) =>
              prev.map((m) => {
                if (m.id === updated.id) {
                  return {
                    ...m,
                    scoreA: updated.score_home ?? m.scoreA,
                    scoreB: updated.score_away ?? m.scoreB,
                    status: updated.status ?? m.status
                  };
                }
                return m;
              })
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events' },
        (payload) => {
          if (payload.new) {
            const raw = payload.new as any;
            const evt: MatchEvent = {
              id: raw.id,
              fixtureId: raw.fixture_id,
              minute: raw.minute,
              type: raw.type,
              eventTarget: raw.event_target,
              teamId: raw.team_id,
              detailText: raw.detail_text,
              createdAt: raw.created_at
            };
            processMatchEvent(evt);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn(`Supabase Realtime channel status: ${status}`, { error: err?.message });
        }
      });

    return () => {
      subscribers.delete(localCallback);
      supabase.removeChannel(channel).catch((err) => {
        logger.warn('Error removing Supabase channel on unmount', { error: err });
      });
    };
  }, [processMatchEvent]);

  return {
    matches,
    toasts,
    dismissToast,
    processMatchEvent
  };
};
