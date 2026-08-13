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
    id: '91111111-1111-4111-8111-111111111111',
    name: 'Egerton Main Stadium Pitch',
    short_code: 'MAIN-STAD',
    location: 'Main Campus Athletics Complex',
    capacity: 10000,
    surface_type: 'Natural Grass',
    has_lighting: true,
    status: 'Available' as const,
  },
  {
    id: '92222222-2222-4222-8222-222222222222',
    name: 'Pavilion Grounds Pitch A',
    short_code: 'PAV-A',
    location: 'Pavilion Sports Complex',
    capacity: 3500,
    surface_type: 'Hybrid Turf',
    has_lighting: true,
    status: 'Available' as const,
  },
  {
    id: '93333333-3333-4333-8333-333333333333',
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

/**
 * PRODUCTION ROSTER TARGETS
 * EPL: 10 teams -> 90 Leg 1 + 90 Leg 2 = 180 total.
 * Championship: 13 teams -> 78 Leg 1 + 78 Leg 2 = 156 total.
 * Combined Production Target: 180 + 156 = 336 total fixtures.
 */
export const PRODUCTION_TARGETS = {
  PREMIER_LEAGUE: {
    teamsCount: 10,
    leg1Fixtures: 90,
    leg2Fixtures: 90,
    totalFixtures: 180,
  },
  CHAMPIONSHIP: {
    teamsCount: 13,
    leg1Fixtures: 78,
    leg2Fixtures: 78,
    totalFixtures: 156,
  },
  TOTAL_FIXTURES: 336,
} as const;

export const LOCAL_SEED_EPL_TEAMS: any[] = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Sharklets FC', short_name: 'SHK', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Faculty of Arts', short_name: 'FOA', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Faculty of Science', short_name: 'FOS', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Njoro FC', short_name: 'NJR', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000005', name: 'Egerton Strikers', short_name: 'EST', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000006', name: 'Buruburu FC', short_name: 'BRB', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000007', name: 'Tatton Warriors', short_name: 'TAT', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000008', name: 'Main Campus FC', short_name: 'MCF', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000009', name: 'Egerton Athletics', short_name: 'EAT', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
  { id: '10000000-0000-4000-8000-000000000010', name: 'Kilimo Stars', short_name: 'KLS', competition_id: COMPETITIONS.PREMIER_LEAGUE.id, status: 'approved', color_code: '#D4AF37' },
];

export const LOCAL_SEED_CHAMP_TEAMS: any[] = [
  { id: '20000000-0000-4000-a000-000000000001', name: 'Championship FC Alpha', short_name: 'CHP-A', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000002', name: 'Championship FC Beta', short_name: 'CHP-B', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000003', name: 'Championship FC Gamma', short_name: 'CHP-G', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000004', name: 'Championship FC Delta', short_name: 'CHP-D', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000005', name: 'Championship FC Epsilon', short_name: 'CHP-E', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000006', name: 'Championship FC Zeta', short_name: 'CHP-Z', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000007', name: 'Championship FC Eta', short_name: 'CHP-H', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000008', name: 'Championship FC Theta', short_name: 'CHP-T', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000009', name: 'Championship FC Iota', short_name: 'CHP-I', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000010', name: 'Championship FC Kappa', short_name: 'CHP-K', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000011', name: 'Championship FC Lambda', short_name: 'CHP-L', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000012', name: 'Championship FC Mu', short_name: 'CHP-M', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
  { id: '20000000-0000-4000-a000-000000000013', name: 'Championship FC Nu', short_name: 'CHP-N', competition_id: COMPETITIONS.CHAMPIONSHIP.id, status: 'approved', color_code: '#2563EB' },
];

export const LOCAL_SEED_REFEREES: any[] = [
  { id: '30000000-0000-4000-9000-000000000001', name: 'Ref Official Alpha', phone: '0711000001', status: 'Active', badge_level: 'FIFA Accredited', tier: 'EPL_Exclusive' },
  { id: '30000000-0000-4000-9000-000000000002', name: 'Ref Official Beta', phone: '0711000002', status: 'Active', badge_level: 'FKF National Level 2', tier: 'Mixed' },
  { id: '30000000-0000-4000-9000-000000000003', name: 'Ref Official Gamma', phone: '0711000003', status: 'Active', badge_level: 'FKF National Level 2', tier: 'Mixed' },
  { id: '30000000-0000-4000-9000-000000000004', name: 'Ref Official Delta', phone: '0711000004', status: 'Active', badge_level: 'FKF Regional Level 1', tier: 'Championship' },
  { id: '30000000-0000-4000-9000-000000000005', name: 'Ref Official Epsilon', phone: '0711000005', status: 'Active', badge_level: 'FKF Regional Level 1', tier: 'Mixed' },
  { id: '30000000-0000-4000-9000-000000000006', name: 'Ref Official Zeta', phone: '0711000006', status: 'Active', badge_level: 'FKF Campus Level 3', tier: 'Championship' },
  { id: '30000000-0000-4000-9000-000000000007', name: 'Ref Official Eta', phone: '0711000007', status: 'Active', badge_level: 'FIFA Accredited', tier: 'EPL_Exclusive' },
  { id: '30000000-0000-4000-9000-000000000008', name: 'Ref Official Theta', phone: '0711000008', status: 'Active', badge_level: 'FKF National Level 2', tier: 'Mixed' },
];

