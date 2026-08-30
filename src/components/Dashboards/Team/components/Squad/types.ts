export type Position = 
  | 'CF' 
  | 'SS' 
  | 'LWF' 
  | 'RWF' 
  | 'AMF' 
  | 'LMF' 
  | 'RMF' 
  | 'CMF' 
  | 'DMF' 
  | 'LB' 
  | 'CB' 
  | 'RB' 
  | 'GK';

export type CardTheme = 'purple' | 'blue' | 'black' | 'silver' | 'gold' | 'epic';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  defaultPosition: Position;
  rating: number;
  photoUrl: string;
  flagUrl?: string;
  clubLogoUrl?: string;
  cardTheme: CardTheme;
  isCaptain?: boolean;
  coord?: { x: number; y: number }; // Percentage 0-100 relative to pitch
}

export type Playstyle = 
  | 'Possession Game' 
  | 'Quick Counter' 
  | 'Long Ball Counter' 
  | 'Out Wide' 
  | 'Long Ball';

export type FormationType = 
  | '4-4-1-1' 
  | '4-3-3' 
  | '4-2-1-3' 
  | '4-2-2-2' 
  | '3-2-4-1';

export interface Manager {
  name: string;
  photoUrl: string;
  proficiencies: Record<Playstyle, number>;
}

export interface TeamData {
  id: string;
  name: string;
  shortName: string;
  crestUrl: string;
  formation: FormationType;
  playstyle: Playstyle;
  manager: Manager;
  startingXI: Player[];
  substitutes: Player[];
}

export type ActiveModal = 
  | 'none' 
  | 'manager' 
  | 'team' 
  | 'substitutes' 
  | 'reserves' 
  | 'formation' 
  | 'inMatchRoles';
