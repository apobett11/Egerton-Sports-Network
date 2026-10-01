import { supabase } from '../../lib/supabase';
import { HANDLE_PREFIXES } from '../../lib/predictions/constants';
import { getDeviceCredentials } from '../../lib/deviceCopies';
import { DeviceService } from '../DeviceService';
import type { AnonymousDevice, PredictionOption, UserPrediction } from '../../types/predictions';

const PREDICTION_PAGE = 50;

class AnonymousIdentityService {
  private currentDevice: AnonymousDevice | null = null;
  private favouriteTeam: string | null = null;
  private teamId: string | null = null;

  public isBound(): boolean {
    return this.getIdentity().bound;
  }

  public getIdentity(): AnonymousDevice {
    if (this.currentDevice) return this.currentDevice;
    this.currentDevice = {
      deviceId: '',
      publicHandle: 'This phone',
      status: 'active',
      createdAt: new Date().toISOString(),
      bound: false,
    };
    return this.currentDevice;
  }

  public generateRandomHandle(seedId: string): string {
    let hash = 0;
    for (let i = 0; i < seedId.length; i += 1) {
      hash = (hash << 5) - hash + seedId.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const prefixIndex = positiveHash % HANDLE_PREFIXES.length;
    const numberSuffix = (positiveHash % 90 + 10).toString().padStart(2, '0');
    return `${HANDLE_PREFIXES[prefixIndex]} #${numberSuffix}`;
  }

  public async ensureDeviceRegistered(): Promise<string | null> {
    const creds = await getDeviceCredentials();
    if (!creds.deviceId || !creds.secret) {
      this.currentDevice = {
        ...this.getIdentity(),
        deviceId: '',
        publicHandle: 'This phone',
        bound: false,
      };
      return null;
    }

    const handle = this.generateRandomHandle(creds.deviceId);
    this.currentDevice = {
      deviceId: creds.deviceId,
      publicHandle: handle,
      status: 'active',
      createdAt: this.currentDevice?.createdAt || new Date().toISOString(),
      bound: true,
    };

    await DeviceService.registerOrCheckInDevice(creds.deviceId);
    return creds.deviceId;
  }

  public async loadLockedProfile(): Promise<{
    favouriteTeam: string | null;
    predictions: UserPrediction[];
  }> {
    const deviceId = await this.ensureDeviceRegistered();
    if (!deviceId) return { favouriteTeam: null, predictions: [] };

    const profile = await DeviceService.registerOrCheckInDevice(deviceId);
    let favouriteTeam: string | null = profile?.favorite_team_label || null;
    if (!favouriteTeam && profile?.favorite_team_id) {
      try {
        const { data } = await supabase
          .from('teams')
          .select('name')
          .eq('id', profile.favorite_team_id)
          .maybeSingle();
        if (data && typeof data.name === 'string') favouriteTeam = data.name;
      } catch {
        favouriteTeam = null;
      }
    }
    if (!favouriteTeam && profile?.favorite_team_id) {
      try {
        const hint = localStorage.getItem('esn_favorite_team_label');
        if (hint && hint !== 'null') favouriteTeam = hint;
      } catch {
        favouriteTeam = null;
      }
    }
    if (favouriteTeam) {
      this.favouriteTeam = favouriteTeam;
      this.teamId = profile?.favorite_team_id || null;
    }

    const predictions = await this.loadOwnPredictions(deviceId);
    return { favouriteTeam, predictions };
  }

  private async loadOwnPredictions(deviceId: string): Promise<UserPrediction[]> {
    const creds = await getDeviceCredentials();
    if (!creds.secret) return [];
    const predictions: UserPrediction[] = [];
    let offset = 0;
    try {
      for (;;) {
        const { data, error } = await supabase.rpc('get_own_match_predictions', {
          p_device_id: deviceId,
          p_secret: creds.secret,
          p_limit: PREDICTION_PAGE,
          p_offset: offset,
        });
        if (error || !Array.isArray(data) || data.length === 0) break;
        data.forEach((row: { match_id?: string; prediction?: string; matchday?: number; updated_at?: string }) => {
          const prediction = row.prediction as PredictionOption;
          if (!row.match_id || (prediction !== '1' && prediction !== 'X' && prediction !== '2')) return;
          predictions.push({
            matchId: row.match_id,
            prediction,
            matchday: row.matchday || 1,
            updatedAt: row.updated_at || new Date().toISOString(),
          });
        });
        if (data.length < PREDICTION_PAGE) break;
        offset += PREDICTION_PAGE;
      }
    } catch {
      return predictions;
    }
    return predictions;
  }

  public async saveFavouriteTeam(teamName: string, teamId?: string | null): Promise<void> {
    if (this.favouriteTeam) return;
    const deviceId = await this.ensureDeviceRegistered();
    if (!deviceId) return;

    let resolvedId = teamId || null;
    if (!resolvedId) {
      try {
        const { data } = await supabase
          .from('teams')
          .select('id')
          .eq('name', teamName)
          .limit(1)
          .maybeSingle();
        resolvedId = data?.id || null;
      } catch {
        resolvedId = null;
      }
    }

    const saved = await DeviceService.setFavoriteTeam(deviceId, resolvedId, teamName);
    const lockedLabel = saved?.favorite_team_label || (saved?.favorite_team_id ? teamName : null);
    if (lockedLabel) {
      this.favouriteTeam = lockedLabel;
      this.teamId = saved?.favorite_team_id || resolvedId;
      return;
    }
    if (saved?.favorite_team_id) {
      this.favouriteTeam = teamName;
      this.teamId = saved.favorite_team_id;
    }
  }
}

export const anonymousIdentityService = new AnonymousIdentityService();
