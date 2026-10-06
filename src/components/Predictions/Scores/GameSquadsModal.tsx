import React from 'react';
import { X, Shield, Activity, AlertTriangle, Users, Star } from 'lucide-react';
import type { Match, PredictionOption } from '../../../types/predictions';
import { MonetagTopRightAd } from '../../ads/MonetagTopRightAd';

interface GameSquadsModalProps {
  match: Match;
  onClose: () => void;
  onQuickPredict?: (option: PredictionOption) => void;
}

export const GameSquadsModal: React.FC<GameSquadsModalProps> = ({
  match,
  onClose,
  onQuickPredict,
}) => {
  const squads = match.squads;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <MonetagTopRightAd />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0b1622] p-5 text-white tactical-modal-shadow max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff0046] text-white">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Official Match Squads & Tactics
            </h3>
            <p className="text-[11px] text-slate-400">
              {match.homeTeam.name} vs {match.awayTeam.name} • Matchday {match.matchday}
            </p>
          </div>
        </div>

        {/* Teams Matchup Header */}
        <div className="rounded-xl border border-slate-700/60 bg-[#081018] p-3.5 mb-4 grid grid-cols-7 items-center text-center">
          <div className="col-span-3 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-2 border-slate-700 bg-[#0e1c2b] p-1 mb-1.5 overflow-hidden">
              {match.homeTeam.logoUrl ? (
                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <Shield className="h-full w-full text-slate-500" />
              )}
            </div>
            <span className="text-xs font-black text-white leading-tight">{match.homeTeam.name}</span>
            <span className="text-[10px] font-bold text-[#00b04f] mt-0.5">{squads?.homeFormation || '4-3-3'}</span>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-[#ff0046]">VS</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Pitch</span>
          </div>

          <div className="col-span-3 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-2 border-slate-700 bg-[#0e1c2b] p-1 mb-1.5 overflow-hidden">
              {match.awayTeam.logoUrl ? (
                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <Shield className="h-full w-full text-slate-500" />
              )}
            </div>
            <span className="text-xs font-black text-white leading-tight">{match.awayTeam.name}</span>
            <span className="text-[10px] font-bold text-[#ff9800] mt-0.5">{squads?.awayFormation || '4-2-3-1'}</span>
          </div>
        </div>

        {/* Squad Lineups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Home Squad */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1c2b] p-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-black text-white">{match.homeTeam.shortName} Starting Roster</span>
              <span className="text-[10px] font-bold text-[#00b04f] bg-[#00b04f]/15 px-2 py-0.5 rounded-md">
                {squads?.homeFormation || '4-3-3'}
              </span>
            </div>

            <div className="space-y-1.5">
              {squads?.homeKeyPlayers.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#081018]/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold w-4">#{player.number}</span>
                    <span className="font-bold text-slate-200">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {player.isKeyPlayer && (
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {player.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Home Team Injuries */}
            {squads?.homeInjuries && squads.homeInjuries.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Injuries: {squads.homeInjuries.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Away Squad */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1c2b] p-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-black text-white">{match.awayTeam.shortName} Starting Roster</span>
              <span className="text-[10px] font-bold text-[#ff9800] bg-[#ff9800]/15 px-2 py-0.5 rounded-md">
                {squads?.awayFormation || '4-2-3-1'}
              </span>
            </div>

            <div className="space-y-1.5">
              {squads?.awayKeyPlayers.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#081018]/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold w-4">#{player.number}</span>
                    <span className="font-bold text-slate-200">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {player.isKeyPlayer && (
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {player.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Away Team Injuries */}
            {squads?.awayInjuries && squads.awayInjuries.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Injuries: {squads.awayInjuries.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tactical Call Action */}
        {onQuickPredict && (
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Who do you think will win?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onQuickPredict('1');
                  onClose();
                }}
                className="py-2 px-2 rounded-lg bg-[#14263b] hover:bg-[#00b04f] text-white text-xs font-black uppercase tracking-wider border border-slate-700 hover:border-[#00b04f] transition-all cursor-pointer text-center"
              >
                {match.homeTeam.shortName} Win
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickPredict('X');
                  onClose();
                }}
                className="py-2 px-2 rounded-lg bg-[#14263b] hover:bg-[#ff9800] text-white text-xs font-black uppercase tracking-wider border border-slate-700 hover:border-[#ff9800] transition-all cursor-pointer text-center"
              >
                Draw (X)
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickPredict('2');
                  onClose();
                }}
                className="py-2 px-2 rounded-lg bg-[#14263b] hover:bg-[#ff0046] text-white text-xs font-black uppercase tracking-wider border border-slate-700 hover:border-[#ff0046] transition-all cursor-pointer text-center"
              >
                {match.awayTeam.shortName} Win
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
