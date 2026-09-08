import { supabase } from '../lib/supabaseClient';

export interface DeviceAnnouncementItem {
  id: string;
  title: string;
  content: string;
  target_role?: string;
  recipients?: string;
  created_at: string;
  status: 'unread' | 'read';
  read_at?: string;
}

export interface DeviceProfile {
  device_id: string;
  favorite_team_id: string | null;
  has_completed_onboarding: boolean;
  interaction_history?: Record<string, any>;
  announcements?: DeviceAnnouncementItem[];
  favorite_matches?: string[];
  last_seen_at?: string;
  created_at?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (id: unknown): boolean => {
  return typeof id === 'string' && UUID_REGEX.test(id);
};

export const DeviceService = {
  /**
   * Registers a new device or updates the last_seen_at timestamp for returning devices.
   */
  async registerOrCheckInDevice(deviceId: string): Promise<DeviceProfile | null> {
    try {
      if (!deviceId || !isValidUUID(deviceId)) return null;

      const cacheKey = `esn_device_last_checkin_${deviceId}`;
      const cachedProfileKey = `esn_device_profile_${deviceId}`;
      const lastCheckin = localStorage.getItem(cacheKey);
      const cachedProfile = localStorage.getItem(cachedProfileKey);
      const now = Date.now();

      // Avoid hammering the database on every page load/refresh if checked in within the last 6 hours
      if (lastCheckin && cachedProfile && (now - parseInt(lastCheckin, 10)) < 6 * 60 * 60 * 1000) {
        try {
          return JSON.parse(cachedProfile);
        } catch {
          // Fall through to query if cache is corrupted
        }
      }

      const { data, error } = await supabase
        .from('anonymous_devices')
        .upsert(
          { 
            device_id: deviceId, 
            last_seen_at: new Date().toISOString() 
          },
          { onConflict: 'device_id' }
        )
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        localStorage.setItem(cacheKey, String(now));
        localStorage.setItem(cachedProfileKey, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error("Failed to check in device to Supabase:", error);
      return null;
    }
  },

  /**
   * Matches the device UUID to the selected team's UID and completes onboarding.
   */
  async setFavoriteTeam(deviceId: string, teamId: string | null): Promise<DeviceProfile | null> {
    try {
      if (!deviceId || !isValidUUID(deviceId)) return null;
      const validTeamUUID = isValidUUID(teamId) ? teamId : null;

      const { data, error } = await supabase
        .from('anonymous_devices')
        .upsert(
          {
            device_id: deviceId,
            favorite_team_id: validTeamUUID,
            has_completed_onboarding: true,
            last_seen_at: new Date().toISOString()
          },
          { onConflict: 'device_id' }
        )
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Failed to bind favorite team:", error);
      return null;
    }
  },

  /**
   * Fetches public announcements and tracks device-specific read status.
   */
  async getDeviceAnnouncements(deviceId: string): Promise<DeviceAnnouncementItem[]> {
    if (!deviceId || !isValidUUID(deviceId)) return [];

    try {
      // 1. Fetch public announcements from table (where recipients/target_role is 'all' or 'public')
      let dbAnnouncements: any[] = [];
      try {
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .or('target_role.eq.all,target_role.eq.public')
          .order('created_at', { ascending: false });
        if (data) dbAnnouncements = data;
      } catch (e) {
        console.warn('Failed to query announcements table:', e);
      }

      // 2. Fetch device's recorded announcements
      const recordedMap = new Map<string, DeviceAnnouncementItem>();

      // Check local storage first as fast cache
      try {
        const local = localStorage.getItem(`esn_device_announcements_${deviceId}`);
        if (local) {
          const parsed: DeviceAnnouncementItem[] = JSON.parse(local);
          parsed.forEach((item) => recordedMap.set(item.id, item));
        }
      } catch {}

      // Fetch from anonymous_devices row
      try {
        const res = await supabase
          .from('anonymous_devices')
          .select('interaction_history')
          .eq('device_id', deviceId)
          .maybeSingle();

        const devRow = res.data;

        if (devRow?.interaction_history?.announcements && Array.isArray(devRow.interaction_history.announcements)) {
          devRow.interaction_history.announcements.forEach((item: DeviceAnnouncementItem) => recordedMap.set(item.id, item));
        }
      } catch {}

      // 3. Merge: combine db announcements and device-recorded announcements
      const mergedList: DeviceAnnouncementItem[] = [];
      const seenIds = new Set<string>();

      dbAnnouncements.forEach((anc: any) => {
        seenIds.add(anc.id);
        const existing = recordedMap.get(anc.id);
        if (existing) {
          mergedList.push({
            ...existing,
            title: anc.title,
            content: anc.content,
            created_at: anc.created_at,
          });
        } else {
          mergedList.push({
            id: anc.id,
            title: anc.title,
            content: anc.content,
            target_role: anc.target_role,
            recipients: anc.recipients || anc.target_role,
            created_at: anc.created_at,
            status: 'unread' as const,
          });
        }
      });

      // Include any device-recorded announcements that were not in DB list
      recordedMap.forEach((item) => {
        if (!seenIds.has(item.id)) {
          mergedList.push(item);
        }
      });

      // Update local storage
      try {
        localStorage.setItem(`esn_device_announcements_${deviceId}`, JSON.stringify(mergedList));
      } catch {}

      return mergedList;
    } catch (err) {
      console.error('Failed to get device announcements:', err);
      return [];
    }
  },

  /**
   * Marks an announcement as read for a specific device.
   */
  async markAnnouncementAsRead(deviceId: string, announcementId: string): Promise<DeviceAnnouncementItem[]> {
    if (!deviceId || !isValidUUID(deviceId) || !announcementId) return [];

    try {
      const list = await this.getDeviceAnnouncements(deviceId);
      const updatedList = list.map((item) => {
        if (item.id === announcementId) {
          return { ...item, status: 'read' as const, read_at: new Date().toISOString() };
        }
        return item;
      });

      // 1. Save to local storage immediately
      try {
        localStorage.setItem(`esn_device_announcements_${deviceId}`, JSON.stringify(updatedList));
      } catch {}

      // 2. Persist to anonymous_devices table in Supabase
      try {
        const updatePayload: any = {
          device_id: deviceId,
          announcements: updatedList,
          last_seen_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await supabase
          .from('anonymous_devices')
          .upsert(updatePayload, { onConflict: 'device_id' });

        if (upsertErr && (upsertErr.code === '42703' || upsertErr.message?.includes('announcements'))) {
          // If column doesn't exist on remote table yet, store in interaction_history.announcements
          await supabase
            .from('anonymous_devices')
            .upsert(
              {
                device_id: deviceId,
                interaction_history: { announcements: updatedList },
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: 'device_id' }
            );
        }
      } catch (dbErr) {
        console.warn('Failed to persist read status to Supabase:', dbErr);
      }

      return updatedList;
    } catch (err) {
      console.error('Failed to mark announcement as read:', err);
      return [];
    }
  },

  /**
   * Fetches favorite match IDs equated to the anonymous device.
   * Reads from instant local storage first, then syncs with Supabase anonymous_devices record.
   */
  async getFavoriteMatches(deviceId: string): Promise<string[]> {
    if (!deviceId || !isValidUUID(deviceId)) return [];

    const localKey = `esn_device_favorites_${deviceId}`;
    let cachedList: string[] = [];
    try {
      const local = localStorage.getItem(localKey) || localStorage.getItem('favorites');
      if (local) {
        cachedList = JSON.parse(local);
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from('anonymous_devices')
        .select('favorite_matches, interaction_history')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (!error && data) {
        const dbList = Array.isArray(data.favorite_matches)
          ? data.favorite_matches
          : Array.isArray(data.interaction_history?.favorite_matches)
          ? data.interaction_history.favorite_matches
          : null;

        if (dbList && Array.isArray(dbList)) {
          const merged = Array.from(new Set([...cachedList, ...dbList]));
          try {
            localStorage.setItem(localKey, JSON.stringify(merged));
            localStorage.setItem('favorites', JSON.stringify(merged));
          } catch {}
          return merged;
        }
      }
    } catch (err) {
      console.warn('Unable to sync device favorites from remote:', err);
    }

    return cachedList;
  },

  /**
   * Records or toggles a match as favorite equated to the anonymous device.
   * Instant local update + non-blocking background Supabase persistence.
   */
  async toggleFavoriteMatch(deviceId: string, matchId: string): Promise<string[]> {
    if (!deviceId || !isValidUUID(deviceId) || !matchId) return [];

    const localKey = `esn_device_favorites_${deviceId}`;
    let currentList: string[] = [];
    try {
      const local = localStorage.getItem(localKey) || localStorage.getItem('favorites');
      if (local) {
        currentList = JSON.parse(local);
      }
    } catch {}

    const isFav = currentList.includes(matchId);
    const updatedList = isFav
      ? currentList.filter((id) => id !== matchId)
      : [...currentList, matchId];

    // 1. Instant local persistence (0ms latency for smooth UX)
    try {
      localStorage.setItem(localKey, JSON.stringify(updatedList));
      localStorage.setItem('favorites', JSON.stringify(updatedList));
    } catch {}

    // 2. Non-blocking remote persistence to anonymous_devices table
    (async () => {
      try {
        const payload: any = {
          device_id: deviceId,
          favorite_matches: updatedList,
          last_seen_at: new Date().toISOString()
        };

        const { error: upsertErr } = await supabase
          .from('anonymous_devices')
          .upsert(payload, { onConflict: 'device_id' });

        if (upsertErr) {
          // Fallback to interaction_history JSONB
          await supabase
            .from('anonymous_devices')
            .upsert(
              {
                device_id: deviceId,
                interaction_history: { favorite_matches: updatedList },
                last_seen_at: new Date().toISOString()
              },
              { onConflict: 'device_id' }
            );
        }
      } catch (e) {
        console.warn('Failed to sync favorite match to Supabase:', e);
      }
    })();

    return updatedList;
  },

  /**
   * Sets the favorite matches list for the anonymous device directly.
   */
  async setFavoriteMatches(deviceId: string, matchIds: string[]): Promise<string[]> {
    if (!deviceId || !isValidUUID(deviceId)) return [];
    const localKey = `esn_device_favorites_${deviceId}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(matchIds));
      localStorage.setItem('favorites', JSON.stringify(matchIds));
    } catch {}

    (async () => {
      try {
        const payload: any = {
          device_id: deviceId,
          favorite_matches: matchIds,
          last_seen_at: new Date().toISOString()
        };
        const { error: upsertErr } = await supabase
          .from('anonymous_devices')
          .upsert(payload, { onConflict: 'device_id' });

        if (upsertErr) {
          await supabase
            .from('anonymous_devices')
            .upsert(
              {
                device_id: deviceId,
                interaction_history: { favorite_matches: matchIds },
                last_seen_at: new Date().toISOString()
              },
              { onConflict: 'device_id' }
            );
        }
      } catch (e) {
        console.warn('Failed to sync favorite matches to Supabase:', e);
      }
    })();

    return matchIds;
  },

  /**
   * Completes onboarding for the anonymous device, ensuring the user is never prompted twice.
   */
  async completeOnboarding(deviceId: string, teamId: string | null = null): Promise<DeviceProfile | null> {
    return this.setFavoriteTeam(deviceId, teamId);
  }
};

