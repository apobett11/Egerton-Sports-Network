import { supabase } from '../../lib/supabase';
import type { SeasonReferee, RefereeIntakePayload } from '../types/seasonMode';

export const refereesService = {
  /**
   * Fetches all official active referees from `public.referees` table.
   */
  async fetchReferees(): Promise<{ referees: SeasonReferee[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('referees')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        return { referees: [], error: error.message };
      }

      return { referees: (data || []) as SeasonReferee[], error: null };
    } catch (err: any) {
      return { referees: [], error: err.message || 'Failed to fetch referees' };
    }
  },

  /**
   * Registers a new referee into the official referee pool.
   */
  async registerReferee(payload: RefereeIntakePayload): Promise<{ success: boolean; referee?: SeasonReferee; error: string | null }> {
    try {
      const fullName = `${payload.official_first_name.trim()} ${payload.official_last_name.trim()}`;
      
      // Duplicate phone check
      const { data: existingRef } = await supabase
        .from('referees')
        .select('id, name')
        .eq('phone', payload.phone_number.trim())
        .is('deleted_at', null)
        .maybeSingle();

      if (existingRef) {
        return {
          success: false,
          error: `Registration already exists for phone number "${payload.phone_number}". Referee: ${existingRef.name}.`,
        };
      }

      const { data: newRef, error } = await supabase
        .from('referees')
        .insert([
          {
            name: fullName,
            email: payload.email.trim(),
            phone: payload.phone_number.trim(),
            badge_level: payload.badge_level || 'FKF National Level 2',
            status: 'Active',
          },
        ])
        .select()
        .single();

      if (error || !newRef) {
        return { success: false, error: error?.message || 'Failed to insert referee' };
      }

      // Log operational audit
      await supabase.from('audit_logs').insert([
        {
          action: 'REFEREE_INTAKE',
          resource_type: 'referees',
          resource_id: newRef.id,
          details: {
            referee_name: fullName,
            email: payload.email,
            phone: payload.phone_number,
            badge_level: payload.badge_level,
          },
        },
      ]);

      return { success: true, referee: newRef as SeasonReferee, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to register referee' };
    }
  },
};
