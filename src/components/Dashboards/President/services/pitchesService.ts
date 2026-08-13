import { supabase } from '../../../../lib/supabase';
import type { PitchItem } from '../types';
import { OFFICIAL_PITCHES } from '../constants';

export const pitchesService = {
  /**
   * Fetches official Egerton pitches from `public.pitches` table.
   * Falls back to canonical seed constants if table is empty or migration is pending.
   */
  async fetchPitches(): Promise<{ pitches: PitchItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return { pitches: OFFICIAL_PITCHES as PitchItem[], error: null };
      }

      return { pitches: data as PitchItem[], error: null };
    } catch (err: any) {
      return { pitches: OFFICIAL_PITCHES as PitchItem[], error: null };
    }
  },
};
