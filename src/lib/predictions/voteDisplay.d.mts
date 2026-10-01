import type { ConsensusData } from '../../types/predictions';

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
export function deriveShowVotes(actual?: Partial<VoteCounts> | null, seedKey?: string): ShowVotes;
export function showVotesForConsensus(consensus?: ConsensusData | null, seedKey?: string): ShowVotes;
