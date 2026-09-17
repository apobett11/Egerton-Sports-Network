/**
 * Feature Feedback & Match Prediction Determinant Poll Service
 * Egerton Sports Network (ESN)
 *
 * Handles 1-device-1-vote feedback on proposed features in an independent,
 * high-performance temporary table with local cache-aside acceleration.
 */

import { supabase } from '../lib/supabase';

export interface DevicePollRecord {
  id: string;
  deviceId: string;
  openedGuestPage: boolean;
  openedOddsPage: boolean;
  voted: boolean;
  vote: 'yes' | 'no' | null;
  createdAt: string;
}

export interface FeaturePollStats {
  totalGuestVisits: number;
  totalOddsOpens: number;
  totalVotes: number;
  yesCount: number;
  noCount: number;
  yesPercentage: number;
  noPercentage: number;
  recentVotes: DevicePollRecord[];
}

export interface DevicePollStatus {
  openedGuestPage?: boolean;
  openedOddsPage?: boolean;
  hasVoted: boolean;
  vote: 'yes' | 'no' | null;
  votedAt?: string;
}

const DEFAULT_FEATURE_KEY = 'match_predictions_poll';
const LOCAL_STORAGE_KEY_PREFIX = 'esn_feat_poll_';

export class FeaturePollService {
  /**
   * Get the local storage key for a specific feature poll
   */
  private static getStorageKey(featureKey: string = DEFAULT_FEATURE_KEY): string {
    return `${LOCAL_STORAGE_KEY_PREFIX}${featureKey}`;
  }

  /**
   * Reset local storage flags for this feature poll to give every device a clean slate
   */
  static applyCleanSlate(featureKey: string = DEFAULT_FEATURE_KEY): void {
    try {
      const slateToken = 'esn_clean_slate_v3_applied';
      if (localStorage.getItem(slateToken) !== 'true') {
        localStorage.removeItem('esn_odds_popup_shown_v1');
        localStorage.removeItem('esn_odds_popup_shown_v2');
        localStorage.removeItem('esn_odds_popup_shown_v3');
        localStorage.removeItem('esn_odds_page_opened');
        localStorage.removeItem('esn_odds_page_opened_v1');
        localStorage.removeItem('esn_odds_page_opened_v2');
        localStorage.removeItem('esn_odds_tooltip_dismissed');
        localStorage.removeItem(this.getStorageKey(featureKey));
        sessionStorage.removeItem('esn_odds_tooltip_dismissed');
        sessionStorage.removeItem(`esn_guest_visit_recorded_${featureKey}`);
        sessionStorage.removeItem(`esn_odds_open_recorded_${featureKey}`);
        localStorage.setItem(slateToken, 'true');
      }
    } catch {}
  }

  /**
   * Record that a device loaded/opened the guest homepage
   */
  static async recordGuestPageVisit(
    deviceId: string,
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<void> {
    if (!deviceId) return;
    const sessionKey = `esn_guest_visit_recorded_${featureKey}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, 'true');
    } catch {}

    const timestamp = new Date().toISOString();
    try {
      await supabase
        .from('feature_feedback_polls')
        .upsert(
          {
            device_id: deviceId,
            feature_key: featureKey,
            opened_guest_page: true,
            updated_at: timestamp,
          },
          { onConflict: 'device_id,feature_key' }
        );
    } catch (err) {
      console.warn('[FeaturePollService] Guest page visit record warning:', err);
    }
  }

  /**
   * Record that a device opened the odds feature page or modal
   */
  static async recordOddsPageOpen(
    deviceId: string,
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<void> {
    if (!deviceId) return;
    try {
      localStorage.setItem(`esn_odds_opened_${deviceId}`, 'true');
      localStorage.setItem('esn_odds_page_opened_v3', 'true');
    } catch {}

    const sessionKey = `esn_odds_open_recorded_${featureKey}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, 'true');
    } catch {}

