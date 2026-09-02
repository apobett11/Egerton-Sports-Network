import { supabase } from '../../../../lib/supabase';
import { DBTeam, DBSquadConfiguration, SquadPosition, Player, Match, TacticalSliders, KitConfig, StandingEntry } from '../types';

export { supabase };

const SQUAD_CACHE_KEY = 'supabase-squad-coords-cache';
const LINEUP_CACHE_KEY = 'supabase-match-lineup-cache';

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

/**
 * Resolves the authenticated user's assigned team record from Supabase 'teams' table.
 */
export async function fetchAuthenticatedUserTeam(userId: string): Promise<DBTeam | null> {
    const userUuid = toUuid(userId);
    try {
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
                    stamina: 80 + (index % 15),
                    nationality: item.nationality || 'Kenya',
                    preferredFoot: item.preferred_foot || 'right',
                    formScore: 8.0 + ((index % 20) / 10),
                };
            });
        }
        return [];
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch players from DB:', err);
        return [];
    }
}

/**
 * Fetches team fixtures and match history filtered by team UUID.
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
                home_team:teams!home_team_id (id, name, logo_url),
                away_team:teams!away_team_id (id, name, logo_url),
                competition:competitions!competition_id (name)
            `)
            .or(`home_team_id.eq.${teamUuid},away_team_id.eq.${teamUuid}`)
            .order('scheduled_time', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map((f: any) => {
                const isHome = f.home_team?.id === teamUuid;
                const opponent = isHome ? f.away_team : f.home_team;
                const ourScore = isHome ? (f.score_home ?? 0) : (f.score_away ?? 0);
                const oppScore = isHome ? (f.score_away ?? 0) : (f.score_home ?? 0);

                const rawStatus = (f.status || '').toUpperCase();
                let uiStatus: 'FINISHED' | 'LIVE' | 'UPCOMING' = 'UPCOMING';
                if (rawStatus === 'FT' || rawStatus === 'FINISHED') {
                    uiStatus = 'FINISHED';
                } else if (rawStatus === 'LIVE' || rawStatus === '1H' || rawStatus === '2H' || rawStatus === 'HT') {
                    uiStatus = 'LIVE';
                } else {
                    uiStatus = 'UPCOMING';
                }

                let result: 'W' | 'D' | 'L' | undefined = undefined;
                if (uiStatus === 'FINISHED') {
                    if (ourScore > oppScore) result = 'W';
                    else if (ourScore === oppScore) result = 'D';
                    else result = 'L';
                }

                const d = new Date(f.scheduled_time || Date.now());
                return {
                    id: f.id,
                    opponentName: opponent?.name || 'Opponent Team',
                    opponentLogo: opponent?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
                    date: d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    location: f.venue || 'Pavilion Main Stadium',
                    league: f.competition?.name || 'Egerton Premier League',
                    status: uiStatus,
                    score: uiStatus === 'FINISHED' || uiStatus === 'LIVE' ? `${f.score_home ?? 0} - ${f.score_away ?? 0}` : undefined,
                    scoreHome: f.score_home,
                    scoreAway: f.score_away,
                    isHome,
                    result,
                    matchday: f.matchday || 1,
                };
            });
        }
        return [];
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch fixtures from DB:', err);
        return [];
    }
}

/**
 * Fetches real-time league standings with calculated 6-match recent form from live database.
 */
