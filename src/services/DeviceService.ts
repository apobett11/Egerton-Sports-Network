import { supabase } from '../lib/supabaseClient';

export interface DeviceProfile {
  device_id: string;
  favorite_team_id: string | null;
  has_completed_onboarding: boolean;
  interaction_history?: Record<string, any>;
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
  }
};
