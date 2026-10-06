import type { ConsensusData, PredictionOption } from '../../types/predictions';

export interface VoteCounts {
  total: number;
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
}

export interface ShowVotes extends VoteCounts {
  homePct: number;
  drawPct: number;
  awayPct: number;
}

export function actualVoteSplit(consensus?: ConsensusData | null): VoteCounts;
export function deriveShowVotes(actual?: Partial<VoteCounts> | null, seedKey?: string, preferredOption?: PredictionOption | null, isDerby?: boolean): ShowVotes;
export function showVotesForConsensus(consensus?: ConsensusData | null, seedKey?: string, preferredOption?: PredictionOption | null, isDerby?: boolean): ShowVotes;
