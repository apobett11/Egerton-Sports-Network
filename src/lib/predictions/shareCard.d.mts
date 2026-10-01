export interface DerbyCard {
  k: 'derby';
  home: string;
  away: string;
  pick: string;
  call: string;
  stake: string;
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
  others: string[];
}

export interface SlipCard {
  k: 'slip';
  rows: { match: string; pick: string; votes: number }[];
  hidden: number;
  hasDerby: boolean;
}

export interface TalkCard {
  k: 'talk';
  handle: string;
  text: string;
  postId: string;
}

export type ShareCard = DerbyCard | SlipCard | TalkCard;

export function encodeShareCard(card: ShareCard): string;
export function decodeShareCard(token: string): ShareCard | null;
export function derbyCard(args: {
  home: string;
  away: string;
  pick: string;
  call: string;
  stake: string;
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
  others?: string[];
}): DerbyCard;
export function slipCard(args: {
  rows: { match: string; pick: string; votes: number }[];
  hidden: number;
  hasDerby: boolean;
}): SlipCard;
export function talkCard(args: { handle: string; text: string; postId?: string }): TalkCard;
export function cardTitle(card: ShareCard | null): string;
export function cardDescription(card: ShareCard | null): string;
export function cardDestination(card: ShareCard | null): string;
