import React, { useState } from 'react';
import { Shield, CheckCircle2, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import type { Match, PredictionOption, ConsensusData } from '../../../types/predictions';

interface ProgressivePredictionDeckProps {
  regularMatches: Match[];
  userPredictions: Map<string, PredictionOption>;
  consensusMap: Map<string, ConsensusData>;
  onMakePrediction: (match: Match, option: PredictionOption) => void;
  onFinishDeck: () => void;
}

export const ProgressivePredictionDeck: React.FC<ProgressivePredictionDeckProps> = ({
  regularMatches,
  userPredictions,
  consensusMap,
  onMakePrediction,
  onFinishDeck,
}) => {
  // Find first unpredicted match or current index
  const firstUnpredictedIndex = regularMatches.findIndex(m => !userPredictions.has(m.id));
  const [currentIndex, setCurrentIndex] = useState(() =>
    firstUnpredictedIndex !== -1 ? firstUnpredictedIndex : 0
  );

  const currentMatch = regularMatches[currentIndex] || regularMatches[0];
  if (!currentMatch) return null;

  const currentSelection = userPredictions.get(currentMatch.id) || null;
  const currentConsensus = consensusMap.get(currentMatch.id);
  const isLast = currentIndex === regularMatches.length - 1;

  const handleSelect = (option: PredictionOption) => {
    onMakePrediction(currentMatch, option);
  };

  const handleNext = () => {
    if (isLast) {
      onFinishDeck();
    } else {
      setCurrentIndex(prev => Math.min(regularMatches.length - 1, prev + 1));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#ff0046]/40 bg-gradient-to-b from-[#140810] via-[#0e1c2b] to-[#0e1c2b] p-5 tactical-card-shadow">
      {/* Header step pill */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff0046] animate-pulse" />
          <span className="text-xs font-black tracking-widest text-[#ff0046] uppercase">
            WHO WINS? • PICK {currentIndex + 1} OF {regularMatches.length}
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          Progressive Onboarding
        </span>
      </div>

      {/* Teams Faceoff */}
      <div className="my-6 grid grid-cols-7 items-center">
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-700 bg-[#081018] p-1 shadow-md mb-2">
            {currentMatch.homeTeam.logoUrl ? (
              <img src={currentMatch.homeTeam.logoUrl} alt={currentMatch.homeTeam.name} className="h-full w-full object-cover rounded-full" />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-sm font-black text-white leading-tight">{currentMatch.homeTeam.name}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Home</span>
        </div>

        <div className="col-span-1 flex flex-col items-center justify-center">
          <span className="text-xs font-black text-slate-500">VS</span>
        </div>

        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-700 bg-[#081018] p-1 shadow-md mb-2">
            {currentMatch.awayTeam.logoUrl ? (
              <img src={currentMatch.awayTeam.logoUrl} alt={currentMatch.awayTeam.name} className="h-full w-full object-cover rounded-full" />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-sm font-black text-white leading-tight">{currentMatch.awayTeam.name}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Away</span>
        </div>
      </div>

      {/* 1 / X / 2 Large Options */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleSelect('1')}
          className={`py-3 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            currentSelection === '1'
              ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-lg ring-2 ring-[#ff0046]/50'
              : 'bg-[#14263b] border-slate-700/60 text-slate-200 hover:bg-[#1a334f]'
          }`}
        >
          {currentMatch.homeTeam.name} Win
        </button>

        <button
          type="button"
          onClick={() => handleSelect('X')}
          className={`py-3 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            currentSelection === 'X'
              ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-lg ring-2 ring-[#ff0046]/50'
              : 'bg-[#14263b] border-slate-700/60 text-slate-200 hover:bg-[#1a334f]'
          }`}
        >
          Draw (X)
        </button>

        <button
          type="button"
          onClick={() => handleSelect('2')}
          className={`py-3 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            currentSelection === '2'
              ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-lg ring-2 ring-[#ff0046]/50'
              : 'bg-[#14263b] border-slate-700/60 text-slate-200 hover:bg-[#1a334f]'
          }`}
        >
          {currentMatch.awayTeam.name} Win
        </button>
      </div>

      {/* Instant Crowd Consensus Reveal */}
      {currentSelection && currentConsensus && (
        <div className="mt-4 rounded-xl bg-[#081018] p-3 border border-[#1a2e45] animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span className="text-white flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#ff0046]" />
              Fan Consensus Revealed:
            </span>
            <span>{currentConsensus.pulseLabel}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="p-1 rounded bg-[#0e1c2b]">
              <span className={currentSelection === '1' ? 'text-[#00b04f]' : 'text-slate-300'}>
                {currentConsensus.homePct}% Home
              </span>
            </div>
            <div className="p-1 rounded bg-[#0e1c2b]">
              <span className={currentSelection === 'X' ? 'text-[#ff9800]' : 'text-slate-300'}>
                {currentConsensus.drawPct}% Draw
              </span>
            </div>
            <div className="p-1 rounded bg-[#0e1c2b]">
              <span className={currentSelection === '2' ? 'text-[#ff0046]' : 'text-slate-300'}>
                {currentConsensus.awayPct}% Away
              </span>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-[#00b04f] text-white text-xs font-black uppercase tracking-wider hover:bg-[#009b45] transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <span>{isLast ? 'View Full Matchday & Climax' : 'Next Fixture'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
