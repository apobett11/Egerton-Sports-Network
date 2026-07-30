import type { Journalist, SupabaseSlowQuery, DauDataPoint, PsychSystemDataPoint } from './types';

export const INITIAL_JOURNALISTS: Journalist[] = [
  {
    id: 'j1',
    name: 'Maina K.',
    role: 'Lead Sports Reporter',
    faculty: 'Faculty of Science',
    articlesCount: 14,
    totalEngagement: 34200,
    anonymousTipsVolume: 18,
    isDisputed: false,
    lastArticleTitle: 'Science FC Squad Tactics Revealed Ahead of Saturday Derby',
  },
  {
    id: 'j2',
    name: 'Wanjiku N.',
    role: 'Chief Campus Insider',
    faculty: 'Engineering & Tech',
    articlesCount: 22,
    totalEngagement: 58900,
    anonymousTipsVolume: 42,
    isDisputed: false,
    lastArticleTitle: 'Secret Transfer Rumors: 5,000 KES Bounty on Engineering Captain',
  },
  {
    id: 'j3',
    name: 'Omondi P.',
    role: 'Tactical Analyst',
    faculty: 'Medical School',
    articlesCount: 9,
    totalEngagement: 19400,
    anonymousTipsVolume: 7,
    isDisputed: false,
    lastArticleTitle: '3-4-3 Formation Breakdown: How Med School Neutralized Arts Utd',
  },
  {
    id: 'j4',
    name: 'Kiprop E.',
    role: 'Faculty Correspondent',
    faculty: 'Agriculture',
    articlesCount: 11,
    totalEngagement: 24100,
    anonymousTipsVolume: 12,
    isDisputed: false,
    lastArticleTitle: 'Kilimo Pitch Conditions Ahead of Rainy Season Fixtures',
  },
  {
    id: 'j5',
    name: 'Chebet R.',
    role: 'Gossip & Transfer Scout',
    faculty: 'Business & Econ',
    articlesCount: 29,
    totalEngagement: 81600,
    anonymousTipsVolume: 64,
    isDisputed: true,
    disputedReason: 'Unverified rumor regarding coach disciplinary suspension',
    lastArticleTitle: '🔥 EXCLUSIVE: Bcom Striker Benched After Late Night Study Dispute',
  },
];

export const INITIAL_QUERIES: SupabaseSlowQuery[] = [
  {
    id: 'q1',
    query: 'SELECT * FROM match_events WHERE match_id = $1 ORDER BY minute DESC',
    durationMs: 64.2,
    tableName: 'match_events',
    recommendedIndex: 'CREATE INDEX idx_match_events_match_id ON match_events(match_id, minute);',
    isOptimized: false,
  },
  {
    id: 'q2',
    query: 'SELECT team_id, SUM(dwell_seconds) FROM dwell_analytics GROUP BY team_id',
    durationMs: 78.5,
    tableName: 'dwell_analytics',
    recommendedIndex: 'CREATE INDEX idx_dwell_analytics_team_id ON dwell_analytics(team_id, dwell_seconds);',
    isOptimized: false,
  },
  {
    id: 'q3',
    query: 'SELECT * FROM predictions WHERE kickoff_time > NOW() AND status = $1',
    durationMs: 52.1,
    tableName: 'predictions',
    recommendedIndex: 'CREATE INDEX idx_predictions_kickoff_status ON predictions(kickoff_time, status);',
    isOptimized: false,
  },
  {
    id: 'q4',
    query: 'SELECT * FROM news_feed WHERE category = $1 ORDER BY published_at DESC LIMIT 10',
    durationMs: 24.8,
    tableName: 'news_feed',
    recommendedIndex: 'CREATE INDEX idx_news_category_published ON news_feed(category, published_at);',
    isOptimized: true,
  },
  {
    id: 'q5',
    query: 'SELECT user_id, vote_count FROM player_of_week_votes WHERE player_id = $1',
    durationMs: 18.3,
    tableName: 'player_of_week_votes',
    recommendedIndex: 'CREATE INDEX idx_votes_player_id ON player_of_week_votes(player_id);',
    isOptimized: true,
  },
];

export const DAU_WEEKLY_DATA: DauDataPoint[] = [
  { day: 'Mon', dau: 1420, sessionMins: 11.2, predictions: 320, dopamineHits: 580 },
  { day: 'Tue', dau: 1680, sessionMins: 12.8, predictions: 450, dopamineHits: 720 },
  { day: 'Wed', dau: 2450, sessionMins: 15.4, predictions: 890, dopamineHits: 1340 },
  { day: 'Thu', dau: 2100, sessionMins: 13.9, predictions: 760, dopamineHits: 980 },
  { day: 'Fri', dau: 2980, sessionMins: 16.5, predictions: 1240, dopamineHits: 1650 },
  { day: 'Sat', dau: 4820, sessionMins: 22.4, predictions: 2410, dopamineHits: 3100 },
  { day: 'Sun', dau: 3950, sessionMins: 18.7, predictions: 1850, dopamineHits: 2400 },
];

export const PSYCH_SYSTEM_DATA: PsychSystemDataPoint[] = [
  { name: 'System 1 (Waterfall Flow)', value: 84, color: '#10b981' },
  { name: 'System 2 (Analytical Decision)', value: 16, color: '#3b82f6' },
];
