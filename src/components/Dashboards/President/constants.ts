import type { SeasonItem, LeagueItem, PendingTeam, TeamItem, RefereeItem, DraftFixture } from './types';

export const COMPETITIONS = {
  PREMIER_LEAGUE: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Egerton Premier League',
    shortName: 'EPL',
    color: '#D4AF37',
  },
  CHAMPIONSHIP: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Egerton Championship',
    shortName: 'Championship',
    color: '#2563EB',
  },
} as const;

export const INITIAL_SEASONS: SeasonItem[] = [
  {
    id: 's1',
    name: '2027 Egerton Premier Football Season',
    startDate: '2027-09-01',
    endDate: '2028-05-30',
    registrationCutoff: '2027-08-20',
    status: 'active',
    isLocked: false
  },
  {
    id: 's2',
    name: '2026 Campus Champions Cup',
    startDate: '2026-09-01',
    endDate: '2027-05-20',
    registrationCutoff: '2026-08-15',
    status: 'archived',
    isLocked: true
  }
];

export const INITIAL_LEAGUES: LeagueItem[] = [
  { id: 'l1', name: 'Egerton Premier League', tier: 'Division 1', maxTeams: 16, currentTeamsCount: 6, status: 'Active', isArchived: false },
  { id: 'l2', name: 'Egerton Championship League', tier: 'Division 2', maxTeams: 16, currentTeamsCount: 2, status: 'Active', isArchived: false }
];

export const INITIAL_PENDING_TEAMS: PendingTeam[] = [
  {
    id: 'pt1',
    name: 'Nakuru Town Campus FC',
    code: 'NTC',
    requestedLeague: 'premier',
    division: 'Division 1',
    coachName: 'Coach Simon Ouma',
    coachAssigned: true,
    playerCount: 18,
    submittedAt: '2027-07-20',
    doctorAssigned: true
  },
  {
    id: 'pt2',
    name: 'Veterinary Academy FC',
    code: 'VAC',
    requestedLeague: 'championship',
    division: 'Division 2',
    coachName: 'Coach Faith Chepkoech',
    coachAssigned: true,
    playerCount: 21,
    submittedAt: '2027-07-22',
    doctorAssigned: false
  }
];

