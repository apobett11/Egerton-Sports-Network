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
    nationality?: string;
    preferredFoot?: 'left' | 'right' | 'both';
    medicalClearance?: boolean;
    isInjured?: boolean;
    yellowCards?: number;
    redCards?: number;
    isSuspended?: boolean;
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
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole | 'PLAYER' | 'GUEST';
    teamId?: string;
}

// Database-aligned Types representing Supabase Schema
export interface DBTeam {
    id: string;
    name: string;
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
    kits_config?: KitConfig[];
    created_at: string;
    updated_at: string;
}

export interface DBUser {
    id: string;
    email: string;
    role: 'COACH' | 'CAPTAIN' | 'PLAYER' | 'GUEST';
    team_id?: string;
    full_name: string;
    created_at: string;
    updated_at: string;
}

export interface DBPlayer {
    id: string;
    user_id: string;
    team_id: string;
    jersey_number: number;
    position: string;
    date_of_birth?: string;
    nationality?: string;
    height?: number;
    weight?: number;
    status: string;
    card_details: {
        rating: number;
        speed: number;
        shooting: number;
        passing: number;
        dribbling: number;
        defense: number;
        physical: number;
        stamina: number;
        saves?: number;
        goals?: number;
        passPercent?: number;
        tackles?: number;
    };
    image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface SquadPosition {
    player_id: string;
    position_name: string;
    x_coordinate: number; // percentage from left, e.g. 50
    y_coordinate: number; // percentage from top, e.g. 85
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


