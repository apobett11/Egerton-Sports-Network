import { supabase } from '../../lib/supabase';
import { getDeviceCredentials } from '../../lib/deviceCopies';
import { patchDashboardCache, readDashboardCache, type PredictionDashboardCache } from '../../lib/predictions/predictionDashboardCache';

function asDate(value: unknown): string | null {
  if (!value) return null;
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

class PredictionSessionService {
  private inflight: Promise<void> | null = null;

  public async pullRemoteSession(): Promise<Partial<PredictionDashboardCache> | null> {
    try {
      const creds = await getDeviceCredentials();
      if (!creds.deviceId || !creds.secret) return null;
      const { data, error } = await supabase.rpc('get_prediction_device_session', {
        p_device_id: creds.deviceId,
        p_secret: creds.secret,
      });
      if (error || !data || typeof data !== 'object') return null;
      const row = data as Record<string, unknown>;
      const favouriteTeam = typeof row.favorite_team_label === 'string' && row.favorite_team_label.trim()
        ? row.favorite_team_label.trim()
        : null;
      const next = patchDashboardCache({
        favouriteTeam,
        favouriteTeamId: typeof row.favorite_team_id === 'string' ? row.favorite_team_id : null,
        fanaticAnswered: true,
        footballFanatic: null,
        step: row.step === 'club' || row.step === 'derby' || row.step === 'picks' || row.step === 'dashboard'
          ? row.step
          : favouriteTeam ? 'picks' : 'club',
        slipListOpen: Boolean(row.slip_list_open),
        activeDayKey: asDate(row.active_day_key),
        lockedSaturday: asDate(row.locked_saturday),
        lockedSunday: asDate(row.locked_sunday),
      });
      return next;
    } catch {
      return readDashboardCache();
    }
  }

  public pushRemoteSession(): void {
    if (this.inflight) return;
    this.inflight = this.flush().finally(() => {
      this.inflight = null;
    });
  }

  private async flush(): Promise<void> {
    const cached = readDashboardCache();
    try {
      const creds = await getDeviceCredentials();
      if (!creds.deviceId || !creds.secret) return;
      await supabase.rpc('upsert_prediction_device_session', {
        p_device_id: creds.deviceId,
        p_secret: creds.secret,
        p_favorite_team_id: cached.favouriteTeamId,
        p_favorite_team_label: cached.favouriteTeam,
        p_fanatic_answered: true,
        p_football_fanatic: null,
        p_step: cached.step,
        p_slip_list_open: cached.slipListOpen,
        p_active_day_key: cached.activeDayKey,
        p_locked_saturday: cached.lockedSaturday,
        p_locked_sunday: cached.lockedSunday,
      });
    } catch {
      // Cache already holds the step. The next visit retries.
    }
  }
}

export const predictionSessionService = new PredictionSessionService();
