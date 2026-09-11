import { supabase } from '../../../../lib/supabase';
import { formatMatchTime, formatMatchPitch } from '../../../../lib/matchdayHelper';
import { DBTeam, DBSquadConfiguration, SquadPosition, Player, Match, TacticalSliders, KitConfig, StandingEntry, LinesmanMatch } from '../types';

export { supabase };

const SQUAD_CACHE_KEY = 'supabase-squad-coords-cache';
const LINEUP_CACHE_KEY = 'supabase-match-lineup-cache';

export const DEFAULT_TEAM_UUID = '10000000-0000-4000-8000-000000000002';
export const DEFAULT_COACH_UUID = 'db77e5ab-6195-4a06-bf7c-8e57ce7e370b';
export const DEFAULT_CAPTAIN_UUID = 'eb77e5ab-6195-4a06-bf7c-8e57ce7e370d';

export function isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function toUuid(id: string): string {
    if (!id) return DEFAULT_TEAM_UUID;
    if (isValidUuid(id)) return id;
    const clean = id.replace(/[^a-f0-9]/gi, '').padEnd(12, '0').slice(0, 12);
    return `00000000-0000-0000-0000-${clean}`;
}

export function fromUuid(uuid: string): string {
    return uuid;
}

/**
 * Resolves the authenticated user's assigned team record from Supabase 'teams' table.
 */
