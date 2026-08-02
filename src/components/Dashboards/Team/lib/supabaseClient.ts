import { supabase } from '../../../../lib/supabase';
import { DBPlayer, DBTeam, DBSquadConfiguration, SquadPosition, Player, Match } from '../types';

export { supabase };

const SQUAD_CACHE_KEY = 'supabase-squad-coords-cache';
const LINEUP_CACHE_KEY = 'supabase-match-lineup-cache';

// =========================================================================
// DETERMINISTIC MOCK-TO-UUID MAPPING (POSTGRESQL COMPLIANCE BRIDGING)
// =========================================================================
export const DEFAULT_TEAM_UUID = 'de307384-d113-4956-a5cc-96c20579e0fa';
export const DEFAULT_COACH_UUID = 'db77e5ab-6195-4a06-bf7c-8e57ce7e370b';
export const DEFAULT_CAPTAIN_UUID = 'eb77e5ab-6195-4a06-bf7c-8e57ce7e370d';

export function isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function toUuid(id: string): string {
    if (!id) return DEFAULT_TEAM_UUID;
    if (id === 't-egerton-fc' || id === 'team-egerton-fc') return DEFAULT_TEAM_UUID;
    if (id === 'u-user-current') return DEFAULT_COACH_UUID;
    if (id === 'u-captain') return DEFAULT_CAPTAIN_UUID;

    // Map mock player IDs (e.g., 'p1', 'p2'...) to valid UUID formats
    const playerMatch = id.match(/^p(\d+)$/);
    if (playerMatch) {
        const num = parseInt(playerMatch[1], 10);
        const hex = num.toString(16).padStart(12, '0');
        return `daf00000-0000-0000-0000-${hex}`;
    }

    if (isValidUuid(id)) {
        return id;
    }

    // Fallback deterministic UUID string generator
    const clean = id.replace(/[^a-f0-9]/gi, '').padEnd(12, '0').slice(0, 12);
    return `00000000-0000-0000-0000-${clean}`;
}

export function fromUuid(uuid: string): string {
    if (uuid === DEFAULT_TEAM_UUID) return 't-egerton-fc';
    if (uuid === DEFAULT_COACH_UUID) return 'u-user-current';
    if (uuid === DEFAULT_CAPTAIN_UUID) return 'u-captain';

    if (uuid && uuid.startsWith('daf00000-0000-0000-0000-')) {
        const hex = uuid.substring(24);
        const num = parseInt(hex, 16);
        return `p${num}`;
    }
    return uuid;
}

// =========================================================================
// PRODUCTION SUPABASE QUERIES & MUTATIONS (SCHEMA ALIGNED)
// =========================================================================

/**
 * Resolves the authenticated user's assigned team record from Supabase 'teams' table.
 */
export async function fetchAuthenticatedUserTeam(userId: string): Promise<DBTeam | null> {
    const userUuid = toUuid(userId);
    try {
        // First check if user is coach or captain of a team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .or(`coach_id.eq.${userUuid},captain_id.eq.${userUuid}`)
            .limit(1);

        if (!teamError && teamData && teamData.length > 0) {
            return teamData[0] as DBTeam;
        }

        // Fallback: Fetch primary active team from database
        const { data: defaultTeams, error: defaultError } = await supabase
            .from('teams')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1);

        if (!defaultError && defaultTeams && defaultTeams.length > 0) {
            return defaultTeams[0] as DBTeam;
        }
        return null;
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch team profile from DB:', err);
        return null;
    }
}

/**
 * Fetches players belonging to a team from Supabase 'players' table joining 'profiles'.
 */
