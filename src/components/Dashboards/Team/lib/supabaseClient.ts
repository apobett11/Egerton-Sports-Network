// You are writing code for a system governed by our Master Architecture Contract.
// Commandment C-03 (RLS), C-07 (Cache-Aside), C-11 (Pagination), C-16 (Automatic Retries), and C-17 (Fail-safe Default Displays) apply here.

import { supabase } from '../../../../lib/supabase';
import { DBPlayer, DBTeam, DBSquadConfiguration, SquadPosition } from '../types';

export { supabase };

const SQUAD_CACHE_KEY = 'supabase-squad-coords-cache';

// =========================================================================
// DETERMINISTIC MOCK-TO-UUID MAPPING (POSTGRESQL COMPLIANCE BRIDGING)
// =========================================================================
const MOCK_TEAM_UUID = 'de307384-d113-4956-a5cc-96c20579e0fa';
const MOCK_USER_COACH_UUID = 'db77e5ab-6195-4a06-bf7c-8e57ce7e370b';
const MOCK_USER_CAPTAIN_UUID = 'eb77e5ab-6195-4a06-bf7c-8e57ce7e370d';

export function toUuid(id: string): string {
    if (id === 't-egerton-fc') return MOCK_TEAM_UUID;
    if (id === 'u-user-current') return MOCK_USER_COACH_UUID;
    if (id === 'u-captain') return MOCK_USER_CAPTAIN_UUID;

    // Map mock player IDs (e.g., 'p1', 'p2'...) to valid UUID formats
    const playerMatch = id.match(/^p(\d+)$/);
    if (playerMatch) {
        const num = parseInt(playerMatch[1], 10);
        const hex = num.toString(16).padStart(12, '0');
        return `daf00000-0000-0000-0000-${hex}`;
    }

    // Check if it's already a valid UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return id;
    }

    // Fallback deterministic formatting
    return '00000000-0000-0000-0000-' + id.replace(/[^a-f0-9]/gi, '').padEnd(12, '0').slice(0, 12);
}

export function fromUuid(uuid: string): string {
    if (uuid === MOCK_TEAM_UUID) return 't-egerton-fc';
    if (uuid === MOCK_USER_COACH_UUID) return 'u-user-current';
    if (uuid === MOCK_USER_CAPTAIN_UUID) return 'u-captain';

    if (uuid.startsWith('daf00000-0000-0000-0000-')) {
        const hex = uuid.substring(24);
        const num = parseInt(hex, 16);
        return `p${num}`;
    }
    return uuid;
}

// =========================================================================
// PRODUCTION-GRADE SUPABASE CONNECTORS WITH BUILT-IN OFFLINE/FAIL-SAFE FALLBACK
// =========================================================================

/**
 * Saves the current squad lineup configuration with x, y coordinate vectors
 * to squad_configurations table in Supabase.
 * Falls back to localStorage mapping for high availability/reliability (Commandment C-17).
 */
