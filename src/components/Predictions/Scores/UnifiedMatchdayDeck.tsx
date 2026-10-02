import React, { useEffect, useRef, useState } from 'react';
import { Shield, Crown, Sparkles, List } from 'lucide-react';
import { GameSquadsModal } from './GameSquadsModal';
import { DerbyUltimatePopup } from './DerbyUltimatePopup';
import { MyVotesModal } from './MyVotesModal';
import { VoteRangeBar } from './VoteRangeBar';
import { formatKickoffTime, formatTeamName } from '../../../lib/predictions/utils';
import { describeVotingWindow, slipTick } from '../../../lib/predictions/votingWindow';
import { showVotesForConsensus } from '../../../lib/predictions/voteDisplay.mjs';
import type { Match, PredictionOption, ConsensusData, UserPrediction } from '../../../types/predictions';
import type { SlipTick } from '../../../lib/predictions/votingWindow';

function SlipTickLabel({ tick }: { tick: SlipTick }) {
  const label = tick === 'won' ? 'Won' : tick === 'lost' ? 'Lost' : tick === 'live' ? 'Live' : 'Waiting';
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider ${tick === 'won' ? 'text-[#00b04f]' : 'text-white'}`}>
      {label}
    </span>
  );
}

interface UnifiedMatchdayDeckProps {
  matches: Match[];
  userPredictions: Map<string, PredictionOption>;
  consensusMap: Map<string, ConsensusData>;
  allPredictions: UserPrediction[];
  isDerbyUnlocked: boolean;
  favouriteTeam?: string | null;
  onMakePrediction: (match: Match, option: PredictionOption) => void;
  onDerbyUnlocked: () => void;
  onOpenDerbyPopup?: (match: Match, option: PredictionOption) => void;
  onOpenCompletionModal?: () => void;
  onOpenMatchBanter?: (match: Match) => void;
  onOpenFavouriteTeamModal?: () => void;
  onSeeTrending?: () => void;
  onSharePicks?: () => void;
  onOpenMySlips?: () => void;
}

export const UnifiedMatchdayDeck: React.FC<UnifiedMatchdayDeckProps> = ({
  matches,
  userPredictions,
  consensusMap,
  favouriteTeam,
  onMakePrediction,
  onOpenDerbyPopup,
  onOpenFavouriteTeamModal,
  onSeeTrending,
  onSharePicks,
  onOpenMySlips,
}) => {
  const [inspectSquadMatch, setInspectSquadMatch] = useState<Match | null>(null);
  const [derbyPopupData, setDerbyPopupData] = useState<{ match: Match; option: PredictionOption } | null>(null);
  const [showMyVotesModal, setShowMyVotesModal] = useState(false);
  const [votingClosed, setVotingClosed] = useState(() => describeVotingWindow(matches).closed);
  const matchListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tick = () => setVotingClosed(describeVotingWindow(matches).closed);
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [matches]);

  const totalMatchesCount = matches.length;
  const allGamesSelected = totalMatchesCount > 0 && matches.every(m => userPredictions.has(m.id));

  const handlePredict = (match: Match, option: PredictionOption) => {
    // No change of the vote once casted
    if (votingClosed || userPredictions.has(match.id)) {
      return;
    }

    onMakePrediction(match, option);
    if (match.isDerby) {
      if (onOpenDerbyPopup) {
        onOpenDerbyPopup(match, option);
      } else {
        setDerbyPopupData({ match, option });
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* ========================================================================= */}
      {/* 1. PROGRESS BAR & MY PREDICTIONS BUTTON (ELASTIC RESPONSIVE)               */}
      {/* ========================================================================= */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-700/80 bg-[#070e18] p-3 sm:p-3.5 space-y-3 shadow-xl">
        <div ref={matchListRef} className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs font-bold text-slate-400">
          <div className="min-w-0">
            <h1 className="text-white flex items-center gap-1.5 text-sm font-black">
              <Sparkles className="h-3.5 w-3.5 text-[#ff0046]" />
              Who do you think will win?
            </h1>
            <span className="text-[11px] text-slate-400 font-normal">
              {allGamesSelected ? 'Every vote is locked.' : 'One tap. It locks.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenMySlips) onOpenMySlips();
              else setShowMyVotesModal(true);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-[#14263b] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white hover:bg-[#1c3857] cursor-pointer"
            title="My slips"
            aria-label="My slips"
          >
            <List className="h-3.5 w-3.5" />
            <span>My slips</span>
          </button>
        </div>

        {matches.map((match) => {
          const isDerby = match.isDerby;
          const userSel = userPredictions.get(match.id) || null;
          const consensus = consensusMap.get(match.id);
          const stats = showVotesForConsensus(consensus, match.id, userSel);
          const isPicked = userSel !== null;
          const voteLocked = isPicked || votingClosed;
          const tick = userSel ? slipTick(match, userSel) : null;
          const showTick = tick && match.status !== 'UPCOMING' && match.status !== 'POSTPONED';

          const homeDisplay = formatTeamName(match.homeTeam.name);
          const awayDisplay = formatTeamName(match.awayTeam.name);

          // Derby styling: show status, show class, the ultimate game (slimmer, no raw votes, no prestige fixture, no legends locked)
          if (isDerby) {
            return (
              <div
                key={match.id}
                className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-r from-[#260a1a] via-[#122236] to-[#0e1b2b] p-3 sm:p-3.5 shadow-[0_0_25px_rgba(255,160,0,0.22)] ring-1 ring-amber-400/30 transition-all hover:border-amber-300"
              >
                {/* Derby Ambient Accent */}
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#ff0046]/10 blur-2xl pointer-events-none" />

                {/* Status & Class Top Bar */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-[#ff0046] to-[#ff9800] text-white shadow-sm">
                      <Crown className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#ff0046]">
                      My Match
                    </span>
                    {showTick && tick && <SlipTickLabel tick={tick} />}
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectSquadMatch(match)}
                    className="text-[10px] sm:text-[11px] font-bold text-white hover:text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded cursor-pointer border border-slate-600 transition-colors"
                  >
                    See squads
                  </button>
                </div>

                {/* Slim Matchup & Buttons: Elastic in mobile and mid devices */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                  <div className="flex-1 min-w-0 flex items-center justify-center gap-2 sm:gap-2.5">
                    <div className="flex flex-col items-end min-w-0">
                      <span className="text-xs sm:text-sm font-black text-white text-right truncate max-w-[110px] sm:max-w-[150px]">
                        {homeDisplay}
                      </span>
                      {favouriteTeam && match.homeTeam.name.toLowerCase() === favouriteTeam.toLowerCase() && (
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40 tracking-wider">
                          Derby Team
                        </span>
                      )}
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-800 border-2 border-amber-500/40 p-0.5 overflow-hidden shrink-0 shadow">
                      {match.homeTeam.logoUrl ? (
                        <img
                          src={match.homeTeam.logoUrl}
                          alt={match.homeTeam.name}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <Shield className="h-full w-full text-slate-500" />
                      )}
                    </div>
                    <span className="text-xs font-black text-amber-400 tracking-wider">VS</span>
                    <div className="h-7 w-7 rounded-full bg-slate-800 border-2 border-amber-500/40 p-0.5 overflow-hidden shrink-0 shadow">
                      {match.awayTeam.logoUrl ? (
                        <img
                          src={match.awayTeam.logoUrl}
                          alt={match.awayTeam.name}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <Shield className="h-full w-full text-slate-500" />
                      )}
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-xs sm:text-sm font-black text-white text-left truncate max-w-[110px] sm:max-w-[150px]">
                        {awayDisplay}
                      </span>
                      {favouriteTeam && match.awayTeam.name.toLowerCase() === favouriteTeam.toLowerCase() && (
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40 tracking-wider">
                          Derby Team
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1 / X / 2 Buttons: Home, X, Away (clean slate, mobile slim, mid elasticity) */}
                  <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center">
                    <button
                      type="button"
                      disabled={voteLocked}
                      onClick={() => handlePredict(match, '1')}
                      className={`tactile-button flex-1 md:flex-none px-3 py-1.5 sm:py-2 min-h-[38px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                        userSel === '1'
                          ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-md cursor-default'
                          : voteLocked
                          ? 'bg-[#0f1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#152438] border-amber-500/30 text-slate-200 hover:bg-[#1a314d] cursor-pointer'
                      }`}
                    >
                      {userSel === '1' ? '✓ ' : ''}Home
                    </button>

                    <button
                      type="button"
                      disabled={voteLocked}
                      onClick={() => handlePredict(match, 'X')}
                      className={`tactile-button flex-1 md:flex-none px-3 py-1.5 sm:py-2 min-h-[38px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                        userSel === 'X'
                          ? 'bg-[#ff9800] border-[#ff9800] text-black shadow-md cursor-default'
                          : voteLocked
                          ? 'bg-[#0f1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#152438] border-amber-500/30 text-slate-200 hover:bg-[#1a314d] cursor-pointer'
                      }`}
                    >
                      {userSel === 'X' ? '✓ ' : ''}Draw
                    </button>

                    <button
                      type="button"
                      disabled={voteLocked}
                      onClick={() => handlePredict(match, '2')}
                      className={`tactile-button flex-1 md:flex-none px-3 py-1.5 sm:py-2 min-h-[38px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                        userSel === '2'
                          ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-md cursor-default'
                          : voteLocked
                          ? 'bg-[#0f1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                          : 'bg-[#152438] border-amber-500/30 text-slate-200 hover:bg-[#1a314d] cursor-pointer'
                      }`}
                    >
                      {userSel === '2' ? '✓ ' : ''}Away
                    </button>
                  </div>
                </div>

                {/* Vote counts after the pick */}
                {isPicked && !allGamesSelected && (
                  <div className="mt-2.5 pt-2 border-t border-amber-500/20">
                    <VoteRangeBar
                      homePct={stats.homePct}
                      drawPct={stats.drawPct}
                      awayPct={stats.awayPct}
                      homeVotes={stats.homeVotes}
                      drawVotes={stats.drawVotes}
                      awayVotes={stats.awayVotes}
                      homeName={match.homeTeam.name}
                      awayName={match.awayTeam.name}
                      selectedOption={userSel}
                    />
                  </div>
                )}
              </div>
            );
          }

          // Regular match row (slimmer in mobile, elastic in mid devices)
          // Regular match row (vivid visible borders, clear separation)
          return (
            <div
              key={match.id}
              className={`rounded-xl transition-all ${
                isPicked
                  ? 'border-2 border-slate-500 bg-[#0e2136] shadow-md shadow-black/40 p-3'
                  : 'border border-slate-600/90 hover:border-slate-400 bg-[#0c1827] hover:bg-[#102033] shadow-sm hover:shadow-md p-3'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-2.5">
                {/* Time & See Squads */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatKickoffTime(match.scheduledTime)}
                  </span>
                  {showTick && tick && <SlipTickLabel tick={tick} />}
                  <button
                    type="button"
                    onClick={() => setInspectSquadMatch(match)}
                    className="text-[11px] font-bold text-white hover:text-slate-200 underline cursor-pointer"
                  >
                    See squads
                  </button>
                </div>

                {/* Teams Lineup */}
                <div className="flex-1 min-w-0 flex items-center justify-center gap-2 sm:gap-2.5">
                  <span className="text-xs sm:text-sm font-bold text-white text-right truncate max-w-[100px] sm:max-w-[140px]">
                    {homeDisplay}
                  </span>
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-800 border border-slate-700 p-0.5 overflow-hidden shrink-0">
                    {match.homeTeam.logoUrl ? (
                      <img
                        src={match.homeTeam.logoUrl}
                        alt={match.homeTeam.name}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <Shield className="h-full w-full text-slate-500" />
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-500">VS</span>
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-slate-800 border border-slate-700 p-0.5 overflow-hidden shrink-0">
                    {match.awayTeam.logoUrl ? (
                      <img
                        src={match.awayTeam.logoUrl}
                        alt={match.awayTeam.name}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <Shield className="h-full w-full text-slate-500" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white text-left truncate max-w-[100px] sm:max-w-[140px]">
                    {awayDisplay}
                  </span>
                </div>

                {/* 1 / X / 2 Buttons: Home, X, Away (clean slate, mobile slim, mid elasticity) */}
                <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center">
                  <button
                    type="button"
                    disabled={voteLocked}
                    onClick={() => handlePredict(match, '1')}
                    className={`tactile-button flex-1 md:flex-none px-3 py-1.5 sm:py-2 min-h-[38px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                      userSel === '1'
                        ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-sm cursor-default'
                        : voteLocked
                        ? 'bg-[#0f1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        : 'bg-[#14263c] border-slate-600/90 text-slate-100 hover:bg-[#19324e] hover:border-slate-500 cursor-pointer'
                    }`}
                  >
                    {userSel === '1' ? '✓ ' : ''}Home
                  </button>

                  <button
                    type="button"
                    disabled={voteLocked}
                    onClick={() => handlePredict(match, 'X')}
                    className={`tactile-button flex-1 md:flex-none px-3 py-1.5 sm:py-2 min-h-[38px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                      userSel === 'X'
                        ? 'bg-[#ff9800] border-[#ff9800] text-black shadow-sm cursor-default'
                        : voteLocked
                        ? 'bg-[#0f1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        : 'bg-[#14263c] border-slate-600/90 text-slate-100 hover:bg-[#19324e] hover:border-slate-500 cursor-pointer'
                    }`}
                  >
                    {userSel === 'X' ? '✓ ' : ''}Draw
                  </button>

                  <button
                    type="button"
                    disabled={voteLocked}
                    onClick={() => handlePredict(match, '2')}
                    className={`tactile-button flex-1 md:flex-none px-3 py-1.5 sm:py-2 min-h-[38px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                      userSel === '2'
                        ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-sm cursor-default'
                        : voteLocked
                        ? 'bg-[#0f1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        : 'bg-[#14263c] border-slate-600/90 text-slate-100 hover:bg-[#19324e] hover:border-slate-500 cursor-pointer'
                    }`}
                  >
                    {userSel === '2' ? '✓ ' : ''}Away
                  </button>
                </div>
              </div>

              {/* Requirement: When the last game is selected, no game will show the selected list,
                  unless by the My Predictions function/button selected.
                  So if isPicked && !allGamesSelected, show the single VoteRangeBar! */}
              {isPicked && !allGamesSelected && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 animate-fadeIn">
                  {/* Single Visual Vote Range Bar that runs across: Home | X | Away with full vote counts */}
                  <VoteRangeBar
                    homePct={stats.homePct}
                    drawPct={stats.drawPct}
                    awayPct={stats.awayPct}
                    homeVotes={stats.homeVotes}
                    drawVotes={stats.drawVotes}
                    awayVotes={stats.awayVotes}
                    homeName={match.homeTeam.name}
                    awayName={match.awayTeam.name}
                    selectedOption={userSel}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Game Squads Modal */}
      {inspectSquadMatch && (
        <GameSquadsModal
          match={inspectSquadMatch}
          onClose={() => setInspectSquadMatch(null)}
          onQuickPredict={(opt) => {
            handlePredict(inspectSquadMatch, opt);
          }}
        />
      )}

      {/* Derby Ultimate Share Popup */}
      {derbyPopupData && (
        <DerbyUltimatePopup
          match={derbyPopupData.match}
          selection={derbyPopupData.option}
          consensus={consensusMap.get(derbyPopupData.match.id)}
          matches={matches}
          userPredictions={userPredictions}
          consensusMap={consensusMap}
          onClose={() => setDerbyPopupData(null)}
          onContinueSelecting={() => setDerbyPopupData(null)}
          onSeeBanter={onSeeTrending}
        />
      )}

      {/* Function: My Predictions Modal */}
      {showMyVotesModal && (
        <MyVotesModal
          matches={matches}
          userPredictions={userPredictions}
          consensusMap={consensusMap}
          onClose={() => setShowMyVotesModal(false)}
          onSeeBanter={onSeeTrending}
          onSharePicks={onSharePicks}
        />
      )}
    </div>
  );
};
