import { supabase } from '../../lib/supabase';
import type { SeasonTeam, CoachIntakePayload } from '../types/seasonMode';
import { normalizeTeamName, checkDuplicateTeamName } from '../lib/normalization';

export const teamsService = {
  /**
   * Fetches all registered teams from Supabase database along with coach & captain profiles.
   */
  async fetchTeams(): Promise<{ teams: SeasonTeam[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          club_id,
          competition_id,
          name,
          short_name,
          logo_url,
          color_code,
          coach_id,
          captain_id,
          status,
          rejection_reason,
          created_at,
          coach_profile:profiles!teams_coach_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          captain_profile:profiles!teams_captain_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          competition:competitions!teams_competition_id_fkey (
            id,
            name,
            slug,
            country,
            season,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without explicit constraint names if FK name alias fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('teams')
          .select(`
            id,
            club_id,
            competition_id,
            name,
            short_name,
            logo_url,
            color_code,
            coach_id,
            captain_id,
            status,
            rejection_reason,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          return { teams: [], error: fallbackError.message };
        }

        return { teams: (fallbackData || []) as SeasonTeam[], error: null };
      }

      // Map array responses from PostgREST joins to single object properties
      const formattedTeams: SeasonTeam[] = (data || []).map((t: any) => ({
        ...t,
        coach_profile: Array.isArray(t.coach_profile) ? t.coach_profile[0] || null : t.coach_profile || null,
        captain_profile: Array.isArray(t.captain_profile) ? t.captain_profile[0] || null : t.captain_profile || null,
        competition: Array.isArray(t.competition) ? t.competition[0] || null : t.competition || null,
      }));

      return { teams: formattedTeams, error: null };
    } catch (err: any) {
      return { teams: [], error: err.message || 'Failed to fetch teams' };
    }
  },

  /**
   * Registers a coach and their team with team name normalization and duplicate protection.
   */
  async registerCoachAndTeam(payload: CoachIntakePayload): Promise<{ success: boolean; team?: SeasonTeam; error: string | null }> {
    try {
      const normalized = normalizeTeamName(payload.team_name);

      // 1. Fetch existing teams to check duplicate team names
      const { teams: existingTeams } = await this.fetchTeams();
      const existingNames = existingTeams.map((t) => t.name);

      const dupCheck = checkDuplicateTeamName(payload.team_name, existingNames);
      if (dupCheck.isDuplicate) {
        return {
          success: false,
          error: `Registration failed: Team name conflict. A team registered as "${dupCheck.conflictingName}" already exists.`,
        };
      }

      // 2. Check if a profile/coach with this email already registered a team
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', payload.email.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        // Check if this coach profile is already linked to a team
        const { data: linkedTeam } = await supabase
          .from('teams')
          .select('id, name')
          .eq('coach_id', existingProfile.id)
          .maybeSingle();

        if (linkedTeam) {
          return {
            success: false,
            error: `Registration already exists for this account ("${payload.email}"). Registered team: ${linkedTeam.name}.`,
          };
        }
      }

      // 3. Generate a short name (3-4 uppercase letters)
      const words = normalized.canonical_display_name.replace(' FC', '').split(' ');
      let shortName = words.map((w) => w[0]).join('').toUpperCase();
      if (shortName.length < 3 && words[0]) {
        shortName = words[0].slice(0, 3).toUpperCase();
      }

      // 4. Insert Team Record into DB
      const { data: newTeam, error: insertError } = await supabase
        .from('teams')
        .insert([
          {
            name: normalized.canonical_display_name,
            short_name: shortName,
            competition_id: payload.competition_id,
            status: 'approved',
            color_code: payload.competition_id === '11111111-1111-1111-1111-111111111111' ? '#D4AF37' : '#2563EB',
          },
        ])
        .select()
        .single();

      if (insertError || !newTeam) {
        return { success: false, error: insertError?.message || 'Failed to insert team' };
      }

      // 5. Log operational audit
      await supabase.from('audit_logs').insert([
        {
          action: 'COACH_TEAM_INTAKE',
          resource_type: 'teams',
          resource_id: newTeam.id,
          details: {
            coach_name: `${payload.official_first_name} ${payload.official_last_name}`,
            coach_email: payload.email,
            team_name: normalized.canonical_display_name,
            raw_input: payload.team_name,
            competition_id: payload.competition_id,
          },
        },
      ]);

      return { success: true, team: newTeam as SeasonTeam, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during registration' };
    }
  },
};