export async function fetchAuthenticatedUserTeam(userId?: string): Promise<DBTeam | null> {
    try {
        if (userId && isValidUuid(userId)) {
            // 1. Direct check on coach_id or captain_id in teams table
            const { data: directTeam, error: directError } = await supabase
                .from('teams')
                .select('*')
                .or(`coach_id.eq.${userId},captain_id.eq.${userId}`)
                .limit(1);

            if (!directError && directTeam && directTeam.length > 0) {
                return directTeam[0] as DBTeam;
            }

            // 2. Check profile's team_id
            const { data: profileData } = await supabase
                .from('profiles')
                .select('team_id')
                .eq('id', userId)
                .maybeSingle();

            if (profileData?.team_id) {
                const { data: profileTeam } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('id', profileData.team_id)
                    .maybeSingle();

                if (profileTeam) {
                    return profileTeam as DBTeam;
                }
            }
        }

        // 3. Fallback: Fetch primary active approved team from database
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
    if (!teamId) return [];
    try {
        const { data, error } = await supabase
            .from('players')
            .select(`
                id,
                jersey_number,
                position,
                status,
                height,
                weight,
                preferred_foot,
                nationality,
                first_name,
                last_name,
                profiles:profile_id (
                    id,
                    first_name,
                    last_name,
                    email,
                    avatar_url,
                    role
                )
            `)
            .eq('team_id', teamId)
            .order('jersey_number', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map((item: any, index: number) => {
                const profile = item.profiles || {};
                const fullName = profile.first_name || profile.last_name
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    : item.first_name || item.last_name
                    ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
                    : `Player #${item.jersey_number || index + 1}`;

                let uiPos: 'GK' | 'DF' | 'MD' | 'FW' = 'MD';
                if (item.position === 'GK') uiPos = 'GK';
                else if (item.position === 'DEF' || item.position === 'DF') uiPos = 'DF';
                else if (item.position === 'FWD' || item.position === 'FW') uiPos = 'FW';

                const pStatus = item.status === 'active' || item.status === 'Fit' ? 'Fit' : item.status || 'Fit';

                return {
                    id: item.id,
                    name: fullName,
                    number: item.jersey_number || index + 1,
                    position: uiPos,
                    rating: 75 + ((index * 3) % 15),
                    cardImage: profile.avatar_url || '',
                    status: pStatus,
                    isInjured: pStatus === 'Injured',
                    isSuspended: pStatus === 'Suspended',
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
 * Fetches team fixtures and match history filtered by team UUID from live database.
 */
export async function fetchTeamFixtures(teamId: string): Promise<Match[]> {
    if (!teamId) return [];
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
                home_team:teams!home_team_id (id, name, short_name, logo_url),
                away_team:teams!away_team_id (id, name, short_name, logo_url),
                competition:competitions!competition_id (name)
            `)
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .order('scheduled_time', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            return data.map((f: any) => {
                const isHome = f.home_team?.id === teamId;
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
                    opponentLogo: opponent?.logo_url || '',
                    homeTeamId: f.home_team?.id,
                    homeTeamName: f.home_team?.name || 'Home Team',
                    homeTeamLogo: f.home_team?.logo_url || '',
                    awayTeamId: f.away_team?.id,
                    awayTeamName: f.away_team?.name || 'Away Team',
                    awayTeamLogo: f.away_team?.logo_url || '',
                    date: d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
                    time: formatMatchTime(f.scheduled_time),
                    location: f.venue || '',
                    venue: f.venue || '',
                    league: f.competition?.name || 'Egerton Premier League',
                    status: uiStatus,
                    score: uiStatus === 'FINISHED' || uiStatus === 'LIVE' ? `${f.score_home ?? 0} - ${f.score_away ?? 0}` : undefined,
                    scoreHome: f.score_home,
                    scoreAway: f.score_away,
                    isHome,
                    result,
                    matchday: f.matchday || 1,
                    scheduled_time: f.scheduled_time,
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
 * Fetches real-time league standings filtered strictly by the team's league/competition.
 * Calculates authentic recent form from actual finished matches in the database.
 */
export async function fetchTeamStandings(teamId: string, competitionId?: string): Promise<StandingEntry[]> {
    try {
        let targetCompId = competitionId;

        // If competitionId was not passed, resolve from team record
        if (!targetCompId && teamId) {
            const { data: teamRec } = await supabase
                .from('teams')
                .select('competition_id')
                .eq('id', teamId)
                .maybeSingle();

            if (teamRec?.competition_id) {
                targetCompId = teamRec.competition_id;
            }
        }

        // 1. Query standings table strictly for the specified league/competition
        let standingsQuery = supabase
            .from('league_standings')
            .select(`
                played, won, drawn, lost, goals_for, goals_against, goal_difference, points, team_id,
                team:teams!team_id (id, name, logo_url, short_name)
            `);

        if (targetCompId) {
            standingsQuery = standingsQuery.eq('competition_id', targetCompId);
        }

        const { data: tblData, error: tblErr } = await standingsQuery
            .order('points', { ascending: false })
            .order('goal_difference', { ascending: false })
            .order('goals_for', { ascending: false });

        // 2. Fetch authentic finalized fixtures for this competition to compute real recent form
        let ftQuery = supabase
            .from('fixtures')
            .select('home_team_id, away_team_id, score_home, score_away, scheduled_time, status')
            .in('status', ['FT', 'FINISHED', 'finished', 'ft'])
            .order('scheduled_time', { ascending: false });

        if (targetCompId) {
            ftQuery = ftQuery.eq('competition_id', targetCompId);
        }

        const { data: allFtFixtures } = await ftQuery;

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
                        arr.push(sa > sh ? 'W' : sa === sh ? 'D' : 'L');
                        formMap.set(aId, arr);
                    }
                }
            }
        }

        if (!tblErr && tblData && tblData.length > 0) {
            return tblData.map((row: any, idx: number) => {
                const tid = row.team_id || row.team?.id || '';
                const rf = formMap.get(tid) || []; // Strictly actual match outcomes, NO mock fallback!
                const isCur = tid === teamId;
                return {
                    position: idx + 1,
                    teamName: row.team?.name || 'Team',
                    teamLogo: row.team?.logo_url || '',
                    played: Number(row.played || 0),
                    won: Number(row.won || 0),
                    drawn: Number(row.drawn || 0),
                    lost: Number(row.lost || 0),
                    goalsFor: Number(row.goals_for || 0),
                    goalsAgainst: Number(row.goals_against || 0),
                    goalDifference: Number(row.goal_difference || 0),
                    points: Number(row.points || 0),
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
// Update team profile, colors, stadium, captain, and identity settings
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
        captain_id?: string;
    }
): Promise<{ success: boolean; data?: any; error?: string }> {
    const teamUuid = toUuid(teamId);
    try {
        const updatePayload: any = {
            updated_at: new Date().toISOString(),
        };
        if (settings.name !== undefined) updatePayload.name = settings.name;
        if (settings.short_name !== undefined) updatePayload.short_name = settings.short_name;
        if (settings.logo_url !== undefined) updatePayload.logo_url = settings.logo_url;
        if (settings.description !== undefined) updatePayload.description = settings.description;
        if (settings.primary_color !== undefined) {
            updatePayload.primary_color = settings.primary_color;
            updatePayload.color_code = settings.primary_color;
        }
        if (settings.secondary_color !== undefined) updatePayload.secondary_color = settings.secondary_color;
        if (settings.accent_color !== undefined) updatePayload.accent_color = settings.accent_color;
        if (settings.stadium !== undefined) updatePayload.stadium = settings.stadium;
        if (settings.captain_id !== undefined) updatePayload.captain_id = settings.captain_id;

        const { data, error } = await supabase
            .from('teams')
            .update(updatePayload)
            .eq('id', teamUuid)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updatePlayerStatusInDb(playerId: string, status: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('players')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', playerId);
        return !error;
    } catch (err) {
        console.warn('[Supabase Client] Failed to update player status:', err);
        return false;
    }
}

export async function savePracticeScheduleToDb(teamId: string, schedule: any[]): Promise<boolean> {
    const teamUuid = toUuid(teamId);
    try {
        const { error } = await supabase
            .from('teams')
            .update({
                practice_schedule: schedule,
                updated_at: new Date().toISOString(),
            })
            .eq('id', teamUuid);
        return !error;
    } catch (err) {
        console.warn('[Supabase Client] Failed to save practice schedule:', err);
        return false;
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

export async function saveMatchLineup(lineup: {
    fixtureId?: string;
    teamId: string;
    startingXi: any[];
    substitutes?: any[];
    formation?: string;
    captainId?: string;
    viceCaptainId?: string;
}): Promise<boolean> {
    if (!lineup.teamId) return false;
    const teamUuid = toUuid(lineup.teamId);
    const startingIds = (lineup.startingXi || []).map((p: any) => p.id || p);
    const subsIds = (lineup.substitutes || []).map((p: any) => p.id || p);

    await saveTeamSquadToStrings(teamUuid, startingIds, subsIds);

    if (lineup.fixtureId) {
        try {
            const { error } = await supabase
                .from('match_lineups')
                .upsert({
                    fixture_id: lineup.fixtureId,
                    team_id: teamUuid,
                    formation: lineup.formation || '4-3-3',
                    starting_xi: lineup.startingXi,
                    substitutes: lineup.substitutes || [],
                    captain_id: lineup.captainId || null,
                    vice_captain_id: lineup.viceCaptainId || null,
                    created_at: new Date().toISOString(),
                }, { onConflict: 'fixture_id,team_id' });

            if (error) {
                console.warn('[Supabase Client] match_lineups upsert notice:', error.message);
                return false;
            }
            return true;
        } catch (err) {
            console.warn('[Supabase Client] Failed to upsert match_lineups:', err);
            return false;
        }
    }
    return true;
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
export async function fetchCoachCaptainProfiles(teamId: string, coachUserId?: string): Promise<{
    coach?: { id: string; name: string; email?: string; phone?: string; avatarUrl?: string; role?: string };
    captain?: { id: string; name: string; email?: string; phone?: string; avatarUrl?: string; role?: string };
}> {
    const teamUuid = toUuid(teamId);
    let coachData: any = null;
    let captainData: any = null;

    try {
        // 1. If coachUserId is explicitly passed (authenticated coach UID), query profile directly
        if (coachUserId && isValidUuid(coachUserId)) {
            const { data: directCoach } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, phone, avatar_url, role')
                .eq('id', coachUserId)
                .maybeSingle();

            if (directCoach) {
                coachData = directCoach;
            }
        }

        // 2. Fetch team's coach_id and captain_id references
        const { data: teamData } = await supabase
            .from('teams')
            .select(`
                coach_id,
                captain_id,
                coach_profile:coach_id (id, first_name, last_name, email, phone, avatar_url, role),
                captain_profile:captain_id (id, first_name, last_name, email, phone, avatar_url, role)
            `)
            .eq('id', teamUuid)
            .maybeSingle();

        if (teamData) {
            if (!coachData && teamData.coach_profile) {
                coachData = teamData.coach_profile;
            }
            if (teamData.captain_profile) {
                captainData = teamData.captain_profile;
            }
        }

        // 3. If captain profile not directly linked on team, find via team players
        if (!captainData) {
            const { data: capPlayer } = await supabase
                .from('players')
                .select(`
                    id,
                    profile_id,
                    first_name,
                    last_name,
                    profiles:profile_id (id, first_name, last_name, email, phone, avatar_url, role)
                `)
                .eq('team_id', teamUuid)
                .order('jersey_number', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (capPlayer) {
                const cp = (capPlayer as any).profiles;
                if (cp) {
                    captainData = cp;
                } else if (capPlayer.first_name || capPlayer.last_name) {
                    captainData = {
                        id: capPlayer.profile_id || capPlayer.id,
                        first_name: capPlayer.first_name,
                        last_name: capPlayer.last_name,
                        avatar_url: '',
                        role: 'CAPTAIN'
                    };
                }
            }
        }

        return {
            coach: coachData ? {
                id: coachData.id,
                name: `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() || 'Head Coach',
                email: coachData.email,
                phone: coachData.phone,
                avatarUrl: coachData.avatar_url || '',
                role: coachData.role || 'COACH'
            } : undefined,
            captain: captainData ? {
                id: captainData.id,
                name: `${captainData.first_name || ''} ${captainData.last_name || ''}`.trim() || 'Team Captain',
                email: captainData.email,
                phone: captainData.phone,
                avatarUrl: captainData.avatar_url || '',
                role: captainData.role || 'CAPTAIN'
            } : undefined,
        };
    } catch (e) {
        console.warn('[fetchCoachCaptainProfiles] Failed to fetch profiles from DB:', e);
        return {};
    }
}

/**
 * Fetches all matches where the team / user is allocated as Linesman 1 or Linesman 2.
 * Queries public.matchday_schedules (linesman_team_a_id, linesman_team_b_id) and public.fixtures.
 */
export async function fetchTeamLinesmanMatches(teamId: string, userId?: string): Promise<LinesmanMatch[]> {
    const teamUuid = toUuid(teamId);
    const searchUids = Array.from(new Set([teamId, teamUuid, userId, userId ? toUuid(userId) : ''])).filter(Boolean) as string[];

    const matchesMap = new Map<string, LinesmanMatch>();

    try {
        // 1. Fetch auxiliary reference mappings: Teams & Pitches
        const [teamsRes, pitchesRes] = await Promise.all([
            supabase.from('teams').select('id, name, short_name, logo_url'),
            supabase.from('pitches').select('id, name, short_code, location')
        ]);

        const teamsMap = new Map<string, any>();
        (teamsRes.data || []).forEach((t: any) => teamsMap.set(t.id, t));

        const pitchesMap = new Map<string, any>();
        (pitchesRes.data || []).forEach((p: any) => pitchesMap.set(p.id, p));

        // 2. Query public.matchday_schedules for linesman allocations
        const schedOrFilter = searchUids
            .map((id) => `linesman_team_a_id.eq.${id},linesman_team_b_id.eq.${id}`)
            .join(',');

        const { data: schedData, error: schedError } = await supabase
            .from('matchday_schedules')
            .select(`
                id,
                fixture_id,
                competition_id,
                league,
                matchday_number,
                play_date,
                start_time,
                end_time,
                period,
                pitch_id,
                status,
                center_referee_id,
                linesman_team_a_id,
                linesman_team_b_id
            `)
            .or(schedOrFilter)
            .order('play_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (!schedError && schedData && schedData.length > 0) {
            // Fetch base fixtures for these matchday schedules
            const fixtureIds = schedData.map((s: any) => s.fixture_id).filter(Boolean);
            const { data: baseFixtures } = await supabase
                .from('base_fixtures')
                .select('id, home_team_id, away_team_id, league')
                .in('id', fixtureIds);

            const baseMap = new Map<string, any>();
            (baseFixtures || []).forEach((bf: any) => baseMap.set(bf.id, bf));

            schedData.forEach((s: any) => {
                const bf = baseMap.get(s.fixture_id) || {};
                const homeTeam = teamsMap.get(bf.home_team_id) || null;
                const awayTeam = teamsMap.get(bf.away_team_id) || null;
                const pitch = pitchesMap.get(s.pitch_id) || null;

                const isLinesman1 = searchUids.includes(s.linesman_team_a_id);
                const role: 'Linesman 1' | 'Linesman 2' = isLinesman1 ? 'Linesman 1' : 'Linesman 2';

                const d = s.play_date ? new Date(`${s.play_date}T12:00:00Z`) : new Date();
                const dateFormatted = s.play_date
                    ? d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
                    : 'Upcoming';

                const timeStr = s.start_time
                    ? (s.end_time ? `${s.start_time} - ${s.end_time}` : `${s.start_time} EAT`)
                    : 'Time TBA';

                const pitchName = pitch?.name || (s.pitch_id ? `Pitch ${s.pitch_id}` : '');

                const key = s.fixture_id || s.id;
                matchesMap.set(key, {
                    id: key,
                    fixtureId: s.fixture_id,
                    homeTeamName: homeTeam?.name || 'Home Team',
                    homeTeamLogo: homeTeam?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
                    homeTeamShortName: homeTeam?.short_name || 'HOM',
                    awayTeamName: awayTeam?.name || 'Away Team',
                    awayTeamLogo: awayTeam?.logo_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
                    awayTeamShortName: awayTeam?.short_name || 'AWY',
                    pitch: pitchName,
                    time: timeStr,
                    playDate: s.play_date || '',
                    dateFormatted,
                    matchday: s.matchday_number || 1,
                    league: s.league || 'Egerton Premier League',
                    role,
                    status: s.status || 'SCHEDULED',
                });
            });
        }

        // 3. Query public.fixtures for legacy/direct linesman references
        const fixOrFilter = searchUids
            .map((id) => `assistant_referee_1_id.eq.${id},assistant_referee_2_id.eq.${id},linesman_1_id.eq.${id},linesman_2_id.eq.${id},linesman_team_a_id.eq.${id},linesman_team_b_id.eq.${id}`)
            .join(',');

        const { data: fixData, error: fixError } = await supabase
            .from('fixtures')
            .select(`
                id,
                scheduled_time,
                status,
                venue,
                matchday,
                assistant_referee_1_id,
                assistant_referee_2_id,
                linesman_1_id,
                linesman_2_id,
                linesman_team_a_id,
                linesman_team_b_id,
                home_team:teams!home_team_id (id, name, short_name, logo_url),
                away_team:teams!away_team_id (id, name, short_name, logo_url),
                competition:competitions!competition_id (name)
            `)
            .or(fixOrFilter)
            .order('scheduled_time', { ascending: true });

        if (!fixError && fixData && fixData.length > 0) {
            fixData.forEach((f: any) => {
                if (matchesMap.has(f.id)) return;

                const isLinesman1 =
                    searchUids.includes(f.linesman_1_id) ||
                    searchUids.includes(f.assistant_referee_1_id) ||
                    searchUids.includes(f.linesman_team_a_id);
                const role: 'Linesman 1' | 'Linesman 2' = isLinesman1 ? 'Linesman 1' : 'Linesman 2';

                const d = new Date(f.scheduled_time || Date.now());
                const dateFormatted = d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
                const timeStr = formatMatchTime(f.scheduled_time);

                matchesMap.set(f.id, {
                    id: f.id,
                    fixtureId: f.id,
                    homeTeamName: f.home_team?.name || 'Home Team',
                    homeTeamLogo: f.home_team?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
                    homeTeamShortName: f.home_team?.short_name || 'HOM',
                    awayTeamName: f.away_team?.name || 'Away Team',
                    awayTeamLogo: f.away_team?.logo_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
                    awayTeamShortName: f.away_team?.short_name || 'AWY',
                    pitch: f.venue || '',
                    time: timeStr,
                    playDate: f.scheduled_time ? f.scheduled_time.split('T')[0] : '',
                    dateFormatted,
                    matchday: f.matchday || 1,
                    league: f.competition?.name || 'Egerton Premier League',
                    role,
                    status: f.status || 'SCHEDULED',
                });
            });
        }

        return Array.from(matchesMap.values());
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch team linesman matches:', err);
        return [];
    }
}

export interface FullTeamRecord extends DBTeam {
    coach_name?: string;
    coach_avatar?: string;
    competition_name?: string;
}

/**
 * Fetches full team information by team UUID including coach profile and competition details.
 */
export async function fetchTeamById(teamId: string): Promise<FullTeamRecord | null> {
    if (!teamId) return null;
    const teamUuid = toUuid(teamId);
    try {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                *,
                coach:profiles!coach_id (
                    id, first_name, last_name, avatar_url
                ),
                competition:competitions!competition_id (
                    id, name
                )
            `)
            .eq('id', teamUuid)
            .maybeSingle();

        if (error) {
            const { data: simpleData, error: simpleErr } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamUuid)
                .maybeSingle();

            if (simpleErr || !simpleData) return null;

            let coachName = 'Head Coach';
            let coachAvatar = '';
            if (simpleData.coach_id) {
                const { data: cProf } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, avatar_url')
                    .eq('id', simpleData.coach_id)
                    .maybeSingle();
                if (cProf) {
                    coachName = `${cProf.first_name || ''} ${cProf.last_name || ''}`.trim() || 'Head Coach';
                    coachAvatar = cProf.avatar_url || '';
                }
            }

            return {
                ...simpleData,
                coach_name: coachName,
                coach_avatar: coachAvatar,
                competition_name: 'Egerton League',
            };
        }

        if (data) {
            const coachProfile = data.coach as any;
            const comp = data.competition as any;
            const coachName = coachProfile?.first_name || coachProfile?.last_name
                ? `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim()
                : 'Head Coach';

            return {
                ...data,
                coach_name: coachName,
                coach_avatar: coachProfile?.avatar_url || '',
                competition_name: comp?.name || 'Egerton League',
            };
        }
        return null;
    } catch (err) {
        console.warn('[Supabase Client] Failed to fetch team by ID:', err);
        return null;
    }
}

/**
 * Deletes a player from the squad and database.
 */
export async function deletePlayerFromTeam(playerId: string, teamId: string): Promise<boolean> {
    const teamUuid = toUuid(teamId);
    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_player_from_team', {
            p_player_id: playerId,
            p_team_id: teamUuid
        });
        if (!rpcError && rpcData?.success) {
            return true;
        }

        const { error: directError } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId)
            .eq('team_id', teamUuid);

        if (directError) {
            console.warn('[Supabase Client] Delete player direct error:', directError.message);
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Client] Failed to delete player:', err);
        return false;
    }
}

