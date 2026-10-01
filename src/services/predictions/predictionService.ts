import { supabase } from '../../lib/supabase';
import { anonymousIdentityService } from './anonymousIdentityService';
import { closeAtForKickoff } from '../../lib/predictions/votingWindow';
import type { PredictionOption, UserPrediction, Match } from '../../types/predictions';

class PredictionService {
  private inMemoryPredictions: UserPrediction[] | null = null;

  public getPredictions(): UserPrediction[] {
    if (this.inMemoryPredictions) return this.inMemoryPredictions;
    this.inMemoryPredictions = [];
    return this.inMemoryPredictions;
  }

  public hydrate(list: UserPrediction[]): void {
    const byMatch = new Map<string, UserPrediction>();
    list.forEach((row) => byMatch.set(row.matchId, row));
    this.inMemoryPredictions = Array.from(byMatch.values());
  }

  public getPredictionForMatch(matchId: string): PredictionOption | null {
    const list = this.getPredictions();
    const found = list.find(p => p.matchId === matchId);
    return found ? found.prediction : null;
  }

  public clearPredictions(): void {
    this.inMemoryPredictions = [];
  }

  private activeLocks = new Set<string>();

  public async savePrediction(
    match: Match,
    option: PredictionOption
  ): Promise<UserPrediction[]> {
    const now = Date.now();
    const closeAt = closeAtForKickoff(match.scheduledTime).getTime();
    if (now >= closeAt) {
      throw new Error('Voting is closed for this matchday.');
    }
    const scheduled = new Date(match.scheduledTime).getTime();
    if (now >= scheduled) {
      throw new Error('Prediction window is locked for this fixture.');
    }

    // Double-click lock guard
    if (this.activeLocks.has(match.id)) {
      return this.getPredictions();
    }
    this.activeLocks.add(match.id);

    // 2. Check if vote already exists (no change of vote once casted)
    const existing = this.getPredictions();
    const alreadyVoted = existing.find(p => p.matchId === match.id);
    if (alreadyVoted) {
      this.activeLocks.delete(match.id);
      return existing;
    }

    // Update local state immediately (instant optimistic responsiveness)
    const updatedRecord: UserPrediction = {
      matchId: match.id,
      prediction: option,
      matchday: match.matchday,
      updatedAt: new Date().toISOString()
    };

    const nextList = [...existing, updatedRecord];
    this.inMemoryPredictions = nextList;

    // 3. Persist to backend asynchronously
    this.persistToBackend(match, option)
      .catch(err => {
        console.warn('Backend prediction persist deferred:', err);
      })
      .finally(() => {
        this.activeLocks.delete(match.id);
      });

    return nextList;
  }

  private async persistToBackend(
    match: Match,
    option: PredictionOption
  ): Promise<void> {
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      if (!devRowId) return;
      const creds = await import('../../lib/deviceCopies').then((mod) => mod.getDeviceCredentials());
      if (!creds.secret) return;

      const { error } = await supabase.rpc('cast_match_prediction', {
        p_device_id: devRowId,
        p_secret: creds.secret,
        p_match_id: match.id,
        p_prediction: option,
        p_matchday: match.matchday,
      });

      if (error && error.code !== '23505' && !/already locked|duplicate/i.test(error.message || '')) {
        console.warn('Prediction lock deferred:', error.message);
      }
    } catch {
      // Offline fallback
    }
  }

  public isMatchdayComplete(matches: Match[]): boolean {
    const regularMatches = matches.filter(m => !m.isDerby);
    if (regularMatches.length === 0) return false;
    const predictions = this.getPredictions();
    const predSet = new Set(predictions.map(p => p.matchId));
    return regularMatches.every(m => predSet.has(m.id));
  }

  public getCompletedPicksCount(matches: Match[]): number {
    const predictions = this.getPredictions();
    const predSet = new Set(predictions.map(p => p.matchId));
    return matches.filter(m => predSet.has(m.id)).length;
  }
}

export const predictionService = new PredictionService();
