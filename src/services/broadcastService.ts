import { supabase } from '../lib/supabase';

export interface BroadcastReactions {
  fire: number;
  soccer: number;
  trophy: number;
  like: number;
  clicks: number;
  impressions: number;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  image_url?: string | null;
  category?: string;
  action_url?: string | null;
  reactions: BroadcastReactions;
  scheduled_for?: string | null; // Stored strictly as string: ISO timestamp e.g. '2026-10-06T20:20:00+03:00'
  created_at?: string;
}

const BROADCAST_STORAGE_KEY = 'esn_broadcast_history';
const LAST_SEEN_NOTIFICATION_KEY = 'esn_last_seen_broadcast_id';

export const DEFAULT_REACTIONS: BroadcastReactions = {
  fire: 0,
  soccer: 0,
  trophy: 0,
  like: 0,
  clicks: 0,
  impressions: 0,
};

/**
 * Helper to calculate today at 8:20 PM local time string
 */
export function getToday820PMString(): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 20, 0, 0);
  return target.toISOString();
}

/**
 * Returns remaining milliseconds until scheduled time (0 if already passed or not scheduled)
 */
export function getScheduledDelayMs(scheduledFor?: string | null): number {
  if (!scheduledFor) return 0;
  const targetTime = new Date(scheduledFor).getTime();
  if (isNaN(targetTime)) return 0;
  return Math.max(0, targetTime - Date.now());
}

/**
 * Parse reactions stored strictly as string into object
 */
export function parseReactions(raw: string | null | undefined | object): BroadcastReactions {
  if (!raw) return { ...DEFAULT_REACTIONS };
  if (typeof raw === 'object') {
    const obj = raw as any;
    return {
      fire: Number(obj.fire) || 0,
      soccer: Number(obj.soccer) || 0,
      trophy: Number(obj.trophy) || 0,
      like: Number(obj.like) || 0,
      clicks: Number(obj.clicks) || 0,
      impressions: Number(obj.impressions) || 0,
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      fire: Number(parsed.fire) || 0,
      soccer: Number(parsed.soccer) || 0,
      trophy: Number(parsed.trophy) || 0,
      like: Number(parsed.like) || 0,
      clicks: Number(parsed.clicks) || 0,
      impressions: Number(parsed.impressions) || 0,
    };
  } catch {
    return { ...DEFAULT_REACTIONS };
  }
}

/**
 * Serialize reactions object strictly into string format
 */
export function serializeReactions(reactions: BroadcastReactions): string {
  return JSON.stringify({
    fire: Number(reactions.fire) || 0,
    soccer: Number(reactions.soccer) || 0,
    trophy: Number(reactions.trophy) || 0,
    like: Number(reactions.like) || 0,
    clicks: Number(reactions.clicks) || 0,
    impressions: Number(reactions.impressions) || 0,
  });
}

export class BroadcastService {
  /**
   * Fetch recent broadcast history (no realtime channel, single fast HTTP query)
   */
  static async getRecentBroadcasts(limit: number = 20): Promise<BroadcastNotification[]> {
    try {
      const { data, error } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        const mapped: BroadcastNotification[] = data.map((row: any) => ({
          id: String(row.id),
          title: String(row.title || ''),
          message: String(row.message || ''),
          image_url: row.image_url ? String(row.image_url) : null,
          category: String(row.category || 'ANNOUNCEMENT'),
          action_url: row.action_url ? String(row.action_url) : null,
          reactions: parseReactions(row.reactions),
          scheduled_for: row.scheduled_for ? String(row.scheduled_for) : null,
          created_at: row.created_at,
        }));
        this.saveLocalHistory(mapped);
        return mapped;
      }
    } catch {
      // Fallback to local snapshot
    }

