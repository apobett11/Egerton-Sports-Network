import React from 'react';
import { Check, Share2, Shield, Calendar } from 'lucide-react';
import type { PotwCandidate } from '../../types/potw';
import { buildWhatsAppShareUrl } from '../../services/potwService';

interface PotwNomineeCardProps {
  candidate: PotwCandidate;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const PotwNomineeCard: React.FC<PotwNomineeCardProps> = ({
  candidate,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = buildWhatsAppShareUrl(candidate);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => {
        if (!disabled) onSelect();
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative rounded-2xl p-5 select-none transition-all duration-200 outline-none ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-[#0e1c2b]/60 border border-white/5'
          : 'cursor-pointer active:scale-[0.985]'
      } ${
        isSelected
          ? 'backdrop-blur-md bg-[#132337] border-2 border-[#ff0046] ring-2 ring-[#ff0046]/40 shadow-[0_0_25px_rgba(255,0,70,0.25)]'
          : 'backdrop-blur-md bg-[#0e1c2b]/90 border border-white/10 hover:border-[#ff0046]/40 hover:bg-[#112438]/90'
      }`}
    >
      {/* Selection Checkmark Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="p-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105"
          title={`Share ${candidate.player_name} on WhatsApp`}
          aria-label={`Share ${candidate.player_name} on WhatsApp`}
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#ff0046] text-white shadow-md shadow-[#ff0046]/50 scale-100'
              : 'border border-white/20 bg-white/5 text-transparent group-hover:border-white/40'
          }`}
        >
          <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'text-white' : 'opacity-0'}`} />
        </div>
      </div>

      {/* Card Header: Team & Jersey */}
      <div className="flex items-center gap-3 pr-20 mb-3">
        {candidate.team_logo ? (
          <img
            src={candidate.team_logo}
            alt={candidate.team_name}
            className="w-10 h-10 object-contain rounded-lg bg-black/20 p-1 border border-white/10"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
            <Shield className="w-5 h-5 text-slate-300" />
          </div>
        )}

        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-300 truncate">
            {candidate.team_name}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            {candidate.position && <span>{candidate.position}</span>}
            {candidate.jersey_number !== undefined && (
              <>
                {candidate.position && <span className="text-slate-600">•</span>}
                <span className="font-mono font-bold text-slate-300">#{candidate.jersey_number}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player Headline */}
      <div className="mt-2 mb-3">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug truncate">
          {candidate.player_name}
        </h3>
      </div>

      {/* Match Details: Prominently displayed weekend highlight */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2 text-xs text-slate-300">
        <Calendar className="w-3.5 h-3.5 text-[#ff0046] shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <span className="font-medium text-slate-200">{candidate.match_details}</span>
          {candidate.match_date && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              Matchday Highlight
            </div>
          )}
        </div>
      </div>

      {/* Selection Pill indicator at card bottom */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
            isSelected ? 'text-[#ff0046]' : 'text-slate-400 group-hover:text-slate-300'
          }`}
        >
          {isSelected ? 'Selected Nominee' : 'Tap to Select'}
        </span>
        <span className="text-[10px] text-slate-400 uppercase font-semibold">
          MOTM Awardee
        </span>
      </div>
    </div>
  );
};