export async function saveSquadConfiguration(params: {
    teamId: string;
    matchId?: string;
    formation: string;
    playerPositions: SquadPosition[];
    createdBy: string;
}): Promise<boolean> {
    const teamUuid = toUuid(params.teamId);
    const creatorUuid = toUuid(params.createdBy);

    // Map player IDs to UUIDs to maintain DB schema integrity
    const mappedPositions = params.playerPositions.map(pos => ({
        ...pos,
        player_id: toUuid(pos.player_id)
    }));

    try {
        console.log('[Supabase Client] Attempting to upsert squad_configurations with positions:', {
            teamUuid,
            formation: params.formation,
            positionsCount: mappedPositions.length
        });

        // Check if configuration exists
        const { data: existing, error: checkError } = await supabase
            .from('squad_configurations')
            .select('id')
            .eq('team_id', teamUuid)
            .eq('formation', params.formation)
            .eq('is_starting_xi', true)
            .limit(1);

        if (checkError) throw checkError;

        let dbError;
        if (existing && existing.length > 0) {
            // Update
            const { error: updateError } = await supabase
                .from('squad_configurations')
                .update({
                    player_positions: mappedPositions,
                    created_by: creatorUuid,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing[0].id);
            dbError = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('squad_configurations')
                .insert({
                    team_id: teamUuid,
                    match_id: params.matchId ? toUuid(params.matchId) : null,
                    formation: params.formation,
                    player_positions: mappedPositions,
                    is_starting_xi: true,
                    created_by: creatorUuid
                });
            dbError = insertError;
        }

        if (dbError) throw dbError;

        // Fail-safe cache-aside strategy: Sync into localStorage (Commandment C-07 / C-17)
        const cachedConfigs = localStorage.getItem(SQUAD_CACHE_KEY);
        const configs = cachedConfigs ? JSON.parse(cachedConfigs) : {};
        configs[`${params.teamId}::${params.formation}`] = {
            team_id: params.teamId,
            match_id: params.matchId,
            formation: params.formation,
            player_positions: params.playerPositions, // Keep mock IDs in UI Cache
            is_starting_xi: true,
            updated_at: new Date().toISOString()
        };
        localStorage.setItem(SQUAD_CACHE_KEY, JSON.stringify(configs));

        return true;
    } catch (error) {
        console.error('[Supabase Client] Save failed. Triggering recovery fallback.', error);

        // Commandment C-17: Fall safe local storage cache write
        try {
            const cachedConfigs = localStorage.getItem(SQUAD_CACHE_KEY);
            const configs = cachedConfigs ? JSON.parse(cachedConfigs) : {};
            configs[`${params.teamId}::${params.formation}`] = {
                team_id: params.teamId,
                match_id: params.matchId,
                formation: params.formation,
                player_positions: params.playerPositions,
                is_starting_xi: true,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem(SQUAD_CACHE_KEY, JSON.stringify(configs));
            return true;
        } catch (e) {
            console.error('LocalStorage write failed:', e);
            return false;
        }
    }
}

/**
 * Loads the saved squad lineup configuration from Supabase 'squad_configurations' table.
 * Defaults back to local storage cache if no records found or database is offline.
 */
export async function loadSquadConfiguration(
    teamId: string,
    formation: string,
    page: number = 1,
    limit: number = 10
): Promise<DBSquadConfiguration | null> {
    const teamUuid = toUuid(teamId);
    const offset = (page - 1) * limit;

    try {
        console.log(`[Supabase Client] Fetching squad_configurations for teamId ${teamId} (${teamUuid}), formation ${formation}. Page = ${page}`);

        const { data, error } = await supabase
            .from('squad_configurations')
            .select('*')
            .eq('team_id', teamUuid)
            .eq('formation', formation)
            .eq('is_starting_xi', true)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        if (data && data.length > 0) {
            const dbConfig = data[0] as DBSquadConfiguration;
            // Map player IDs in the positions array back to mock format ('p1', 'p2'...)
            const mappedPositions = (dbConfig.player_positions || []).map(pos => ({
                ...pos,
                player_id: fromUuid(pos.player_id)
            }));

            const finalConfig = {
                ...dbConfig,
                team_id: teamId,
                player_positions: mappedPositions
            };

            // Commandment C-07: Cache-Aside sync into local cache
            const cachedConfigs = localStorage.getItem(SQUAD_CACHE_KEY);
            const configs = cachedConfigs ? JSON.parse(cachedConfigs) : {};
            configs[`${teamId}::${formation}`] = finalConfig;
            localStorage.setItem(SQUAD_CACHE_KEY, JSON.stringify(configs));

            return finalConfig;
        }

        // Fallback: Read from LocalStorage Cache (Commandment C-17)
        const cachedConfigs = localStorage.getItem(SQUAD_CACHE_KEY);
        if (cachedConfigs) {
            const configs = JSON.parse(cachedConfigs);
            const key = `${teamId}::${formation}`;
            if (configs[key]) {
                console.log('[Supabase Client] Resolved squad configuration from local Cache-Aside database.');
                return configs[key] as DBSquadConfiguration;
            }
        }

        return null;
    } catch (error) {
        console.warn('[Supabase Client] Read error. Querying fail-safe local cache.', error);

        const cachedConfigs = localStorage.getItem(SQUAD_CACHE_KEY);
        if (cachedConfigs) {
            const configs = JSON.parse(cachedConfigs);
            const key = `${teamId}::${formation}`;
            if (configs[key]) return configs[key] as DBSquadConfiguration;
        }
        return null;
    }
}

/**
 * Fetches players from the players table with Server-Side Pagination (Commandment C-11)
 */
export async function fetchPlayersPaginated(
    teamId: string,
    page: number = 1,
    limit: number = 12
): Promise<{ data: DBPlayer[]; count: number }> {
    const teamUuid = toUuid(teamId);
    const offset = (page - 1) * limit;

    try {
        console.log(`[Supabase Client] Fetching paginated players for ${teamId}. Page = ${page}`);
        const { data, error, count } = await supabase
            .from('players')
            .select('*', { count: 'exact' })
            .eq('team_id', teamUuid)
            .order('jersey_number', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Map database entity IDs back to UI mock standard where appropriate
        const mappedData = (data || []).map((player: any) => ({
            ...player,
            id: fromUuid(player.id),
            user_id: fromUuid(player.user_id),
            team_id: fromUuid(player.team_id)
        }));

        return { data: mappedData as DBPlayer[], count: count || 0 };
    } catch (error) {
        console.error('Failed fetching players from db', error);
        return { data: [], count: 0 };
    }
}

// =========================================================================
// TEST QUERIES FOR KEY OPERATIONS (DIAGNOSTIC SCRIPTS MODULE)
// =========================================================================

/**
 * Diagnostic suite to verify SQL connection and RLS policies.
 * Can be imported and run in testing/dev pages.
 */
export const diagnosticQueries = {
    /**
     * Operation 1: Fetch complete team squad roster details
     */
    async fetchTeamSquad(teamId: string = 't-egerton-fc') {
        const teamUuid = toUuid(teamId);
        console.log(`[Diagnostic] Executing: Fetching squad roster for team ${teamId} -> ${teamUuid}`);
        const { data, error } = await supabase
            .from('players')
            .select(`
                id,
                jersey_number,
                position,
                status,
                card_details,
                users (
                    id,
                    full_name,
                    email,
                    role
                )
            `)
            .eq('team_id', teamUuid);

        if (error) {
            console.error('[Diagnostic ERROR] fetchTeamSquad failed:', error);
            throw error;
        }
        console.log('[Diagnostic SUCCESS] fetchTeamSquad returned:', data);
        return data;
    },

    /**
     * Operation 2: Save squad formation coordinates manually
     */
    async saveSquadCoordinates(params: {
        teamId: string;
        formation: string;
        positions: SquadPosition[];
        userId: string;
    }) {
        const teamUuid = toUuid(params.teamId);
        const userUuid = toUuid(params.userId);

        console.log('[Diagnostic] Executing: Saving positions for', params.formation);

        // Execute database upsert/insert directly to bypass helper caches
        const { data, error } = await supabase
            .from('squad_configurations')
            .insert({
                team_id: teamUuid,
                formation: params.formation,
                player_positions: params.positions.map(p => ({ ...p, player_id: toUuid(p.player_id) })),
                is_starting_xi: false,
                created_by: userUuid
            });

        if (error) {
            console.error('[Diagnostic ERROR] saveSquadCoordinates failed:', error);
            throw error;
        }
        console.log('[Diagnostic SUCCESS] saveSquadCoordinates added:', data);
        return data;
    },

    /**
     * Operation 3: Update lineup (Mark configuration as Starting XI status)
     */
    async updateLineupStartingStatus(configId: string, isStarting: boolean) {
        console.log(`[Diagnostic] Executing: Setting is_starting_xi = ${isStarting} on config ${configId}`);
        const { data, error } = await supabase
            .from('squad_configurations')
            .update({ is_starting_xi: isStarting })
            .eq('id', configId);

        if (error) {
            console.error('[Diagnostic ERROR] updateLineupStartingStatus failed:', error);
            throw error;
        }
        console.log('[Diagnostic SUCCESS] updateLineupStartingStatus success:', data);
        return data;
    },

    /**
     * Operation 4: Role-based data fetching verification
     * Attempts to read all matches or users table to verify role policies.
     */
    async testRoleBasedAccessRight() {
        console.log('[Diagnostic] Executing: Reading users table (requires same team ID)');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email, role, full_name');

        if (usersError) {
            console.warn('[Diagnostic WARNING] users table read rejected (normal if unauthenticated or wrong role):', usersError.message);
        } else {
            console.log('[Diagnostic SUCCESS] users table read allowed:', users);
        }

        console.log('[Diagnostic] Executing: Reading teams table (public to authenticated)');
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name');

        return {
            usersAccessible: !usersError,
            teamsAccessible: !teamsError,
            teamsCount: teams?.length || 0
        };
    }
};