    const timestamp = new Date().toISOString();
    try {
      await supabase
        .from('feature_feedback_polls')
        .upsert(
          {
            device_id: deviceId,
            feature_key: featureKey,
            opened_guest_page: true,
            opened_odds_page: true,
            updated_at: timestamp,
          },
          { onConflict: 'device_id,feature_key' }
        );
    } catch (err) {
      console.warn('[FeaturePollService] Odds page open record warning:', err);
    }
  }

  /**
   * Check whether a device has ever opened the odds page (indexed database lookup)
   */
  static async hasDeviceOpenedOddsPage(
    deviceId: string,
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<boolean> {
    if (!deviceId) return false;

    // 1. Fast path: check per-device local storage cache
    try {
      if (localStorage.getItem(`esn_odds_opened_${deviceId}`) === 'true') {
        return true;
      }
    } catch {}

    // 2. Query indexed database table (device_id index)
    try {
      const { data, error } = await supabase
        .from('feature_feedback_polls')
        .select('opened_odds_page, voted')
        .eq('device_id', deviceId)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (!error && data) {
        const opened = Boolean(data.opened_odds_page || data.voted);
        if (opened) {
          try {
            localStorage.setItem(`esn_odds_opened_${deviceId}`, 'true');
            localStorage.setItem('esn_odds_page_opened_v3', 'true');
          } catch {}
        }
        return opened;
      }
    } catch (err) {
      console.warn('[FeaturePollService] Error checking odds page status:', err);
    }

    return false;
  }

  /**
   * Check if a device has already cast a vote for this feature
   */
  static async checkDeviceVote(
    deviceId: string,
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<DevicePollStatus> {
    if (!deviceId) {
      return { hasVoted: false, vote: null };
    }

    // 1. Fast path: check local storage cache
    try {
      const cached = localStorage.getItem(this.getStorageKey(featureKey));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.vote === 'yes' || parsed.vote === 'no')) {
          return {
            hasVoted: true,
            vote: parsed.vote,
            votedAt: parsed.timestamp || undefined,
          };
        }
      }
    } catch {
      // LocalStorage access error ignored
    }

    // 2. Query remote database table
    try {
      const { data, error } = await supabase
        .from('feature_feedback_polls')
        .select('vote, opened_guest_page, opened_odds_page, voted, created_at')
        .eq('device_id', deviceId)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (!error && data) {
        const vote = (data.vote as 'yes' | 'no') || null;
        const hasVoted = Boolean(data.voted || vote);
        if (vote) {
          try {
            localStorage.setItem(
              this.getStorageKey(featureKey),
              JSON.stringify({ vote, timestamp: data.created_at })
            );
          } catch {}
        }

        return {
          openedGuestPage: Boolean(data.opened_guest_page),
          openedOddsPage: Boolean(data.opened_odds_page),
          hasVoted,
          vote,
          votedAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('[FeaturePollService] Remote check error:', err);
    }

    return { hasVoted: false, vote: null };
  }

  /**
   * Submit a Yes/No vote for this device (1 vote per device)
   */
  static async submitVote(
    deviceId: string,
    vote: 'yes' | 'no',
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<{ success: boolean; error?: string }> {
    if (!deviceId) {
      return { success: false, error: 'Device identity required to vote.' };
    }

    const timestamp = new Date().toISOString();

    // 1. Instantly save to local cache for zero UI latency
    try {
      localStorage.setItem(`esn_odds_opened_${deviceId}`, 'true');
      localStorage.setItem('esn_odds_page_opened_v3', 'true');
      localStorage.setItem(
        this.getStorageKey(featureKey),
        JSON.stringify({ vote, timestamp })
      );
    } catch {}

    // 2. Persist to Supabase database table
    try {
      const { error: dbError } = await supabase
        .from('feature_feedback_polls')
        .upsert(
          {
            device_id: deviceId,
            feature_key: featureKey,
            opened_odds_page: true,
            voted: true,
            vote,
            updated_at: timestamp,
          },
          { onConflict: 'device_id,feature_key' }
        );

      if (dbError) {
        console.warn('[FeaturePollService] DB table write issue, saving fallback:', dbError.message);
        // Resilient fallback: write to system_settings fallback queue if table is pending
        await this.recordFallbackVote(deviceId, vote, featureKey, timestamp);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('[FeaturePollService] Network submit error:', err);
      // Even if network fails, the local vote is registered on device
      return { success: true };
    }
  }

  /**
   * Fallback persistence mechanism into system_settings
   */
  private static async recordFallbackVote(
    deviceId: string,
    vote: 'yes' | 'no',
    featureKey: string,
    timestamp: string
  ): Promise<void> {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'feature_feedback_fallback')
        .maybeSingle();

      const existingVotes = (data?.value?.votes || {}) as Record<string, { vote: string; timestamp: string; featureKey: string }>;
      existingVotes[deviceId] = { vote, timestamp, featureKey };

      await supabase
        .from('system_settings')
        .upsert({
          key: 'feature_feedback_fallback',
          value: {
            votes: existingVotes,
            updatedAt: timestamp,
          },
          updated_at: timestamp,
        });
    } catch (e) {
      console.warn('[FeaturePollService] Fallback store error:', e);
    }
  }

  /**
   * Fetch aggregate poll analytics for the Admin 2 Polls sub-page
   */
  static async getPollAnalytics(
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<FeaturePollStats> {
    let recordsList: DevicePollRecord[] = [];

    // 1. Try querying the dedicated table
    try {
      const { data, error } = await supabase
        .from('feature_feedback_polls')
        .select('id, device_id, opened_guest_page, opened_odds_page, voted, vote, created_at')
        .eq('feature_key', featureKey)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && Array.isArray(data) && data.length > 0) {
        recordsList = data.map((row: any) => ({
          id: row.id,
          deviceId: row.device_id,
          openedGuestPage: Boolean(row.opened_guest_page),
          openedOddsPage: Boolean(row.opened_odds_page),
          voted: Boolean(row.voted ?? (row.vote === 'yes' || row.vote === 'no')),
          vote: (row.vote as 'yes' | 'no') || null,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('[FeaturePollService] Analytics table query issue:', err);
    }

    // 2. Also incorporate fallback votes if any
    try {
      const { data: fallbackData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'feature_feedback_fallback')
        .maybeSingle();

      if (fallbackData?.value?.votes) {
        const fbVotes = fallbackData.value.votes;
        for (const [devId, val] of Object.entries(fbVotes)) {
          const item = val as any;
          if (item.featureKey === featureKey && !recordsList.some((v) => v.deviceId === devId)) {
            recordsList.push({
              id: `fb_${devId.slice(0, 8)}`,
              deviceId: devId,
              openedGuestPage: true,
              openedOddsPage: true,
              voted: true,
              vote: item.vote as 'yes' | 'no',
              createdAt: item.timestamp,
            });
          }
        }
      }
    } catch {}

    const totalGuestVisits = recordsList.filter((v) => v.openedGuestPage).length || recordsList.length;
    const totalOddsOpens = recordsList.filter((v) => v.openedOddsPage).length;
    const votedList = recordsList.filter((v) => v.voted && v.vote);
    const totalVotes = votedList.length;
    const yesCount = votedList.filter((v) => v.vote === 'yes').length;
    const noCount = votedList.filter((v) => v.vote === 'no').length;
    const yesPercentage = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
    const noPercentage = totalVotes > 0 ? Math.round((noCount / totalVotes) * 100) : 0;

    return {
      totalGuestVisits,
      totalOddsOpens,
      totalVotes,
      yesCount,
      noCount,
      yesPercentage,
      noPercentage,
      recentVotes: recordsList,
    };
  }

  /**
   * Purge/Delete temporary feedback poll table data (admin action)
   */
  static async purgeFeedbackPollTable(
    featureKey: string = DEFAULT_FEATURE_KEY
  ): Promise<boolean> {
    try {
      // 1. Delete from dedicated table
      await supabase
        .from('feature_feedback_polls')
        .delete()
        .eq('feature_key', featureKey);

      // 2. Clear from fallback in system_settings
      await supabase
        .from('system_settings')
        .delete()
        .eq('key', 'feature_feedback_fallback');

      return true;
    } catch (err) {
      console.error('[FeaturePollService] Purge failed:', err);
      return false;
    }
  }
}
