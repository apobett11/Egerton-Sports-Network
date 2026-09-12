/**
 * Player of the Week (POTW) System Types
 * Egerton Sports Network (ESN)
 */

export interface MotmNomination {
  id: string;
  fixture_id: string;
  player_id: string;
  team_id: string;
  competition_id: string;
  referee_id?: string;
  created_at: string;
}

export interface PotwCandidate {
  player_id: string;
  player_name: string;
  jersey_number?: number;
  position?: string;
  team_id: string;
  team_name: string;
  team_logo?: string;
  competition_id: string;
  competition_name: string;
  fixture_id: string;
  match_details: string; // e.g. "Egerton FC 2 - 1 Njoro All-Stars"
  votes_count?: number;
  vote_share_percentage?: number;
  match_date?: string;
  referee_name?: string;
}

export interface PotwVote {
  id: string;
  device_id: string;
  player_id: string;
  competition_id: string;
  matchweek: number;
  created_at: string;
}

export interface PotwWinner {
  id: string;
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  team_logo?: string;
  competition_id: string;
  competition_name: string;
  matchweek: number;
  season_id?: string;
  vote_count: number;
  vote_share_percentage: number;
  awarded_at: string;
  stats_summary?: Record<string, any>;
  status?: string;
}

export interface PotwWeeklyCycleStatus {
  stage: 'VOTING_ACTIVE' | 'RESULTS_ANNOUNCED' | 'MAINTENANCE_RESET';
  matchweek: number;
  votingClosesAt: string; // e.g. "Tuesday 5:00 PM EAT"
  resetAt: string; // e.g. "Friday 11:00 AM EAT"
  isVotingOpen: boolean;
  timeRemainingSeconds: number;
}

export interface SubmitMotmParams {
  fixtureId: string;
  playerId: string;
  teamId: string;
  competitionId: string;
  refereeId?: string;
}

export interface CastVoteParams {
  deviceId: string;
  playerId: string;
  competitionId: string;
  matchweek: number;
}

export interface AdminAuditOptions {
  page: number;
  pageSize: number;
  sortBy?: 'votes' | 'name' | 'team';
  sortDir?: 'asc' | 'desc';
  searchQuery?: string;
}

export interface AdminAuditResult {
  candidates: PotwCandidate[];
  totalVotes: number;
  totalCandidates: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
