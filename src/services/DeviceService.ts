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

      // Try fetching from anonymous_devices row
      try {
        let devRow: any = null;
        const res = await supabase
          .from('anonymous_devices')
          .select('announcements, interaction_history')
          .eq('device_id', deviceId)
          .maybeSingle();

        if (res.error && (res.error.code === '42703' || res.error.message?.includes('announcements'))) {
          const fallback = await supabase
            .from('anonymous_devices')
            .select('interaction_history')
            .eq('device_id', deviceId)
            .maybeSingle();
          devRow = fallback.data;
        } else {
          devRow = res.data;
        }

        if (devRow?.announcements && Array.isArray(devRow.announcements)) {
          devRow.announcements.forEach((item: DeviceAnnouncementItem) => recordedMap.set(item.id, item));
        } else if (devRow?.interaction_history?.announcements && Array.isArray(devRow.interaction_history.announcements)) {
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
  }
};