export async function fetchTeamPlayers(teamId: string): Promise<Player[]> {
    const teamUuid = toUuid(teamId);
    try {
        const { data, error } = await supabase
            .from('players')
            .select(`
                id,
                jersey_number,
                position,
                height,
                weight,
                preferred_foot,
                nationality,
                profiles:profile_id (
                    id,
                    first_name,
                    last_name,
                    email,
                    avatar_url,
                    role
                )
            `)
            .eq('team_id', teamUuid)
            .order('jersey_number', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map((item: any, index: number) => {
                const profile = item.profiles || {};
                const fullName = profile.first_name || profile.last_name
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    : `Player #${item.jersey_number || index + 1}`;

                let uiPos: 'GK' | 'DF' | 'MD' | 'FW' = 'MD';
                if (item.position === 'GK') uiPos = 'GK';
                else if (item.position === 'DEF' || item.position === 'DF') uiPos = 'DF';
                else if (item.position === 'FWD' || item.position === 'FW') uiPos = 'FW';

                return {
                    id: item.id || toUuid(`p${index + 1}`),
                    name: fullName,
                    number: item.jersey_number || index + 1,
                    position: uiPos,
                    rating: 75 + ((index * 3) % 15),
                    cardImage: profile.avatar_url || `https://images.unsplash.com/photo-${1534528741775 + index}?w=400&auto=format&fit=crop&q=80`,
                    status: 'Fit',
                    goals: (index * 2) % 8,
                    speed: 70 + (index % 20),
                    shooting: 65 + (index % 25),
                    passing: 72 + (index % 18),
                    dribbling: 70 + (index % 22),
                    defense: 68 + (index % 24),
                    physical: 74 + (index % 15),
                    stamina: 85 + (index % 12),
                    nationality: item.nationality || 'Kenya',
                    preferredFoot: item.preferred_foot || 'right',
                    medicalClearance: true,
                    isInjured: false,
                    isSuspended: false
                };
            });
        }
        return [];
    } catch (err) {
        console.warn('[Supabase Client] Error reading players table:', err);
        return [];
    }
}

/**
 * Saves default squad tactical layout to 'squad_configurations' table in Supabase.
 * Exact Schema: team_id, formation, coordinates (JSONB), updated_by, updated_at
 */
export async function saveSquadConfiguration(params: {
    teamId: string;
    formation: string;
    coordinates: SquadPosition[];
    updatedBy: string;
}): Promise<boolean> {
    const teamUuid = toUuid(params.teamId);
    const updatedByUuid = toUuid(params.updatedBy);

    const mappedCoordinates = params.coordinates.map(pos => ({
        ...pos,
        player_id: toUuid(pos.player_id)
    }));

    try {
        console.log('[Supabase Client] Upserting squad_configurations for team:', teamUuid);

        const { data: existing, error: checkError } = await supabase
            .from('squad_configurations')
            .select('id')
            .eq('team_id', teamUuid)
            .limit(1);

        if (checkError) throw checkError;

        let dbError;
        if (existing && existing.length > 0) {
            const { error: updateError } = await supabase
                .from('squad_configurations')
                .update({
                    formation: params.formation,
                    coordinates: mappedCoordinates,
                    updated_by: updatedByUuid,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing[0].id);
            dbError = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('squad_configurations')
                .insert({
                    team_id: teamUuid,
                    formation: params.formation,
                    coordinates: mappedCoordinates,
                    updated_by: updatedByUuid
                });
            dbError = insertError;
        }

        if (dbError) throw dbError;

        localStorage.setItem(`${SQUAD_CACHE_KEY}::${params.teamId}`, JSON.stringify({
            team_id: params.teamId,
            formation: params.formation,
            coordinates: params.coordinates,
            updated_at: new Date().toISOString()
        }));

        return true;
    } catch (error) {
        console.error('[Supabase Client] Save squad_configurations failed:', error);
        return false;
    }
}

/**
 * Loads saved squad tactical configuration from Supabase 'squad_configurations'.
 */
export async function loadSquadConfiguration(teamId: string): Promise<DBSquadConfiguration | null> {
    const teamUuid = toUuid(teamId);
    try {
        const { data, error } = await supabase
            .from('squad_configurations')
            .select('*')
            .eq('team_id', teamUuid)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            return data[0] as DBSquadConfiguration;
        }
        return null;
    } catch (error) {
        console.warn('[Supabase Client] Read squad_configurations failed:', error);
        return null;
    }
}

/**
 * Saves match-specific lineup (Next Game Squad) to 'match_lineups' table in Supabase.
 * Exact Schema: fixture_id, team_id, formation, starting_xi (JSONB), substitutes (JSONB)
 */
