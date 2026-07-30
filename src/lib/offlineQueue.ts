import { ApiService } from '../services/api';
import type { MatchEventType, MatchStatus } from '../types';
import { logger } from './logger';

export interface QueuedMatchAction {
  id: string; // Idempotency key / unique payload identifier
  timestamp: number;
  fixtureId: string;
  type: 'event' | 'report';
  payload: {
    eventType?: MatchEventType;
    eventTarget?: 'home' | 'away' | 'match';
    minute?: number;
    teamId?: string;
    detailText?: string;
    newScoreHome?: number;
    newScoreAway?: number;
    newStatus?: MatchStatus;
    isOfficial?: boolean;
    refereeId?: string;
    reportText?: string;
    attendance?: number;
    weather?: string;
    incidents?: string;
    remarks?: string;
    officialEvents?: any[];
  };
  synced: boolean;
  retryCount?: number;
}

const OFFLINE_QUEUE_KEY = 'livescore_offline_match_queue';
const SYNCED_KEYS = 'livescore_synced_action_ids';
const MAX_QUEUE_SIZE = 50;

export const getOfflineQueue = (): QueuedMatchAction[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    logger.warn('Failed to parse offline queue from localStorage', { error: e });
    return [];
  }
};

export const getSyncedKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem(SYNCED_KEYS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
};

const saveSyncedKeys = (keys: Set<string>) => {
  try {
    // Keep max 200 synced keys to avoid memory bloat
    const keyArray = Array.from(keys).slice(-200);
    localStorage.setItem(SYNCED_KEYS, JSON.stringify(keyArray));
  } catch (e) {
    logger.warn('Failed to save synced keys to localStorage', { error: e });
  }
};

export const queueMatchAction = (
  fixtureId: string,
  type: 'event' | 'report',
  payload: QueuedMatchAction['payload']
): QueuedMatchAction => {
  let queue = getOfflineQueue();

  // Enforce queue size cap
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue = queue.slice(queue.length - MAX_QUEUE_SIZE + 1);
  }

  const newAction: QueuedMatchAction = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    fixtureId,
    type,
    payload,
    synced: false,
    retryCount: 0
  };

  queue.push(newAction);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    logger.error('LocalStorage write error when queuing match action', e);
  }

  logger.info('Queued offline match action', { id: newAction.id, type, fixtureId });
  return newAction;
};

export const syncOfflineMatchQueue = async (): Promise<{ syncedCount: number; errors: string[] }> => {
  const queue = getOfflineQueue();
  const syncedKeys = getSyncedKeys();
  const unsynced = queue.filter((a) => !a.synced && !syncedKeys.has(a.id));

  if (unsynced.length === 0) {
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];
  const updatedQueue = [...queue];

  for (const item of unsynced) {
    if (syncedKeys.has(item.id)) continue; // Prevent duplicate synchronization

    try {
      if (item.type === 'event' && item.payload.eventType) {
        const res = await ApiService.createMatchEvent({
          fixtureId: item.fixtureId,
          type: item.payload.eventType,
          eventTarget: item.payload.eventTarget || 'match',
          minute: item.payload.minute,
          teamId: item.payload.teamId,
          detailText: item.payload.detailText,
          newScoreHome: item.payload.newScoreHome,
          newScoreAway: item.payload.newScoreAway,
          newStatus: item.payload.newStatus,
          isOfficial: item.payload.isOfficial ?? true,
        });

        if (!res.success) {
          throw new Error(res.message || 'Failed to sync match event');
        }
      } else if (item.type === 'report' && item.payload.refereeId) {
        const res = await ApiService.verifyOfficialMatchResult({
          fixtureId: item.fixtureId,
          refereeId: item.payload.refereeId,
          scoreHome: item.payload.newScoreHome || 0,
          scoreAway: item.payload.newScoreAway || 0,
          reportText: item.payload.reportText || 'Offline queued official report',
          status: item.payload.newStatus || 'FT',
          attendance: item.payload.attendance,
          weather: item.payload.weather,
          incidents: item.payload.incidents,
          remarks: item.payload.remarks,
          officialEvents: item.payload.officialEvents || [],
        });

        if (!res.success) {
          throw new Error(res.message || 'Failed to sync match report');
        }
      }

      // Mark synced
      syncedKeys.add(item.id);
      syncedCount++;
      const found = updatedQueue.find((q) => q.id === item.id);
      if (found) found.synced = true;
    } catch (err: any) {
      const found = updatedQueue.find((q) => q.id === item.id);
      if (found) {
        found.retryCount = (found.retryCount || 0) + 1;
      }
      errors.push(`Failed sync for item ${item.id}: ${err.message}`);
      logger.warn(`Offline sync attempt failed for item ${item.id}`, { error: err.message });
    }
  }

  // Persist synced items & updated queue
  saveSyncedKeys(syncedKeys);
  const remainingUnsynced = updatedQueue.filter((q) => !q.synced && (q.retryCount || 0) < 5);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingUnsynced));

  if (syncedCount > 0) {
    logger.info(`Successfully synced ${syncedCount} offline match actions`);
  }

  return { syncedCount, errors };
};

/**
 * Initializes auto-sync listener whenever internet connectivity is restored.
 */
export const initOfflineSyncListener = (): () => void => {
  const handleOnline = () => {
    logger.info('Network restored. Triggering offline queue sync...');
    syncOfflineMatchQueue().catch((err) => {
      logger.error('Error during auto offline sync', err);
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }
  return () => {};
};