    return this.getLocalHistory();
  }

  /**
   * Check single latest broadcast for banner display (ultra-low CPU/memory, executes once on mount)
   */
  static async getLatestUnseenBroadcast(): Promise<BroadcastNotification | null> {
    const lastSeenId = localStorage.getItem(LAST_SEEN_NOTIFICATION_KEY);

    try {
      const { data, error } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const notif: BroadcastNotification = {
          id: String(data.id),
          title: String(data.title || ''),
          message: String(data.message || ''),
          image_url: data.image_url ? String(data.image_url) : null,
          category: String(data.category || 'DERBY'),
          action_url: data.action_url ? String(data.action_url) : '#/banter',
          reactions: parseReactions(data.reactions),
          scheduled_for: data.scheduled_for ? String(data.scheduled_for) : null,
          created_at: data.created_at,
        };

        if (notif.id !== lastSeenId) {
          return notif;
        }
        return null;
      }
    } catch {
      // Local fallback
    }

    const localHistory = this.getLocalHistory();
    if (localHistory.length > 0) {
      const latest = localHistory[0];
      if (latest.id !== lastSeenId) {
        return latest;
      }
    }

    return null;
  }

  /**
   * Mark a broadcast as seen by device to avoid repeating on reload
   */
  static markBroadcastSeen(id: string): void {
    try {
      localStorage.setItem(LAST_SEEN_NOTIFICATION_KEY, id);
    } catch {}
  }

  /**
   * Send/Schedule a rich dropdown broadcast: stores message, reactions, and scheduled time strictly as strings
   */
  static async sendBroadcast(payload: {
    title: string;
    message: string;
    image_url?: string;
    category?: string;
    action_url?: string;
    scheduled_for?: string;
  }): Promise<{ success: boolean; notification?: BroadcastNotification; error?: string }> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`;
    const messageString = String(payload.message || '').trim();
    const reactionsString = serializeReactions(DEFAULT_REACTIONS);
    const scheduledForString = payload.scheduled_for ? String(payload.scheduled_for).trim() : null;

    const newNotif: BroadcastNotification = {
      id,
      title: String(payload.title || '').trim(),
      message: messageString,
      image_url: payload.image_url ? String(payload.image_url).trim() : null,
      category: String(payload.category || 'DERBY'),
      action_url: payload.action_url ? String(payload.action_url).trim() : '#/banter',
      reactions: { ...DEFAULT_REACTIONS },
      scheduled_for: scheduledForString,
      created_at: new Date().toISOString(),
    };

    // 1. Insert to PostgreSQL with strings
    try {
      const { data, error } = await supabase
        .from('broadcast_notifications')
        .insert({
          id: newNotif.id,
          title: newNotif.title,
          message: messageString,
          image_url: newNotif.image_url,
          category: newNotif.category,
          action_url: newNotif.action_url,
          reactions: reactionsString,
          scheduled_for: scheduledForString,
          created_at: newNotif.created_at,
        })
        .select()
        .single();

      if (!error && data) {
        newNotif.id = String(data.id || newNotif.id);
      }
    } catch (err: any) {
      console.warn('DB broadcast insert (using local snapshot):', err?.message);
    }

    // 2. Save to local history
    const history = this.getLocalHistory();
    const updated = [newNotif, ...history.filter((n) => n.id !== newNotif.id)].slice(0, 30);
    this.saveLocalHistory(updated);

    // 3. Dispatch local DOM event for immediate in-page presentation with zero network overhead
    try {
      window.dispatchEvent(new CustomEvent('esn_broadcast_dispatched', { detail: newNotif }));
    } catch {}

    return { success: true, notification: newNotif };
  }

  /**
   * Record a user emoji reaction (updates string in DB and local store)
   */
  static async recordReaction(
    notificationId: string,
    reactionType: 'fire' | 'soccer' | 'trophy' | 'like'
  ): Promise<BroadcastReactions | null> {
    try {
      const history = this.getLocalHistory();
      const target = history.find((n) => n.id === notificationId);
      const currentReactions: BroadcastReactions = target?.reactions
        ? { ...target.reactions }
        : { ...DEFAULT_REACTIONS };

      currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;
      const updatedString = serializeReactions(currentReactions);

      if (target) {
        target.reactions = currentReactions;
        this.saveLocalHistory(history);
      }

      // Update string in DB without realtime triggers
      await supabase
        .from('broadcast_notifications')
        .update({ reactions: updatedString })
        .eq('id', notificationId);

      return currentReactions;
    } catch (e) {
      console.warn('Error recording reaction:', e);
    }
    return null;
  }

  /**
   * Record a click on the notification card (updates string in DB and local store)
   */
  static async recordClick(notificationId: string): Promise<void> {
    try {
      const history = this.getLocalHistory();
      const target = history.find((n) => n.id === notificationId);
      const currentReactions: BroadcastReactions = target?.reactions
        ? { ...target.reactions }
        : { ...DEFAULT_REACTIONS };

      currentReactions.clicks = (currentReactions.clicks || 0) + 1;
      const updatedString = serializeReactions(currentReactions);

      if (target) {
        target.reactions = currentReactions;
        this.saveLocalHistory(history);
      }

      await supabase
        .from('broadcast_notifications')
        .update({ reactions: updatedString })
        .eq('id', notificationId);
    } catch {}
  }

  /**
   * Record impression (updates string in DB and local store)
   */
  static async recordImpression(notificationId: string): Promise<void> {
    try {
      const history = this.getLocalHistory();
      const target = history.find((n) => n.id === notificationId);
      const currentReactions: BroadcastReactions = target?.reactions
        ? { ...target.reactions }
        : { ...DEFAULT_REACTIONS };

      currentReactions.impressions = (currentReactions.impressions || 0) + 1;
      const updatedString = serializeReactions(currentReactions);

      if (target) {
        target.reactions = currentReactions;
        this.saveLocalHistory(history);
      }

      await supabase
        .from('broadcast_notifications')
        .update({ reactions: updatedString })
        .eq('id', notificationId);
    } catch {}
  }

  private static getLocalHistory(): BroadcastNotification[] {
    try {
      const data = localStorage.getItem(BROADCAST_STORAGE_KEY);
      if (data) {
        const list = JSON.parse(data);
        return list
          .filter((item: any) => !/satoo/i.test(`${item.title || ''} ${item.message || ''}`))
          .map((item: any) => ({
            ...item,
            reactions: parseReactions(item.reactions),
            scheduled_for: item.scheduled_for ? String(item.scheduled_for) : null,
          }));
      }
    } catch {}
    return [];
  }

  private static saveLocalHistory(list: BroadcastNotification[]): void {
    try {
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }
}
