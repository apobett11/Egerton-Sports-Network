import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Match, MatchEvent, MatchStatus } from '../types';
import type { ToastItem } from '../components/common/ToastContainer';
import { logger } from '../lib/logger';

import { ApiService } from '../services/api';
import { guestCache } from '../lib/guestCache';

// Global Event Emitter for Client Realtime Broadcast Fallback
type EventCallback = (data: { event: MatchEvent; updatedMatch?: Partial<Match> }) => void;
const subscribers = new Set<EventCallback>();

export const broadcastLocalRealtimeEvent = (event: MatchEvent, updatedMatch?: Partial<Match>) => {
  subscribers.forEach((cb) => cb({ event, updatedMatch }));
};

export interface UseLiveMatchRealtimeOptions {
  autoFetchAll?: boolean;
  selectedDate?: string;
  competitionId?: string;
}

const EMPTY_MATCHES: Match[] = [];

export const useLiveMatchRealtime = (
  initialMatches: Match[] = EMPTY_MATCHES,
  onMatchUpdated?: (matches: Match[]) => void,
  options?: UseLiveMatchRealtimeOptions
) => {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const matchesRef = useRef<Match[]>(initialMatches);
  const initialMatchesRef = useRef(initialMatches);

  const hasFetchedInitialRef = useRef(false);

  useEffect(() => {
    const seeded = initialMatchesRef.current;
    if (seeded && seeded.length > 0) {
      setMatches(seeded);
      matchesRef.current = seeded;
      return;
    }

    // 1. Seed immediately from cache so initial paint is instant (zero delay)
    const exactKey = options?.selectedDate
      ? `${options?.competitionId || 'all'}_${options.selectedDate}_pall_sall`
      : 'all_all_pall_sall';
    const cached = guestCache.peek<Match[]>('fixtures', exactKey) || guestCache.getStale<Match[]>('fixtures', exactKey);
    if (cached && cached.length > 0) {
      setMatches(cached);
      matchesRef.current = cached;
    }

    if (options?.autoFetchAll === false) {
      return;
    }

    // 2. Fetch latest fixtures from DB on page load if autoFetchAll enabled
    const fetchCall = options?.selectedDate
      ? ApiService.getFixtures(options.competitionId, options.selectedDate)
      : ApiService.getFixtures();

    fetchCall.then((res) => {
      if (res.data && res.data.length > 0) {
        setMatches(res.data);
        matchesRef.current = res.data;
        if (onMatchUpdated) onMatchUpdated(res.data);
      }
    }).catch(() => {});
  }, [options?.autoFetchAll, options?.selectedDate, options?.competitionId, onMatchUpdated]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 queued

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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

  // Local Event Broadcast Subscriber (no idle backend WebSockets)
  useEffect(() => {
    const localCallback: EventCallback = ({ event, updatedMatch }) => {
      processMatchEvent(event, updatedMatch);
    };
    subscribers.add(localCallback);

    return () => {
      subscribers.delete(localCallback);
    };
  }, [processMatchEvent]);

  return {
    matches,
    toasts,
    dismissToast,
    processMatchEvent
  };
};
