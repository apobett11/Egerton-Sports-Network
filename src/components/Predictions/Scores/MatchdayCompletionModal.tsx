import React, { useMemo } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { formatTeamName } from '../../../lib/predictions/utils';
import { shareService } from '../../../services/predictions/shareService';
import { CompactDirectBanner } from '../../ads/CompactDirectBanner';
import type { ConsensusIQResult, Match, UserPrediction, ConsensusData, PredictionOption } from '../../../types/predictions';

interface MatchdayCompletionModalProps {
  iq?: ConsensusIQResult;
  predictions: UserPrediction[];
  matches: Match[];
  consensusMap?: Map<string, ConsensusData>;
  onClose: () => void;
  onEnterBanter?: () => void;
  onSeeTrending?: () => void;
  onSeeMatchday?: () => void;
  nextMatchday?: number | null;
  onSharePicks: () => void;
}

export const MatchdayCompletionModal: React.FC<MatchdayCompletionModalProps> = ({
  predictions,
  matches,
  consensusMap,
  onClose,
  onEnterBanter,
  onSeeTrending,
  onSeeMatchday,
  nextMatchday,
}) => {
  const handleTrendingClick = onSeeTrending || onEnterBanter || onClose;

  const predictionMap = useMemo(() => {
    const map = new Map<string, PredictionOption>();
    predictions.forEach((p) => map.set(p.matchId, p.prediction));
    return map;
  }, [predictions]);

  const handleShare = () => {
    shareService.shareSlip({
      matches,
      userPredictions: predictionMap,
      consensusMap,
    });
  };

  const analyzedSelections = useMemo(() => {
    return matches
      .map((match) => {
        const pred = predictions.find((p) => p.matchId === match.id);
        if (!pred) return null;
        let choiceText = '';
        if (pred.prediction === '1') choiceText = `${formatTeamName(match.homeTeam.name)} Win`;
        else if (pred.prediction === 'X') choiceText = 'Draw';
        else if (pred.prediction === '2') choiceText = `${formatTeamName(match.awayTeam.name)} Win`;

        return {
          match,
          selectedOption: pred.prediction,
          choiceText,
        };
      })
      .filter((item): item is { match: Match; selectedOption: PredictionOption; choiceText: string } => Boolean(item));
  }, [predictions, matches]);

  const activeMatchday = matches[0]?.matchday || 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-gradient-to-b from-[#0e1d2e] via-[#091420] to-[#07101a] p-4 sm:p-5 text-white tactical-modal-shadow max-h-[90vh] flex flex-col overflow-hidden">
        {/* Ambient Lights */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#00b04f]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#ff0046]/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
              Matchday {activeMatchday} is locked
            </span>
            <h1 className="text-base sm:text-lg font-black text-white">
              Invite other fans
            </h1>
            <p className="text-[11px] text-slate-400">The other fans need to cast their prediction.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Matches & Selected Ones */}
        <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1">
          {analyzedSelections.map((item, idx) => {
            const homeDisplay = formatTeamName(item.match.homeTeam.name);
            const awayDisplay = formatTeamName(item.match.awayTeam.name);

            return (
              <div
                key={item.match.id || idx}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs border transition-colors ${
                  item.match.isDerby
                    ? 'border-amber-500/40 bg-gradient-to-r from-[#210915] via-[#101c2b] to-[#0c1622]'
                    : 'border-slate-800 bg-[#08121d]'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white truncate text-xs">
                      {homeDisplay} vs {awayDisplay}
                    </span>
                    {item.match.isDerby && (
                      <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-500/40">
                        Derby
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="font-black text-xs text-[#ff0046] bg-[#ff0046]/10 border border-[#ff0046]/30 px-2.5 py-1 rounded-lg">
                    {item.choiceText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <CompactDirectBanner
          label="Consensus Multiplier"
          tagline="Back Campus Consensus with Real Odds"
          variant="amber"
          className="my-1.5"
        />

        <div className="pt-3 border-t border-slate-800 flex flex-col items-start gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="h-9 px-3.5 rounded-lg bg-[#00b04f] hover:bg-[#009b45] text-white font-black text-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-white shrink-0" />
            <span>Invite others</span>
          </button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {nextMatchday != null && onSeeMatchday && (
              <button
                type="button"
                onClick={onSeeMatchday}
                className="text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                See matchday {nextMatchday}
              </button>
            )}
            <button
              type="button"
              onClick={handleTrendingClick}
              className="text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              See the talk. The banter.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
