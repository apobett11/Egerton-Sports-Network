import { supabase } from '../../lib/supabase';
import type { SeasonPitch } from '../types/seasonMode';
import { OFFICIAL_PITCHES } from '../constants/seasonConstants';

export const pitchesService = {
  /**
   * Fetches the 3 official Egerton pitches from `public.pitches` table.
   * Falls back to canonical seed constants if table is empty or migration is pending.
   */
  async fetchPitches(): Promise<{ pitches: SeasonPitch[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback to official seed constants with UUIDs
        return { pitches: OFFICIAL_PITCHES as SeasonPitch[], error: null };
      }

      return { pitches: data as SeasonPitch[], error: null };
    } catch (err: any) {
      return { pitches: OFFICIAL_PITCHES as SeasonPitch[], error: null };
    }
  },
};
