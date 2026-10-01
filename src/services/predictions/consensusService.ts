import { supabase } from '../../lib/supabase';
import { IQ_STATUS_BANDS } from '../../lib/predictions/constants';
import type { ConsensusData, ConsensusIQResult, UserPrediction, ConsensusIQBand } from '../../types/predictions';

export class ConsensusService {
  /**
   * Deterministic Consensus IQ Calculation Algorithm (0-100)
   * Formula factors in:
   * 1. Agreement with high consensus (rewards football wisdom)
   * 2. Brave contrarian picks (tactical audacity without random jumps)
   * 3. Coverage ratio of completed predictions
   */
  public calculateConsensusIQ(
    predictions: UserPrediction[],
    consensusMap: Map<string, ConsensusData>,
    totalRequired = 4
  ): ConsensusIQResult {
    const validPredictions = predictions.filter(p => consensusMap.has(p.matchId));
    const picksCount = validPredictions.length;

    // Minimum 2 completed predictions required to display meaningful Consensus IQ
    if (picksCount < 2) {
      return {
        score: 0,
        band: IQ_STATUS_BANDS.BUILDING.label,
        statusLabel: 'Building Profile',
        analysisText: `Complete ${Math.max(1, 2 - picksCount)} more pick(s) to unlock your Matchday IQ`,
        picksCompleted: picksCount,
        totalRequired,
        isEligible: false
      };
    }

    let aggregateWeight = 0;
    let totalPoints = 0;

    validPredictions.forEach(pred => {
      const data = consensusMap.get(pred.matchId)!;
      let chosenPct = 0;
      const majorityPct = Math.max(data.homePct, data.drawPct, data.awayPct);

      if (pred.prediction === '1') chosenPct = data.homePct;
      else if (pred.prediction === 'X') chosenPct = data.drawPct;
      else if (pred.prediction === '2') chosenPct = data.awayPct;

      let matchPoints = 0;
      if (chosenPct === majorityPct) {
        // High consensus pick: scales from 85 to 96 based on crowd confidence
        matchPoints = 75 + Math.round((chosenPct / 100) * 20);
      } else if (chosenPct < 25) {
        // Contrarian rebel pick: scales 45 to 62
        matchPoints = 40 + Math.round((chosenPct / 25) * 22);
      } else {
        // Balanced tactical read: scales 65 to 82
        matchPoints = 65 + Math.round(((chosenPct - 25) / 50) * 17);
      }

      totalPoints += matchPoints;
      aggregateWeight += 1;
    });

    const averageRaw = totalPoints / aggregateWeight;
    const clampedScore = Math.min(98, Math.max(40, Math.round(averageRaw)));

    let band: ConsensusIQBand = IQ_STATUS_BANDS.SHARP.label;
    let statusLabel: string = IQ_STATUS_BANDS.SHARP.label;
    let analysisText: string = IQ_STATUS_BANDS.SHARP.description;

    if (clampedScore >= 85) {
      band = IQ_STATUS_BANDS.ELITE.label;
      statusLabel = IQ_STATUS_BANDS.ELITE.label;
      analysisText = IQ_STATUS_BANDS.ELITE.description;
    } else if (clampedScore < 65) {
      band = IQ_STATUS_BANDS.REBEL.label;
      statusLabel = IQ_STATUS_BANDS.REBEL.label;
      analysisText = IQ_STATUS_BANDS.REBEL.description;
    }

    return {
      score: clampedScore,
      band,
      statusLabel,
      analysisText,
      picksCompleted: picksCount,
      totalRequired,
      isEligible: true
    };
  }

  /**
   * Fetches precomputed consensus data using the low-CPU cache table.
   * Never executes expensive COUNT(*) GROUP BY on the client hot path.
   */
  public async getConsensusForMatches(matchIds: string[]): Promise<Map<string, ConsensusData>> {
    const map = new Map<string, ConsensusData>();
    if (matchIds.length === 0) return map;

    try {
      const { data, error } = await supabase
        .from('match_consensus_cache')
        .select('match_id, home_pct, draw_pct, away_pct, total_votes')
        .in('match_id', matchIds);

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          map.set(row.match_id, {
            matchId: row.match_id,
            homePct: row.home_pct || 0,
            drawPct: row.draw_pct || 0,
            awayPct: row.away_pct || 0,
            totalVotes: row.total_votes || 0,
            pulseLabel: `${row.total_votes || 0} fan predictions`
          });
        });
      }
    } catch {
      // offline fallback
    }

    return map;
  }

  public getInitialConsensusSync(): Map<string, ConsensusData> {
    return new Map();
  }
}

export const consensusService = new ConsensusService();
