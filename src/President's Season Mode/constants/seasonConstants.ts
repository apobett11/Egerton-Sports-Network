// Operational Constants for President's Season Mode

export const COMPETITIONS = {
  PREMIER_LEAGUE: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Egerton Premier League',
    shortName: 'EPL',
    color: '#D4AF37', // Gold
  },
  CHAMPIONSHIP: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Egerton Championship',
    shortName: 'Championship',
    color: '#2563EB', // Blue
  },
} as const;

export const OFFICIAL_PITCHES = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    name: 'Egerton Main Stadium Pitch',
    short_code: 'MAIN-STAD',
    location: 'Main Campus Athletics Complex',
    capacity: 10000,
    surface_type: 'Natural Grass',
    has_lighting: true,
    status: 'Available' as const,
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    name: 'Pavilion Grounds Pitch A',
    short_code: 'PAV-A',
    location: 'Pavilion Sports Complex',
    capacity: 3500,
    surface_type: 'Hybrid Turf',
    has_lighting: true,
    status: 'Available' as const,
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    name: 'Tatton Complex Ground',
    short_code: 'TAT-GRD',
    location: 'Tatton Campus Ground',
    capacity: 2500,
    surface_type: 'Natural Grass',
    has_lighting: false,
    status: 'Available' as const,
  },
];

export const REFEREE_BADGES = [
  'FIFA Accredited',
  'FKF National Level 2',
  'FKF Regional Level 1',
  'FKF Campus Level 3',
];

export const REFEREE_TIERS = [
  { id: 'EPL_Exclusive', label: 'Premier League Exclusive' },
  { id: 'Mixed', label: 'Mixed Competition Pool' },
  { id: 'Championship', label: 'Championship Pool' },
];

export const OPERATIONAL_STATUS_COLORS = {
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