export async function saveMatchLineup(params: {
    fixtureId?: string;
    teamId: string;
    formation: string;
    startingXi: any[];
    substitutes: any[];
}): Promise<boolean> {
    const teamUuid = toUuid(params.teamId);

    try {
        console.log('[Supabase Client] Upserting match_lineups for team:', teamUuid);

        const payload: any = {
            team_id: teamUuid,
            formation: params.formation,
            starting_xi: params.startingXi,
            substitutes: params.substitutes
        };
        if (params.fixtureId && isValidUuid(params.fixtureId)) {
            payload.fixture_id = params.fixtureId;
        }

        const { error } = await supabase
            .from('match_lineups')
            .upsert(payload, { onConflict: 'fixture_id,team_id' });

        if (error) {
            const { error: insertError } = await supabase
                .from('match_lineups')
                .insert(payload);
            if (insertError) throw insertError;
        }

        localStorage.setItem(`${LINEUP_CACHE_KEY}::${params.teamId}`, JSON.stringify({
            team_id: params.teamId,
            formation: params.formation,
            starting_xi: params.startingXi,
            substitutes: params.substitutes,
            updated_at: new Date().toISOString()
        }));

        return true;
    } catch (error) {
        console.error('[Supabase Client] Save match_lineups failed:', error);
        return false;
    }
}

/**
 * Fetches team-scoped fixtures from Supabase 'fixtures' table.
 */
export async function fetchTeamFixtures(teamId: string): Promise<Match[]> {
    const teamUuid = toUuid(teamId);
    try {
        const { data, error } = await supabase
            .from('fixtures')
            .select(`
                id,
                scheduled_time,
                status,
                score_home,
                score_away,
                venue,
                matchday,
                home_team:home_team_id(id, name, logo_url),
                away_team:away_team_id(id, name, logo_url)
            `)
            .or(`home_team_id.eq.${teamUuid},away_team_id.eq.${teamUuid}`)
            .order('scheduled_time', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map((f: any) => {
                const isHome = f.home_team?.id === teamUuid;
                const opponent = isHome ? f.away_team : f.home_team;
                const oppName = opponent?.name || 'Opponent FC';
                const oppLogo = opponent?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';

                const scheduledDate = new Date(f.scheduled_time);
                const dateStr = scheduledDate.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                });
                const timeStr = scheduledDate.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let uiStatus: 'UPCOMING' | 'FINISHED' | 'LIVE' = 'UPCOMING';
                if (f.status === 'FT' || f.status === 'FINISHED') uiStatus = 'FINISHED';
                else if (f.status === 'LIVE' || f.status === 'HT') uiStatus = 'LIVE';

                const scoreStr = f.score_home !== null && f.score_away !== null
                    ? `${f.score_home} - ${f.score_away}`
                    : undefined;

                return {
                    id: f.id,
                    opponentName: oppName,
                    opponentLogo: oppLogo,
                    date: dateStr,
                    time: timeStr,
                    location: f.venue || 'Egerton Main Arena',
                    league: 'Premier League',
                    status: uiStatus,
                    score: scoreStr
                };
            });
        }
        return [];
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch team fixtures:', err);
        return [];
    }
}

/**
 * Fetches team announcements from Supabase 'announcements' table.
 */
export async function fetchTeamAnnouncements(teamId: string) {
    const teamUuid = toUuid(teamId);
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select(`
                id,
                title,
                content,
                target_role,
                target_team_id,
                created_at,
                author:author_id(first_name, last_name, role)
            `)
            .or(`target_team_id.eq.${teamUuid},target_role.eq.all,target_team_id.is.null`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch announcements:', err);
        return [];
    }
}

/**
 * Updates team settings in Supabase 'teams' table.
 */
export async function updateTeamSettings(teamId: string, updates: Partial<DBTeam>): Promise<boolean> {
    const teamUuid = toUuid(teamId);
    try {
        const { error } = await supabase
            .from('teams')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', teamUuid);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[Supabase Client] Failed to update team settings:', err);
        return false;
    }
}

/**
 * Paginated player query helper
 */
export async function fetchPlayersPaginated(
    teamId: string,
    page: number = 1,
    limit: number = 12
): Promise<{ data: DBPlayer[]; count: number }> {
    const teamUuid = toUuid(teamId);
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('players')
            .select('*', { count: 'exact' })
            .eq('team_id', teamUuid)
            .order('jersey_number', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { data: (data || []) as DBPlayer[], count: count || 0 };
    } catch (error) {
        console.error('Failed fetching paginated players:', error);
        return { data: [], count: 0 };
    }
}
