import type { Match, PredictionOption, UserPrediction } from '../../types/predictions';
import { slipTick } from './votingWindow';

export const SLIPS_PER_PAIR = 3;

export interface DeviceSlip {
  id: string;
  pairKey: string;
  slot: number;
  picks: UserPrediction[];
  sharedAt: string | null;
  createdAt: string;
}

export interface PickStats {
  selected: number;
  right: number;
  wrong: number;
  pending: number;
  total: number;
  accuracy: number | null;
  complete: boolean;
}

export function weekendPairKey(saturday: string, sunday: string): string {
  return `${saturday}|${sunday}`;
}

export function newSlipId(pairKey: string, slot: number): string {
  return `slip:${pairKey}:${slot}`;
}

export function slipsForPair(slips: DeviceSlip[], key: string): DeviceSlip[] {
  return slips.filter((slip) => slip.pairKey === key).sort((a, b) => a.slot - b.slot);
}

export function pickMap(picks: UserPrediction[]): Map<string, PredictionOption> {
  const map = new Map<string, PredictionOption>();
  picks.forEach((row) => map.set(row.matchId, row.prediction));
  return map;
}

export function pickStats(matches: Match[], pickFor: (matchId: string) => PredictionOption | undefined): PickStats {
  let selected = 0;
  let right = 0;
  let wrong = 0;
  let pending = 0;
  matches.forEach((match) => {
    const pick = pickFor(match.id);
    if (!pick) return;
    selected += 1;
    const tick = slipTick(match, pick);
    if (tick === 'won') right += 1;
    else if (tick === 'lost') wrong += 1;
    else pending += 1;
  });
  const settled = right + wrong;
  return {
    selected,
    right,
    wrong,
    pending,
    total: matches.length,
    accuracy: settled > 0 ? Math.round((right / settled) * 100) : null,
    complete: matches.length > 0 && selected >= matches.length,
  };
}

export function dayIsComplete(matches: Match[], picks: UserPrediction[]): boolean {
  if (matches.length === 0) return false;
  const ids = pickMap(picks);
  return matches.every((match) => ids.has(match.id));
}

export function remainingTries(slips: DeviceSlip[], key: string): number {
  return Math.max(0, SLIPS_PER_PAIR - slipsForPair(slips, key).length);
}

export function canOpenNewSlip(slips: DeviceSlip[], key: string): boolean {
  return remainingTries(slips, key) > 0;
}

export function pickingFrozen(slip: DeviceSlip | null, pairMatches: Match[], pairSlips: DeviceSlip[]): boolean {
  if (!slip) return pairSlips.length >= SLIPS_PER_PAIR;
  if (dayIsComplete(pairMatches, slip.picks) && pairSlips.length >= SLIPS_PER_PAIR) return true;
  return false;
}
