import { readLivescoreDeviceId } from './livescoreDevice';
import type { DeviceSlip } from './slipBook';
import type { PredictionOption, UserPrediction } from '../../types/predictions';
import { slipsForPair } from './slipBook';

export type PredictionStep = 'club' | 'derby' | 'picks' | 'dashboard';

export interface PredictionDashboardCache {
  deviceId: string | null;
  favouriteTeam: string | null;
  favouriteTeamId: string | null;
  fanaticAnswered: boolean;
  footballFanatic: 'yes' | 'no' | null;
  predictions: UserPrediction[];
  step: PredictionStep;
  slipListOpen: boolean;
  activeDayKey: string | null;
  lockedSaturday: string | null;
  lockedSunday: string | null;
  slips: DeviceSlip[];
  activeSlipId: string | null;
  lastSlipCompletedAt: string | null;
  updatedAt: string;
}

const STORAGE_KEY = 'esn_prediction_dash_v1';
const MEMORY_MAX_PICKS = 80;

const EMPTY: PredictionDashboardCache = {
  deviceId: null,
  favouriteTeam: null,
  favouriteTeamId: null,
  fanaticAnswered: true,
  footballFanatic: null,
  predictions: [],
  step: 'picks',
  slipListOpen: false,
  activeDayKey: null,
  lockedSaturday: null,
  lockedSunday: null,
  slips: [],
  activeSlipId: null,
  lastSlipCompletedAt: null,
  updatedAt: '',
};

let memory: PredictionDashboardCache | null = null;

function asOption(value: unknown): PredictionOption | null {
  return value === '1' || value === 'X' || value === '2' ? value : null;
}

function normalizePredictions(list: unknown): UserPrediction[] {
  if (!Array.isArray(list)) return [];
  const byMatch = new Map<string, UserPrediction>();
  list.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    const matchId = typeof (row as UserPrediction).matchId === 'string' ? (row as UserPrediction).matchId : '';
    const prediction = asOption((row as UserPrediction).prediction);
    if (!matchId || !prediction) return;
    byMatch.set(matchId, {
      matchId,
      prediction,
      matchday: Number((row as UserPrediction).matchday) || 1,
      updatedAt: typeof (row as UserPrediction).updatedAt === 'string'
        ? (row as UserPrediction).updatedAt
        : new Date().toISOString(),
    });
  });
  return Array.from(byMatch.values()).slice(-MEMORY_MAX_PICKS);
}

function parseCache(raw: string | null, deviceId: string | null): PredictionDashboardCache | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PredictionDashboardCache>;
    if (parsed.deviceId && deviceId && parsed.deviceId !== deviceId) return null;
    const favouriteTeam = typeof parsed.favouriteTeam === 'string' && parsed.favouriteTeam.trim()
      ? parsed.favouriteTeam.trim()
      : null;
    return {
      deviceId: deviceId || (typeof parsed.deviceId === 'string' ? parsed.deviceId : null),
      favouriteTeam,
      favouriteTeamId: typeof parsed.favouriteTeamId === 'string' ? parsed.favouriteTeamId : null,
      fanaticAnswered: true,
      footballFanatic: parsed.footballFanatic === 'yes' || parsed.footballFanatic === 'no' ? parsed.footballFanatic : null,
      predictions: normalizePredictions(parsed.predictions),
      step: parsed.step === 'club' || parsed.step === 'derby' || parsed.step === 'picks' || parsed.step === 'dashboard'
        ? parsed.step
        : favouriteTeam ? 'picks' : 'club',
      slipListOpen: Boolean(parsed.slipListOpen),
      activeDayKey: typeof parsed.activeDayKey === 'string' ? parsed.activeDayKey : null,
      lockedSaturday: typeof parsed.lockedSaturday === 'string' ? parsed.lockedSaturday : null,
      lockedSunday: typeof parsed.lockedSunday === 'string' ? parsed.lockedSunday : null,
      slips: normalizeSlips(parsed.slips),
      activeSlipId: typeof parsed.activeSlipId === 'string' ? parsed.activeSlipId : null,
      lastSlipCompletedAt: typeof parsed.lastSlipCompletedAt === 'string' ? parsed.lastSlipCompletedAt : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

function normalizeSlips(list: unknown): DeviceSlip[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const slip = row as DeviceSlip;
    if (typeof slip.id !== 'string' || typeof slip.pairKey !== 'string') return [];
    const slot = Number(slip.slot);
    if (!Number.isFinite(slot) || slot < 1) return [];
    return [{
      id: slip.id,
      pairKey: slip.pairKey,
      slot,
      picks: normalizePredictions(slip.picks),
      sharedAt: typeof slip.sharedAt === 'string' ? slip.sharedAt : null,
      createdAt: typeof slip.createdAt === 'string' ? slip.createdAt : new Date().toISOString(),
      completedAt: typeof slip.completedAt === 'string' ? slip.completedAt : null,
    }];
  });
}

