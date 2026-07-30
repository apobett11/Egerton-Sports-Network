export type RefereeTab = 'home' | 'assignments' | 'control' | 'wizard' | 'history';

export interface GoalEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  minute: number;
  goalType: 'normal' | 'penalty' | 'own_goal';
}

export interface CardEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  minute: number;
  cardType: 'yellow' | 'red';
}

export interface SubstitutionEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerOff: string;
  playerOn: string;
  minute: number;
}

export interface InjuryEntry {
  id: string;
  teamTarget: 'home' | 'away';
  playerName: string;
  severity: 'minor' | 'moderate' | 'severe';
  minute: number;
  notes: string;
}