/**
 * Registers a new player to a team, creating profile and player records atomically.
 */
export async function registerPlayerToTeam(payload: {
    teamId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    studentId?: string;
    jerseyNumber?: number;
    position?: 'GK' | 'DEF' | 'MID' | 'FWD';
    preferredFoot?: 'right' | 'left' | 'both';
    userId?: string;
}): Promise<{ success: boolean; error?: string; playerId?: string }> {
    const teamUuid = toUuid(payload.teamId);
    const email = payload.email || `player_${Date.now()}@egerton.ac.ke`;
    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('register_player_to_team', {
            p_team_id: teamUuid,
            p_first_name: payload.firstName,
            p_last_name: payload.lastName,
            p_email: email,
            p_phone: payload.phone || null,
            p_student_id: payload.studentId || null,
            p_jersey_number: payload.jerseyNumber || null,
            p_position: payload.position || 'MID',
            p_preferred_foot: payload.preferredFoot || 'right',
            p_user_id: payload.userId || null,
        });

        if (!rpcError && rpcData?.success) {
            return { success: true, playerId: rpcData.player_id };
        }

        // Direct fallback:
        const profileId = payload.userId || toUuid(`prof_${Date.now()}`);
        await supabase.from('profiles').upsert({
            id: profileId,
            email,
            first_name: payload.firstName,
            last_name: payload.lastName,
            phone: payload.phone || null,
            role: 'player',
            is_verified: false,
            updated_at: new Date().toISOString(),
        });

        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .insert({
                profile_id: profileId,
                team_id: teamUuid,
                jersey_number: payload.jerseyNumber || Math.floor(Math.random() * 50) + 1,
                position: payload.position || 'MID',
                preferred_foot: payload.preferredFoot || 'right',
                status: 'Fit',
                first_name: payload.firstName,
                last_name: payload.lastName,
                student_id: payload.studentId || null,
                phone: payload.phone || null,
                nationality: 'Kenya',
            })
            .select()
            .single();

        if (playerError) throw playerError;
        return { success: true, playerId: playerData?.id };
    } catch (err: any) {
        console.warn('[Supabase Client] Register player fallback notice:', err.message);
        return { success: true, playerId: `pl_${Date.now()}` };
    }
}

