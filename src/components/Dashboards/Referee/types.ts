export type RefereeTab = 'home' | 'my_matches' | 'match_details' | 'report' | 'settings' | 'profile';

export interface PlayerLookupItem {
  id: string;
  name: string;
  jerseyNumber: number;
  position?: string;
  isSub?: boolean;
}

export interface GoalEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  playerId?: string;
  jerseyNumber: number | '';
  minute: number;
  goalType: 'normal' | 'penalty' | 'own_goal';
}

export interface CardEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  playerId?: string;
  jerseyNumber: number | '';
  minute: number;
  cardType: 'yellow' | 'red';
}

export interface InjuryEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  playerId?: string;
  jerseyNumber: number | '';
  minute: number;
}

export interface RefereeProfileData {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: string;
  association: string;
  assignedMatchesCount: number;
  yearsActive: number;
  statistics: {
    matchesRefereed: number;
    yellowCards: number;
    redCards: number;
    penalties: number;
    cancelled: number;
  };
}
