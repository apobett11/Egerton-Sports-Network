import React, { useMemo } from 'react';
import { X, Info } from 'lucide-react';
import type { Match as PredictionMatch, PredictionOption } from '../../../types/predictions';
import type { Match as LivescoreMatch } from '../../../types';
import { MatchDetailsContainer } from '../../MatchDetails/MatchDetailsContainer';
import { MonetagTopRightAd } from '../../ads/MonetagTopRightAd';

interface PredictionMatchDetailsModalProps {
  match: PredictionMatch;
  onClose: () => void;
  onQuickPredict?: (option: PredictionOption) => void;
}

export function convertPredictionMatchToLivescore(pMatch: PredictionMatch): LivescoreMatch {
  return {
    id: pMatch.id,
    status: (pMatch.status as any) || 'UPCOMING',
    time: pMatch.scheduledTime
      ? new Date(pMatch.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '15:00',
    minute: '-',
    league: pMatch.league || 'EPL',
    teamA: {
      id: pMatch.homeTeam.id,
      name: pMatch.homeTeam.name,
      shortName: pMatch.homeTeam.shortName,
      logo: pMatch.homeTeam.logoUrl || '',
      colorCode: pMatch.homeTeam.colorCode || '#00b04f',
    },
    teamB: {
      id: pMatch.awayTeam.id,
      name: pMatch.awayTeam.name,
      shortName: pMatch.awayTeam.shortName,
      logo: pMatch.awayTeam.logoUrl || '',
      colorCode: pMatch.awayTeam.colorCode || '#ff0046',
    },
    scoreA: pMatch.scoreHome ?? 0,
    scoreB: pMatch.scoreAway ?? 0,
    events: [],
    stats: [],
    lineups: {
      teamA: (pMatch.squads?.homeKeyPlayers || []).map((p, idx) => ({
        id: `p-a-${idx}`,
        name: p.name,
        number: p.number,
        position: (p.position as any) || 'MID',
        isCaptain: p.name.includes('(C)'),
        isSub: false,
      })),
      teamB: (pMatch.squads?.awayKeyPlayers || []).map((p, idx) => ({
        id: `p-b-${idx}`,
        name: p.name,
        number: p.number,
        position: (p.position as any) || 'MID',
        isCaptain: p.name.includes('(C)'),
        isSub: false,
      })),
      formationA: pMatch.squads?.homeFormation || '4-3-3',
      formationB: pMatch.squads?.awayFormation || '4-2-3-1',
    },
    venue: pMatch.venue || 'Pitch A — Main Stadium Pitch',
    referee: (pMatch as any).referee || 'Center Referee',
    centerReferee: (pMatch as any).centerReferee || (pMatch as any).referee || 'Center Referee',
  };
}

export const PredictionMatchDetailsModal: React.FC<PredictionMatchDetailsModalProps> = ({
  match,
  onClose,
}) => {
  const livescoreMatch = useMemo(() => convertPredictionMatchToLivescore(match), [match]);

  return (
    <div
      data-testid="prediction-match-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md animate-fadeIn"
    >
      {/* Top-Right Monetag Ad (~50% probability) with anti-ban tap spacing */}
      <MonetagTopRightAd />

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#1a2e45] bg-[#081018] text-white shadow-2xl overflow-hidden">
        {/* Sticky Header with Mandatory Notice & Close Button */}
        <div className="flex items-center justify-between border-b border-[#1a2e45] bg-[#0e1c2b] px-3.5 py-2.5 sm:px-5 sm:py-3 z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[#00b04f]/20 text-[#00b04f] shrink-0">
              <Info className="h-4 w-4" />
            </span>
            <p className="text-[11px] sm:text-xs text-slate-200 font-bold leading-tight">
              You can view all about the matches, from the pitch, referee, squads, position and the team squads and subs.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-match-details-modal"
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-[#14263b] transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Container hosting MatchDetailsContainer defaulting to squad tab */}
        <div className="flex-1 overflow-y-auto">
          <MatchDetailsContainer
            match={livescoreMatch}
            onBack={onClose}
            favorites={[]}
            toggleFavorite={() => {}}
            initialTab="squad"
          />
        </div>
      </div>
    </div>
  );
};