export const INITIAL_TEAMS: TeamItem[] = [
  { id: 't1', name: 'Agriculture FC', code: 'AGR', league: 'premier', coach: 'Coach David Kamau', captain: 'Brian Kiprono (#7)', playerCount: 22, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. Sarah Wanja', hasCoach: true, hasCaptain: true },
  { id: 't2', name: 'Engineering Strikers FC', code: 'ENG', league: 'premier', coach: 'Prof. J. Mwangi', captain: 'Kevin Otieno (#10)', playerCount: 24, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. Michael Ndung\'u', hasCoach: true, hasCaptain: true },
  { id: 't3', name: 'Njoro Spurs', code: 'NJO', league: 'premier', coach: 'Coach Peter Maina', captain: 'Victor Wanyama (#8)', playerCount: 25, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. James Okeyo', hasCoach: true, hasCaptain: true },
  { id: 't4', name: 'Science Lions', code: 'SCI', league: 'premier', coach: 'Coach Mark Ruto', captain: 'Francis Omwamba (#1)', playerCount: 18, maxRoster: 25, doctorStatus: 'Unassigned', hasCoach: true, hasCaptain: true },
  { id: 't5', name: 'Tatton United FC', code: 'TAT', league: 'premier', coach: 'Coach Alex Omondi', captain: 'Dennis Kimani (#9)', playerCount: 23, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. Anne Chebet', hasCoach: true, hasCaptain: true },
  { id: 't6', name: 'Vet Med Warriors', code: 'VET', league: 'premier', coach: 'Coach Eric Kiprop', captain: 'Samuel Mutua (#4)', playerCount: 20, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. Anne Chebet', hasCoach: true, hasCaptain: true },
  { id: 't7', name: 'Education Stars', code: 'EDU', league: 'championship', coach: 'Coach Josephat Langat', captain: 'Paul Njoroge (#5)', playerCount: 19, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. Mary Wambui', hasCoach: true, hasCaptain: true },
  { id: 't8', name: 'Health Sciences FC', code: 'HSC', league: 'championship', coach: 'Coach Beatrice Korir', captain: 'Luke Rotich (#11)', playerCount: 21, maxRoster: 25, doctorStatus: 'Assigned', doctorName: 'Dr. Grace Njeri', hasCoach: true, hasCaptain: true }
];

export const INITIAL_REFEREES: RefereeItem[] = [
  { id: 'r1', name: 'Ref. John Mwangi', phone: '+254 712 345 678', email: 'j.mwangi@egerton.ac.ke', availability: 'Available', status: 'Active', experience: '6 Seasons', badgeLevel: 'FKF National Level 2', assignedMatchesCount: 14, seasonAssigned: true },
  { id: 'r2', name: 'Ref. Grace Wanjiru', phone: '+254 723 456 789', email: 'g.wanjiru@egerton.ac.ke', availability: 'Assigned', status: 'Active', experience: '4 Seasons', badgeLevel: 'FKF Regional Level 1', assignedMatchesCount: 9, seasonAssigned: true },
  { id: 'r3', name: 'Ref. Daniel Kipchumba', phone: '+254 734 567 890', email: 'd.kipchumba@egerton.ac.ke', availability: 'Available', status: 'Active', experience: '8 Seasons', badgeLevel: 'FIFA Accredited', assignedMatchesCount: 18, seasonAssigned: true },
  { id: 'r4', name: 'Ref. Samuel Odhiambo', phone: '+254 745 678 901', email: 's.odhiambo@egerton.ac.ke', availability: 'Unavailable', status: 'Pending Verification', experience: '2 Seasons', badgeLevel: 'FKF Campus Level 3', assignedMatchesCount: 3, seasonAssigned: false }
];

export const INITIAL_DRAFT_FIXTURES: DraftFixture[] = [
  { id: 'df1', matchday: 1, homeTeam: 'Agriculture FC', awayTeam: 'Engineering Strikers FC', date: '2027-09-04', timeSlot: '14:00', pitch: 'Main Stadium Pitch A', hasConflict: false },
  { id: 'df2', matchday: 1, homeTeam: 'Njoro Spurs', awayTeam: 'Science Lions', date: '2027-09-04', timeSlot: '16:00', pitch: 'Main Stadium Pitch A', hasConflict: false },
  { id: 'df3', matchday: 1, homeTeam: 'Tatton United FC', awayTeam: 'Vet Med Warriors', date: '2027-09-04', timeSlot: '16:00', pitch: 'Main Stadium Pitch A', hasConflict: true, conflictReason: 'Pitch double-booked with Match #df2 at 16:00' },
  { id: 'df4', matchday: 2, homeTeam: 'Engineering Strikers FC', awayTeam: 'Njoro Spurs', date: '2027-09-11', timeSlot: '15:00', pitch: 'Pavilion Ground', hasConflict: false },
  { id: 'df5', matchday: 2, homeTeam: 'Science Lions', awayTeam: 'Tatton United FC', date: '2027-09-11', timeSlot: '15:00', pitch: 'Tatton Complex', hasConflict: false }
];

export const OFFICIAL_PITCHES = [
  {
    id: '91111111-1111-1111-1111-111111111111',
    name: 'Pitch A — Main Stadium Pitch',
    short_code: 'PITCH-A',
    location: 'Main Campus Athletics Complex',
    capacity: 10000,
    surface_type: 'Natural Grass',
    has_lighting: true,
    status: 'Available',
  },
  {
    id: '92222222-2222-2222-2222-222222222222',
    name: 'Pitch B — Pavilion Grounds',
    short_code: 'PITCH-B',
    location: 'Pavilion Sports Complex',
    capacity: 3500,
    surface_type: 'Hybrid Turf',
    has_lighting: true,
    status: 'Available',
  },
  {
    id: '93333333-3333-3333-3333-333333333333',
    name: 'Pitch C — Tatton Complex Ground',
    short_code: 'PITCH-C',
    location: 'Tatton Campus Ground',
    capacity: 2500,
    surface_type: 'Natural Grass',
    has_lighting: false,
    status: 'Available',
  },
];

export const OPERATIONAL_STATUS_COLORS: Record<string, string> = {
  Available: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Maintenance: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Occupied: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Suspended: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  rejected: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Deactivated: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  Inactive: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  Unavailable: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

