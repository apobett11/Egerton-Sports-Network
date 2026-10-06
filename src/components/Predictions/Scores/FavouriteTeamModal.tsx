import React, { useState } from 'react';
import { X, Shield, Crown, Flame } from 'lucide-react';
import { formatTeamName } from '../../../lib/predictions/utils';
import { CompactDirectBanner } from '../../ads/CompactDirectBanner';
import type { Team } from '../../../types/predictions';

interface FavouriteTeamModalProps {
  teams: Team[];
  selectedTeam?: string | null;
  onSelectTeam: (teamName: string) => void;
  onClose: () => void;
}

export const FavouriteTeamModal: React.FC<FavouriteTeamModalProps> = ({
  teams,
  selectedTeam,
  onSelectTeam,
  onClose,
}) => {
  const [pickingTeam, setPickingTeam] = useState<string | null>(null);

  const handlePick = (teamName: string) => {
    setPickingTeam(teamName);
    onSelectTeam(teamName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glassmorphic-backdrop">
      <div className="relative w-full max-w-2xl rounded-2xl glassmorphic-card p-5 sm:p-6 text-white tactical-modal-shadow max-h-[92vh] overflow-y-auto">
        {/* Glow Ambient Lights */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#ff0046]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#00b04f]/15 blur-3xl pointer-events-none" />

        {/* Close Button: only accessible if user already has a team selected (e.g. changing team) */}
        {selectedTeam && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Minimalist Top Badge */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ff0046] text-white shadow-sm">
            <Flame className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-black tracking-widest text-[#ff0046] uppercase">
          ONE CLUB • THIS MATCHDAY
        </span>
        </div>

        {/* Main H1 Title */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight text-center">
          Pick the club you stand with
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 text-center mt-1 max-w-md mx-auto">
          One tap. It locks your match for the week.
        </p>

        {/* Side-by-Side Cards of Team Names */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
          {teams.map((team) => {
            const isCurrent = (pickingTeam ? pickingTeam === team.name : selectedTeam === team.name);
            const formattedName = formatTeamName(team.name);

            return (
              <button
                key={team.id || team.name}
                type="button"
                onClick={() => handlePick(team.name)}
                className={`tactile-button group relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#ff0046]/20 border-[#ff0046] shadow-[0_0_20px_rgba(255,0,70,0.3)] ring-1 ring-[#ff0046] scale-[1.02]'
                    : 'bg-[#0a1624] hover:bg-[#122338] border-slate-700/80 hover:border-slate-500'
                }`}
              >
                {/* Team Logo / Badge */}
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-800 border-2 border-slate-700/80 p-1 mb-2 overflow-hidden flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <Shield className="h-6 w-6 text-slate-400" />
                  )}
                </div>

                {/* Team Name */}
                <span className="text-xs sm:text-sm font-black text-white leading-tight">
                  {formattedName}
                </span>

                {/* Short Code Badge */}
                <span className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase">
                  {team.shortName || 'EPL'}
                </span>

                {isCurrent && (
                  <span className="mt-2 text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Derby Team
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Styled Advert at bottom of modal */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <CompactDirectBanner
            variant="amber"
            label="Campus Derby Match"
            tagline="Claim 100% Free Bet & Live Odds"
            ctaText="Claim"
            className="!my-0 !px-0"
          />
        </div>
      </div>
    </div>
  );
};
