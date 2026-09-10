import React from 'react';
import { ArrowLeft, Share2, Briefcase, Trophy, Shield, User } from 'lucide-react';
import type { FullTeamRecord } from '../Dashboards/Team/lib/supabaseClient';
import type { StandingEntry } from '../Dashboards/Team/types';

interface TeamDetailsHeaderProps {
  team: FullTeamRecord;
  standing?: StandingEntry;
  onBack: () => void;
}

export const TeamDetailsHeader: React.FC<TeamDetailsHeaderProps> = ({
  team,
  standing,
  onBack,
}) => {
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#/team/${team.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${team.name} - Egerton Sports Network`,
        url: shareUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const coachName = team.coach_name || 'Head Coach';
  const leagueName = team.competition_name || 'Egerton Premier League';

  return (
    <div className="w-full select-none bg-[#0e1e2d] text-white border-b border-[#16283d]">
      {/* 1. TOP BREADCRUMB / NAV BAR */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#16283d] text-xs max-w-5xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 hover:text-[#ff0046] hover:bg-[#14263b] rounded-md transition-colors cursor-pointer text-slate-300 flex items-center gap-1"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase hidden sm:inline">Back</span>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 truncate max-w-[260px] sm:max-w-none">
          <span>⚽ FOOTBALL</span>
          <span>&gt;</span>
          <span>🇰🇪 KENYA</span>
          <span>&gt;</span>
          <span className="text-white font-extrabold uppercase truncate">{leagueName}</span>
        </div>

        {/* Right Action Icons: Share */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-[#14263b] rounded-md transition-colors cursor-pointer"
            title="Share Team Profile"
            onClick={handleShare}
            aria-label="Share Team Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. TEAM PROFILE HERO CONTAINER */}
      <div className="px-4 py-6 sm:py-8 flex flex-col items-center justify-center max-w-4xl mx-auto text-center">
        {/* Crest & Team Badge */}
        <div className="relative mb-3.5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#14263b] border-2 border-white/10 p-2 flex items-center justify-center shadow-xl overflow-hidden">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.name}
                className="w-full h-full object-contain drop-shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Shield className="w-10 h-10 text-[#ff0046]" />
            )}
          </div>
          {standing?.position && (
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-[#ff0046] text-white shadow-md border border-white/20">
              #{standing.position}
            </span>
          )}
        </div>

        {/* Team Name and Short Tag */}
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              {team.name}
            </h1>
            {team.short_name && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/10 text-slate-300 border border-white/10 font-mono">
                {team.short_name}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400">
            {leagueName} • Official Club Profile
          </p>
        </div>

        {/* Head Coach Badge & Information */}
        <div className="mt-4 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#14263b]/80 border border-white/10 text-xs shadow-xs">
          <div className="w-6 h-6 rounded-full bg-[#ff0046]/20 text-[#ff0046] flex items-center justify-center shrink-0">
            {team.coach_avatar ? (
              <img
                src={team.coach_avatar}
                alt={coachName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Briefcase className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              HEAD COACH:
            </span>
            <span className="text-xs font-extrabold text-white tracking-wide">
              {coachName}
            </span>
          </div>
        </div>

        {/* Quick League Performance Metric Badges */}
        {standing && (
          <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-4 max-w-md w-full">
            <div className="bg-[#14263b]/60 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Rank</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                #{standing.position}
              </span>
            </div>
            <div className="bg-[#14263b]/60 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Points</span>
              <span className="text-base sm:text-lg font-black font-mono text-[#00b04f]">
                {standing.points}
              </span>
            </div>
            <div className="bg-[#14263b]/60 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Played</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {standing.played}
              </span>
            </div>
            <div className="bg-[#14263b]/60 border border-white/5 rounded-lg p-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Goal Diff</span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-200">
                {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetailsHeader;
