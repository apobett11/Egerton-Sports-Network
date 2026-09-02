export type RefereeTab = 'overview' | 'matches' | 'announcements' | 'profile' | 'report' | 'home' | 'my_matches' | 'match_details' | 'settings';

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
  minute: number | '';
  goalType: 'normal' | 'penalty' | 'own_goal';
}

export interface CardEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  playerId?: string;
  jerseyNumber: number | '';
  minute: number | '';
  cardType: 'yellow' | 'red';
}

export interface InjuryEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  playerId?: string;
  jerseyNumber: number | '';
  minute: number | '';
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
    upcomingMatches: number;
    yellowCards: number;
    redCards: number;
    cancelled: number;
  };
}

export interface MatchJournalData {
  title: string;
  fixtureId?: string;
  notes: string;
}

export interface MatchOfficialsDetail {
  referee?: string;
  assistantReferee1?: string;
  assistantReferee2?: string;
  fourthOfficial?: string;
}

export interface MatchdayScheduleGroup {
  matchday: number;
  dateRangeStr: string;
  matches: import('../../../types').Match[];
  isArrived: boolean;
}