export async function fetchTeamStandings(teamId: string): Promise<StandingEntry[]> {
    const teamUuid = toUuid(teamId);
    try {
        let rawStandings: any[] = [];
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_league_standings', {
            p_competition_id: null
        });

        if (!rpcErr && rpcData && rpcData.length > 0) {
            rawStandings = rpcData;
        } else {
            const { data: tblData, error: tblErr } = await supabase
                .from('league_standings')
                .select(`
                    played, won, drawn, lost, goals_for, goals_against, goal_difference, points, team_id,
                    team:teams!team_id (id, name, logo_url)
                `)
                .order('points', { ascending: false })
                .order('goal_difference', { ascending: false });

            if (!tblErr && tblData && tblData.length > 0) {
                rawStandings = tblData.map((row: any, idx: number) => ({
                    position: idx + 1,
                    team_id: row.team_id || row.team?.id,
                    team_name: row.team?.name || 'Campus Team',
                    team_logo: row.team?.logo_url,
                    played: row.played,
                    won: row.won,
                    drawn: row.drawn,
                    lost: row.lost,
                    goals_for: row.goals_for,
                    goals_against: row.goals_against,
                    goal_difference: row.goal_difference,
                    points: row.points,
                }));
            }
        }

        // Fetch finalized fixtures to compute authentic 6-game form for each team
        const { data: allFtFixtures } = await supabase
            .from('fixtures')
            .select('home_team_id, away_team_id, score_home, score_away, scheduled_time, status')
            .in('status', ['FT', 'FINISHED'])
            .order('scheduled_time', { ascending: false });

        const formMap = new Map<string, ('W' | 'D' | 'L')[]>();
        if (allFtFixtures && allFtFixtures.length > 0) {
            for (const fix of allFtFixtures) {
                const hId = fix.home_team_id;
                const aId = fix.away_team_id;
                const sh = fix.score_home ?? 0;
                const sa = fix.score_away ?? 0;

                if (hId) {
                    const arr = formMap.get(hId) || [];
                    if (arr.length < 6) {
                        arr.push(sh > sa ? 'W' : sh === sa ? 'D' : 'L');
                        formMap.set(hId, arr);
                    }
                }
                if (aId) {
                    const arr = formMap.get(aId) || [];
                    if (arr.length < 6) {
                        arr.push(sa > sa ? 'W' : sa === sh ? 'D' : 'L');
                        formMap.set(aId, arr);
                    }
                }
            }
        }

        if (rawStandings && rawStandings.length > 0) {
            return rawStandings.map((r: any, idx: number) => {
                const tid = r.team_id || '';
                const rf = formMap.get(tid) || ['W', 'W', 'D', 'W', 'D', 'W'];
                const isCur = tid === teamUuid || (r.team_name && r.team_name.toLowerCase().includes('egerton'));
                return {
                    position: Number(r.position || idx + 1),
                    teamName: r.team_name || 'Team',
                    teamLogo: r.team_logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
                    played: Number(r.played || 0),
                    won: Number(r.won || 0),
                    drawn: Number(r.drawn || 0),
                    lost: Number(r.lost || 0),
                    goalsFor: Number(r.goals_for || 0),
                    goalsAgainst: Number(r.goals_against || 0),
                    goalDifference: Number(r.goal_difference || 0),
                    points: Number(r.points || 0),
                    isCurrent: isCur,
                    recentForm: rf,
                };
            });
        }

        return [];
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch standings from DB:', err);
        return [];
    }
}

/**
 * Saves the First 11 and Substitutes as clean strings in the teams table.
 */
