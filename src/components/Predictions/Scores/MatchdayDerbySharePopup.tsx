import React, { useState } from 'react';
import { X, Flame, Share2, Copy, Check, Shield, Users, Lock, Unlock, AlertTriangle, Swords } from 'lucide-react';
import { shareService } from '../../../services/predictions/shareService';
import type { Match, PredictionOption, ConsensusData, ConsensusIQResult, UserPrediction } from '../../../types/predictions';

interface MatchdayDerbySharePopupProps {
  derbyMatch: Match;
  userSelection: PredictionOption | null;
  consensus?: ConsensusData;
  iq: ConsensusIQResult;
  predictions: UserPrediction[];
  allMatches: Match[];
  isUnlocked: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const MatchdayDerbySharePopup: React.FC<MatchdayDerbySharePopupProps> = ({
  derbyMatch,
  userSelection,
  consensus,
  iq,
  predictions,
  allMatches,
  isUnlocked,
  onClose,
  onUnlocked,
}) => {
  const [copied, setCopied] = useState(false);
  const [unlockedState, setUnlockedState] = useState(isUnlocked);

  const selectedTeamName =
    userSelection === '1'
      ? derbyMatch.homeTeam.name
      : userSelection === '2'
      ? derbyMatch.awayTeam.name
      : 'Draw (Stalemate)';

  const opposingTeamName =
    userSelection === '1'
      ? derbyMatch.awayTeam.name
      : userSelection === '2'
      ? derbyMatch.homeTeam.name
      : 'both rivals';

  // Rivalry share text built with fierce spirit
  const shareText = `⚔️ DERBY BATTLE CALL! I just backed ${selectedTeamName} in the Matchday Derby on EgerScore! ${opposingTeamName} fans are falsely claiming the win. Stand up and vote for our club before kickoff!`;
  const shareUrl = window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Matchday Derby: ${derbyMatch.homeTeam.name} vs ${derbyMatch.awayTeam.name}`,
          text: shareText,
          url: shareUrl,
        });
        setUnlockedState(true);
        onUnlocked();
      } catch {
        // Fallback if user cancels or shares via other method
      }
    } else {
      // WhatsApp direct link fallback
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      window.open(waUrl, '_blank');
      setUnlockedState(true);
      onUnlocked();
    }
  };

  const handleCopy = async () => {
    await shareService.copyToClipboard(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setUnlockedState(true);
    onUnlocked();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#ff0046] bg-gradient-to-b from-[#180911] via-[#0d1624] to-[#070d16] p-5 sm:p-6 text-white tactical-modal-shadow shadow-[0_0_50px_rgba(255,0,70,0.35)] overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#ff0046]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#ff9800]/20 blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff0046] to-[#ff9800] text-white shadow-lg shadow-[#ff0046]/40">
            <Swords className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest text-[#ff0046] uppercase">
                MATCHDAY DERBY CLASH
              </span>
              <span className="rounded-full bg-[#ff0046]/20 border border-[#ff0046]/50 px-2 py-0.2 text-[9px] font-black uppercase text-[#ff0046] animate-pulse">
                SPIRIT TO FIGHT
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              {derbyMatch.homeTeam.name} vs {derbyMatch.awayTeam.name}
            </h3>
          </div>
        </div>

        {/* User Choice Banner */}
        <div className="my-3 rounded-xl border border-[#ff0046]/50 bg-gradient-to-r from-[#ff0046]/25 via-[#162536] to-[#0c1825] p-3 text-center">
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase block mb-0.5">
            YOUR TACTICAL CALL LOCKED:
          </span>
          <div className="text-sm sm:text-base font-black text-white flex items-center justify-center gap-2">
            <span className="text-lg">🛡️</span>
            <span className="text-[#ff0046] uppercase">{selectedTeamName}</span>
            <span className="text-xs font-semibold text-slate-300">({userSelection === '1' ? 'Home Win' : userSelection === '2' ? 'Away Win' : 'Draw'})</span>
          </div>
        </div>

        {/* UNLOCKED VIEW: SUPPORTERS & SCORES */}
        {unlockedState ? (
          <div className="mt-4 rounded-xl border border-emerald-500/50 bg-[#091a1a]/90 p-4 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <Unlock className="h-4 w-4" />
              <span>Derby Supporters & Live Scores Unlocked!</span>
            </div>
            <p className="text-xs text-slate-300 text-center mb-4">
              Here is the live community consensus breakdown for this high-stakes clash:
            </p>

            {consensus && (
              <div className="grid grid-cols-3 gap-2.5 text-center my-3">
                <div className={`p-3 rounded-xl border ${userSelection === '1' ? 'border-[#00b04f] bg-[#00b04f]/20' : 'border-slate-800 bg-[#06101a]'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{derbyMatch.homeTeam.shortName}</span>
                  <span className="text-xl font-black text-[#00b04f]">{consensus.homePct}%</span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Supporters</span>
                </div>
                <div className={`p-3 rounded-xl border ${userSelection === 'X' ? 'border-[#ff9800] bg-[#ff9800]/20' : 'border-slate-800 bg-[#06101a]'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Draw</span>
                  <span className="text-xl font-black text-[#ff9800]">{consensus.drawPct}%</span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Supporters</span>
                </div>
                <div className={`p-3 rounded-xl border ${userSelection === '2' ? 'border-[#ff0046] bg-[#ff0046]/20' : 'border-slate-800 bg-[#06101a]'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{derbyMatch.awayTeam.shortName}</span>
                  <span className="text-xl font-black text-[#ff0046]">{consensus.awayPct}%</span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Supporters</span>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2.5">
              <span>{consensus?.pulseLabel || 'Active fan votes verified'}</span>
              <span className="text-emerald-400 font-bold">Consensus IQ: {iq.score}/100</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#00b04f] hover:bg-[#009b45] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              Continue to Community Debates →
            </button>
          </div>
        ) : (
          /* LOCKED VIEW: DARK PSYCHOLOGY & MUST SHARE */
          <div className="mt-4 space-y-3.5">
            {/* Dark Psychology Emotional Hook Box */}
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#211204] to-[#120a02] p-4 text-left">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#ff0046]" />
                <span>⚠️ ENEMY FANS ARE MOBILIZING!</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Right now, <span className="font-black text-[#ff9800]">{opposingTeamName} fans</span> have been aggressively voting and claiming dominance over this matchday!
              </p>
              <div className="mt-2.5 rounded-lg bg-black/50 p-2.5 border border-amber-500/20 text-[11px] text-slate-300">
                <p className="font-bold text-white mb-1">
                  🔥 Supporter Scores & Full Fan Breakdown Are Locked!
                </p>
                <p className="text-slate-400">
                  Your lone vote is not enough. You <span className="text-white font-bold underline">MUST SHARE</span> with your club's supporters to counter the enemy raid and unlock the live scores!
                </p>
              </div>
            </div>

            {/* Locked Visual Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest py-1">
              <Lock className="h-3.5 w-3.5 text-[#ff0046] animate-bounce" />
              <span>Share to reveal who truly rules the pitch</span>
            </div>

            {/* Call to Arms Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShare}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff0046] via-[#ff3b30] to-[#ff9800] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#ff0046]/40 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>⚔️ RALLY THE TROOPS • SHARE TO UNLOCK SCORES</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl bg-[#14263b] hover:bg-[#1a334f] text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700/80"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#00b04f]" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copied ? 'Battle Link Copied to Clipboard!' : 'Copy Battle Call Text'}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center italic">
              Sharing to WhatsApp or social networks immediately unlocks the crowd percentages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
