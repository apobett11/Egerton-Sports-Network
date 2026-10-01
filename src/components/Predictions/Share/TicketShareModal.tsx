import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Trophy, Sparkles, Flame, Shield } from 'lucide-react';
import { shareService } from '../../../services/predictions/shareService';
import type { ConsensusIQResult, Match, UserPrediction } from '../../../types/predictions';

interface TicketShareModalProps {
  iq: ConsensusIQResult;
  predictions: UserPrediction[];
  matches: Match[];
  onClose: () => void;
  onShareCompleted: () => void;
}

export const TicketShareModal: React.FC<TicketShareModalProps> = ({
  iq,
  predictions,
  matches,
  onClose,
  onShareCompleted,
}) => {
  const [copied, setCopied] = useState(false);
  const derbyMatch = matches.find(m => m.isDerby);
  const sharePayload = shareService.generateSharePayload(iq, predictions, matches);

  const handleShareClick = async () => {
    await shareService.triggerShare(sharePayload, () => {
      onShareCompleted();
    });
  };

  const handleCopyLink = async () => {
    await shareService.copyToClipboard(`${sharePayload.text} ${sharePayload.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShareCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e1c2b] p-5 text-white tactical-modal-shadow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-base font-black uppercase tracking-wider text-white mb-4 text-center">
          Official Matchday Prediction Ticket
        </h3>

        {/* TICKET STYLED CARD (Section 19) */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[#ff0046]/60 bg-gradient-to-b from-[#111f30] via-[#09131d] to-[#111f30] p-5 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff0046] font-black text-white text-xs">
                <Trophy className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-black tracking-wider text-white">EGERSCORE EPL</span>
            </div>
            <span className="rounded-full bg-[#ff0046]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#ff0046] border border-[#ff0046]/40">
              OFFICIAL ENTRY
            </span>
          </div>

          {/* Consensus IQ on Ticket */}
          <div className="my-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Verified Consensus IQ
            </span>
            <div className="text-4xl font-black text-white font-score tracking-tight my-0.5">
              {iq.score} <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
            <div className="inline-block rounded-full bg-[#00b04f]/20 border border-[#00b04f]/40 px-3 py-0.5 text-[10px] font-black uppercase text-[#00b04f]">
              {iq.statusLabel}
            </div>
          </div>

          {/* Backed Matches Preview */}
          <div className="space-y-1.5 text-xs bg-[#060c13] p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Confirmed Matchday Picks:
            </div>
            {predictions.slice(0, 3).map(p => {
              const m = matches.find(match => match.id === p.matchId);
              if (!m) return null;
              return (
                <div key={p.matchId} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 truncate max-w-[170px]">
                    {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                  </span>
                  <span className="font-bold text-[#ff0046]">
                    {p.prediction === '1' ? `${m.homeTeam.shortName} Win` : p.prediction === '2' ? `${m.awayTeam.shortName} Win` : 'Draw (X)'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Marquee Climax Teaser (Section 20) */}
          {derbyMatch && (
            <div className="mt-3 rounded-lg bg-[#1a1408] border border-[#ff9800]/40 p-2 text-center text-[10px]">
              <span className="font-black text-[#ff9800] uppercase tracking-wider block">
                🔥 LOCKED MATCHDAY CLIMAX
              </span>
              <span className="text-slate-300 font-bold">
                {derbyMatch.homeTeam.name} vs {derbyMatch.awayTeam.name}
              </span>
            </div>
          )}
        </div>

        {/* Share Action Controls */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleShareClick}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0046] to-[#ff9800] text-white font-black text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Ticket & Reveal Derby</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-[#14263b] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1a334f] transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#00b04f]" /> : <Copy className="h-3.5 w-3.5 text-slate-300" />}
            <span>{copied ? 'Link & Picks Copied!' : 'Copy Shareable Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