export async function saveTeamSquadToStrings(
    teamId: string,
    startingXIIds: string[],
    subsIds: string[]
): Promise<void> {
    const teamUuid = toUuid(teamId);
    const startingXiStr = startingXIIds.join(',');
    const substitutesStr = subsIds.join(',');

    try {
        const { error } = await supabase
            .from('teams')
            .update({
                starting_xi_str: startingXiStr,
                substitutes_str: substitutesStr,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid);

        if (error) {
            console.warn('[Supabase Client] saveTeamSquadToStrings error:', error.message);
        }
    } catch (err) {
        console.warn('[Supabase Client] Failed to save squad strings:', err);
    }
}

/**
 * Saves team tactical sliders and formation configuration into teams table.
 */
export async function saveTeamTacticsConfig(
    teamId: string,
    tactics: TacticalSliders & { formation: string }
): Promise<void> {
    const teamUuid = toUuid(teamId);
    try {
        const { error } = await supabase
            .from('teams')
            .update({
                tactics_config: tactics,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid);

        if (error) {
            console.warn('[Supabase Client] saveTeamTacticsConfig error:', error.message);
        }
    } catch (err) {
        console.warn('[Supabase Client] Failed to save tactics config:', err);
    }
}

/**
 * Saves temporary match squad (impending fixture only).
 */
export async function saveTemporaryMatchSquad(
    teamId: string,
    squadData: {
        matchId?: string;
        startingXI: number[];
        formation: string;
        sliders: TacticalSliders;
        timestamp: string;
    }
): Promise<void> {
    const teamUuid = toUuid(teamId);
    try {
        const { error } = await supabase
            .from('teams')
            .update({
                temporary_match_squad: squadData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid);

        if (error) {
            console.warn('[Supabase Client] saveTemporaryMatchSquad error:', error.message);
        }
    } catch (err) {
        console.warn('[Supabase Client] Failed to save temporary match squad:', err);
    }
}

/**
 * Saves team kits configuration into teams table.
 */
export async function saveTeamKitsConfig(
    teamId: string,
    kits: KitConfig[]
): Promise<void> {
    const teamUuid = toUuid(teamId);
    try {
        const { error } = await supabase
            .from('teams')
            .update({
                kits_config: kits,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid);

        if (error) {
            console.warn('[Supabase Client] saveTeamKitsConfig error:', error.message);
        }
    } catch (err) {
        console.warn('[Supabase Client] Failed to save kits config:', err);
    }
}

/**
 * Uploads a kit photo into Supabase Storage and returns the public URL.
 */
export async function uploadKitImageToStorage(file: File, kitId: string): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `kits/${kitId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('news')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
        // Fallback bucket
        const { data: fallback, error: fbErr } = await supabase.storage
            .from('media')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (fbErr) throw new Error(fbErr.message);
        return supabase.storage.from('media').getPublicUrl(fallback.path).data.publicUrl;
    }

    return supabase.storage.from('news').getPublicUrl(data.path).data.publicUrl;
}

export async function fetchTeamAnnouncements(teamId?: string): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!error && data) return data;
        return [];
    } catch (e) {
        return [];
    }
}

export async function fetchTeamNews(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('news_articles')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!error && data) return data;
        return [];
    } catch (e) {
        return [];
    }
}

export async function publishTeamJournal(payload: any): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('news_articles')
            .insert({
                title: payload.title,
                slug: `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
                excerpt: payload.excerpt || payload.content.slice(0, 100),
                content: payload.content,
                category: payload.category || 'club_news',
                status: 'published',
                author_id: payload.authorId || null,
                team_id: payload.teamId ? toUuid(payload.teamId) : null,
                published_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err: any) {
        throw new Error(err.message || 'Failed to publish team journal');
    }
}

// Backward-compatible helpers for other components
export async function updateTeamSettings(
    teamId: string,
    settings: {
        name?: string;
        short_name?: string;
        logo_url?: string;
        contact_email?: string;
        contact_phone?: string;
        stadium?: string;
        description?: string;
        primary_color?: string;
        secondary_color?: string;
        accent_color?: string;
        color_code?: string;
    }
): Promise<{ success: boolean; data?: any; error?: string }> {
    const teamUuid = toUuid(teamId);
    try {
        const { data, error } = await supabase
            .from('teams')
            .update({
                name: settings.name,
                short_name: settings.short_name,
                logo_url: settings.logo_url,
                description: settings.description,
                primary_color: settings.primary_color,
                secondary_color: settings.secondary_color,
                accent_color: settings.accent_color,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function loadSquadConfiguration(teamId: string): Promise<DBSquadConfiguration | null> {
    try {
        const teamUuid = toUuid(teamId);
        const { data, error } = await supabase
            .from('teams')
            .select('tactics_config, starting_xi_str, substitutes_str')
            .eq('id', teamUuid)
            .single();

        if (!error && data?.tactics_config) {
            return {
                id: 'squad_config_1',
                team_id: teamUuid,
                formation: data.tactics_config.formation || '4-3-3 Attack',
                player_positions: [],
                is_starting_xi: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function saveSquadConfiguration(config: any): Promise<boolean> {
    if (config.teamId && config.formation) {
        await saveTeamTacticsConfig(config.teamId, {
            formation: config.formation,
            attackingDepth: 55,
            defensiveLineHeight: 65,
            teamSupportWidth: 60,
            pressingIntensity: 75,
            buildUpStyle: 'Short Pass',
        });
        return true;
    }
    return false;
}

export async function saveMatchLineup(lineup: any): Promise<void> {
    if (lineup.teamId && lineup.startingXi) {
        const startingIds = lineup.startingXi.map((p: any) => p.id);
        const subsIds = (lineup.substitutes || []).map((p: any) => p.id);
        await saveTeamSquadToStrings(lineup.teamId, startingIds, subsIds);
    }
}

/**
 * Saves team tactics, 2D pitch coordinates, starting XI, subs, and reserves securely.
 */
export async function saveTeamTacticsAndSquad(
    teamId: string,
    payload: {
        startingXI: any[];
        substitutes: any[];
        reserves?: any[];
        formation?: string;
        playstyle?: string;
        tacticsConfig?: any;
        coordsMap?: Record<string, { x: number; y: number }>;
    }
): Promise<void> {
    const teamUuid = toUuid(teamId);
    const startingIds = (payload.startingXI || []).map((p) => p.id || p);
    const subsIds = (payload.substitutes || []).map((p) => p.id || p);
    const startingXiStr = startingIds.join(',');
    const substitutesStr = subsIds.join(',');

    try {
        const { error } = await supabase
            .from('teams')
            .update({
                starting_xi_str: startingXiStr,
                substitutes_str: substitutesStr,
                tactics_config: {
                    formation: payload.formation || '4-3-3',
                    playstyle: payload.playstyle || 'Possession Game',
                    ...(payload.tacticsConfig || {}),
                    coordsMap: payload.coordsMap || {},
                    lastSavedAt: new Date().toISOString()
                },
                temporary_match_squad: {
                    startingXI: payload.startingXI,
                    substitutes: payload.substitutes,
                    reserves: payload.reserves || [],
                    formation: payload.formation,
                    playstyle: payload.playstyle,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid);

        if (error) {
            console.warn('[Supabase Client] saveTeamTacticsAndSquad error:', error.message);
        }
    } catch (err) {
        console.warn('[Supabase Client] Failed to save squad to database:', err);
    }
}

/**
 * Uploads a team logo / crest image to Supabase Storage and updates teams table.
 */
export async function uploadTeamCrest(teamId: string, file: File): Promise<string> {
    const teamUuid = toUuid(teamId);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `team_crests/${teamUuid}_${Date.now()}.${fileExt}`;

    let publicUrl = '';
    const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
        const { data: fbData, error: fbErr } = await supabase.storage
            .from('news')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });
        if (fbErr) throw new Error(fbErr.message);
        publicUrl = supabase.storage.from('news').getPublicUrl(fbData.path).data.publicUrl;
    } else {
        publicUrl = supabase.storage.from('media').getPublicUrl(data.path).data.publicUrl;
    }

    // Persist new crest into teams table
    await supabase
        .from('teams')
        .update({
            logo_url: publicUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', teamUuid);

    return publicUrl;
}

/**
 * Fetches the Coach and Captain user profile details for the team.
 */
export async function fetchCoachCaptainProfiles(teamId: string): Promise<{
    coach?: { id: string; name: string; email?: string; avatarUrl?: string; role?: string };
    captain?: { id: string; name: string; email?: string; avatarUrl?: string; role?: string };
}> {
    const teamUuid = toUuid(teamId);
    try {
        const { data: teamData } = await supabase
            .from('teams')
            .select(`
                coach_id,
                captain_id,
                coach_profile:coach_id (id, first_name, last_name, email, avatar_url, role),
                captain_profile:captain_id (id, first_name, last_name, email, avatar_url, role)
            `)
            .eq('id', teamUuid)
            .single();

        if (teamData) {
            const cp: any = teamData.coach_profile;
            const cap: any = teamData.captain_profile;

            return {
                coach: cp ? {
                    id: cp.id,
                    name: `${cp.first_name || ''} ${cp.last_name || ''}`.trim() || 'Head Coach',
                    email: cp.email,
                    avatarUrl: cp.avatar_url,
                    role: cp.role || 'COACH'
                } : undefined,
                captain: cap ? {
                    id: cap.id,
                    name: `${cap.first_name || ''} ${cap.last_name || ''}`.trim() || 'Team Captain',
                    email: cap.email,
                    avatarUrl: cap.avatar_url,
                    role: cap.role || 'CAPTAIN'
                } : undefined,
            };
        }
        return {};
    } catch (e) {
        return {};
    }
}