function persist(next: PredictionDashboardCache): void {
  memory = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (next.favouriteTeam) {
      localStorage.setItem('esn_favorite_team_label', next.favouriteTeam);
      localStorage.setItem('esn_onboarding_completed', 'true');
    }
    if (next.fanaticAnswered) {
      localStorage.setItem('esn_fanatic_prompt_seen', 'true');
      if (next.footballFanatic) localStorage.setItem('esn_football_fanatic', next.footballFanatic);
    }
  } catch {
    // private mode: the in-memory copy is enough for this visit
  }
}

export function readDashboardCache(): PredictionDashboardCache {
  if (memory) return memory;
  const deviceId = readLivescoreDeviceId();
  try {
    const parsed = parseCache(localStorage.getItem(STORAGE_KEY), deviceId);
    if (parsed) {
      memory = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  memory = { ...EMPTY, deviceId };
  return memory;
}

export function patchDashboardCache(patch: Partial<PredictionDashboardCache>): PredictionDashboardCache {
  const current = readDashboardCache();
  const deviceId = readLivescoreDeviceId() || current.deviceId;
  const next: PredictionDashboardCache = {
    ...current,
    ...patch,
    deviceId,
    predictions: patch.predictions ? normalizePredictions(patch.predictions) : current.predictions,
    slips: patch.slips ? normalizeSlips(patch.slips) : current.slips,
    favouriteTeam: patch.favouriteTeam !== undefined
      ? (patch.favouriteTeam && patch.favouriteTeam.trim() ? patch.favouriteTeam.trim() : current.favouriteTeam)
      : current.favouriteTeam,
    updatedAt: new Date().toISOString(),
  };
  if (next.favouriteTeam && next.step === 'club') {
    next.step = next.slipListOpen ? 'dashboard' : 'picks';
    next.fanaticAnswered = true;
  }
  persist(next);
  return next;
}

export function rememberPick(matchId: string, prediction: PredictionOption, matchday: number): PredictionDashboardCache {
  const current = readDashboardCache();
  const already = current.predictions.find((row) => row.matchId === matchId);
  if (already) return current;
  const nextPick = { matchId, prediction, matchday, updatedAt: new Date().toISOString() };
  const nextPredictions = [...current.predictions, nextPick];
  const slips = current.slips.map((slip) => (
    slip.id === current.activeSlipId
      ? { ...slip, picks: slip.picks.some((row) => row.matchId === matchId) ? slip.picks : [...slip.picks, nextPick] }
      : slip
  ));
  return patchDashboardCache({
    predictions: nextPredictions,
    slips,
  });
}

export function slipsForWeekend(saturday: string, sunday: string): DeviceSlip[] {
  return slipsForPair(readDashboardCache().slips, `${saturday}|${sunday}`);
}

export function cacheStepFromState(input: {
  favouriteTeam: string | null;
  remainingPicks: number;
  slipListOpen: boolean;
}): PredictionStep {
  if (!input.favouriteTeam) {
    return 'club';
  }
  if (input.slipListOpen || input.remainingPicks <= 0) return 'dashboard';
  return 'picks';
}

export function cachedWeekendLock(): { saturday: string; sunday: string } | null {
  const cached = readDashboardCache();
  if (cached.lockedSaturday && cached.lockedSunday) {
    return { saturday: cached.lockedSaturday, sunday: cached.lockedSunday };
  }
  return null;
}
