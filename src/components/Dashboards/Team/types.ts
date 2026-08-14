export type UserRole = 'COACH' | 'CAPTAIN' | 'PLAYER' | 'GUEST';

export type PlayerPosition = 'GK' | 'DF' | 'MD' | 'FW';

export type AvailabilityStatus = 'Fit' | 'Active' | 'Recovering' | 'Suspended' | 'Injured' | 'Unavailable' | 'Reserve';

export interface Player {
    id: string;
    name: string;
    number: number;
    position: PlayerPosition;
    rating: number;
    cardImage: string;
    status: AvailabilityStatus;
    goals?: number;
    passPercent?: number;
    saves?: number;
    tackles?: number;
    // Athletic stats
    speed: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    physical: number;
    stamina: number;
    // Metadata
    nickname?: string;
    nationality?: string;
    preferredFoot?: 'left' | 'right' | 'both';
    medicalClearance?: boolean;
    isInjured?: boolean;
    yellowCards?: number;
    redCards?: number;
    isSuspended?: boolean;
    formScore?: number; // 1-10
}

export interface KitConfig {
    id: 'home' | 'away' | 'third' | 'gk' | 'training';
    name: string;
    description: string;
    primaryBg: string;
    stripeColor: string | null;
    accentColor: string;
    collarColor: string;
    imageUrl?: string;
    updatedAt?: string;
}

export interface MatchStatusInfo {
    isLocked: boolean;
    lockReason?: string;
}

export interface RoleAssignments {
    captainId: string;
    viceCaptainId?: string;
    emergencyGkId?: string;
    penaltyTakerId: string;
    freeKickTakerId: string;
    leftCornerTakerId: string;
    rightCornerTakerId: string;
    kickoffPlayerId?: string;
    throwInPriorityId?: string;
    subPriorityId?: string;
}

export interface PracticeSession {
    id: string;
    day: string;
    time: string;
    location: string;
    activity: string;
    assignedBy?: string;
    coachApproved?: boolean;
    intensity?: 'High' | 'Medium' | 'Recovery';
    focusArea?: string;
}

export type MatchStatus = 'FINISHED' | 'LIVE' | 'UPCOMING';

export interface Match {
    id: string;
    opponentName: string;
    opponentLogo: string;
    date: string;
    time: string;
    location: string;
    league: string;
    status: MatchStatus;
    score?: string;
    scoreHome?: number;
    scoreAway?: number;
    isHome?: boolean;
    result?: 'W' | 'D' | 'L';
    referee?: string;
    matchday?: number;
}

export interface TeamFormEntry {
    matchId: string;
    opponentName: string;
    opponentLogo: string;
    result: 'W' | 'D' | 'L';
    scoreText: string;
    date: string;
    competition: string;
    goalDifference: number;
}

export interface StandingEntry {
    position: number;
    teamName: string;
    teamLogo: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    isCurrent: boolean;
    recentForm?: ('W' | 'D' | 'L')[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole | 'PLAYER' | 'GUEST';
    teamId?: string;
}

export interface TacticalSliders {
    attackingDepth: number; // 0 - 100 (e.g. 55)
    defensiveLineHeight: number; // 0 - 100 (e.g. 65)
    teamSupportWidth: number; // 0 - 100 (e.g. 60)
    pressingIntensity: number; // 0 - 100 (e.g. 75)
    buildUpStyle: string; // 'Short Pass' | 'Direct Play' | 'Fast Counter'
}

export interface PitchNodeCoordinate {
    roleLabel: string;
    bottomPercent: number; // calculated from bottom (0 = goal line, 100 = opponent goal)
    rightPercent: number;  // calculated from right (0 = right sideline, 100 = left sideline)
    baseBottom: number;
    baseRight: number;
    positionType: 'GK' | 'DF' | 'MD' | 'FW';
    isWide?: boolean;
}

export type FormationName =
    | '4-3-3 Attack'
    | '4-3-3 Defend'
    | '4-4-2 Flat'
    | '4-4-2 Diamond'
    | '4-2-3-1 Wide'
    | '4-1-4-1'
    | '3-5-2'
    | '3-4-3'
    | '5-3-2'
    | '5-4-1'
    | '4-4-1-1';

// Database-aligned Types representing Supabase Schema
export interface DBTeam {
    id: string;
    name: string;
    short_name?: string;
    color_code?: string;
    league?: string;
    logo_url?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    stadium?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    season?: string;
    captain_id?: string;
    coach_id?: string;
    starting_xi_str?: string;
    substitutes_str?: string;
    temporary_match_squad?: Record<string, any>;
    tactics_config?: TacticalSliders & { formation: string };
    kits_config?: KitConfig[];
    created_at: string;
    updated_at: string;
}

export interface SquadPosition {
    player_id: string;
    position_name: string;
    bottom_percent?: number; // percentage from bottom
    right_percent?: number;  // percentage from right
    x_coordinate?: number;
    y_coordinate?: number;
}

export interface DBSquadConfiguration {
    id: string;
    team_id: string;
    match_id?: string;
    formation: string;
    player_positions: SquadPosition[];
    is_starting_xi: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
