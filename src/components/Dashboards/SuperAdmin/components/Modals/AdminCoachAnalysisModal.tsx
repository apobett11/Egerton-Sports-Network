import React, { useEffect, useState } from 'react';
import {
  X,
  Shirt,
  Users,
  Zap,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Trophy,
  Star,
} from 'lucide-react';
import { useCoachAnalysisData } from '../../hooks/useCoachAnalysisData';
import type { CoachAnalysisTeam, MatchAnalysis } from '../../hooks/useCoachAnalysisData';

interface AdminCoachAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Tick / Cross renderers ───────────────────────────────────────────────────

const Tick = ({ double = false, title = '' }: { double?: boolean; title?: string }) => (
  <span
    title={title}
    className={`inline-flex items-center justify-center ${
      double ? 'px-1.5 h-5' : 'w-5 h-5'
    } rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-[10px] leading-none`}
  >
    {double ? '✓✓' : '✓'}
  </span>
);

const Cross = ({ title = '' }: { title?: string }) => (
  <span
    title={title}
    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black text-[10px] leading-none"
  >
    ✗
  </span>
);

// ─── Per-match mini analysis block (4 icons) ──────────────────────────────────

const MatchMiniBlock = ({ match }: { match: MatchAnalysis }) => (
  <div className="flex flex-col items-center gap-1 min-w-[60px]">
    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
      MD{match.matchday}
    </div>
    <div className="text-[9px] text-gray-500 max-w-[56px] truncate text-center">
      {match.isHome ? 'vs ' : '@ '}
      {match.opponentName}
    </div>
    <div className="flex items-center gap-0.5 mt-0.5">
      {/* Kits */}
      {match.kits ? <Tick title="Kits uploaded" /> : <Cross title="Kits pending" />}
      {/* Match Squad */}
      {match.squadXI ? (
        match.squadSubs ? (
          <Tick double title="First XI + Substitutes submitted" />
        ) : (
          <Tick title="First XI submitted (no subs)" />
        )
      ) : (
        <Cross title="No XI submitted" />
      )}
      {/* Match Events */}
      {match.matchEvents ? (
        <Tick title="Match events logged" />
      ) : (
        <Cross title="No match events" />
      )}
      {/* Team Logo */}
      {match.teamLogo ? (
        <Tick title="Team logo uploaded" />
      ) : (
        <Cross title="No team logo" />
      )}
    </div>
  </div>
);

// ─── Team Row ─────────────────────────────────────────────────────────────────

const TeamRow = ({ team }: { team: CoachAnalysisTeam }) => {
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-[#1F1F1F] transition-colors border-b border-[#2A2A2A]">
        {/* # Index — red circle if no coach */}
        <td className="p-3 text-center">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold ${
              team.hasCoach
                ? 'bg-[#2A2A2A] text-gray-300'
                : 'bg-rose-500/20 text-rose-400 border-2 border-rose-500'
            }`}
            title={team.hasCoach ? '' : 'No coach assigned'}
          >
            {team.index}
          </span>
        </td>

        {/* Team name + logo */}
        <td className="p-3 min-w-[160px]">
          <div className="flex items-center gap-2.5">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-7 h-7 rounded-full object-cover border border-[#333333] bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-extrabold text-white text-xs truncate">{team.name}</span>
          </div>
        </td>

        {/* Matches Played */}
        <td className="p-3 text-center">
          <span className="font-mono font-bold text-white text-sm">{team.matchesPlayed}</span>
        </td>

        {/* Overall: Kits */}
        <td className="p-3 text-center">
          {team.hasUploadedKits ? (
            <Tick title="Kits uploaded" />
          ) : (
            <Cross title="No kits uploaded" />
          )}
        </td>

        {/* Overall: Logo */}
        <td className="p-3 text-center">
          {team.hasUploadedLogo ? (
            <Tick title="Logo uploaded" />
          ) : (
            <Cross title="No logo uploaded" />
          )}
        </td>

        {/* Per-match analysis — scrollable mini cells */}
        <td className="p-2">
          {team.matches.length === 0 ? (
            <span className="text-[10px] text-gray-500 italic">No finished matches</span>
          ) : (
            <div className="flex items-start gap-2 overflow-x-auto pb-1">
              {team.matches.map((m) => (
                <MatchMiniBlock key={m.fixtureId} match={m} />
              ))}
            </div>
          )}
        </td>

        {/* Coach details toggle */}
        <td className="p-3 text-right">
          <button
            onClick={() => setCoachOpen((p) => !p)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
            title={team.hasCoach ? 'View coach details' : 'No coach assigned'}
          >
            {team.hasCoach ? (
              <>
                Coach
                {coachOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </>
            ) : (
              <span className="text-rose-400">No Coach</span>
            )}
          </button>
        </td>
      </tr>

      {/* Coach Details Dropdown Row */}
      {coachOpen && team.hasCoach && (
        <tr className="bg-[#141414] border-b border-[#2A2A2A]">
          <td colSpan={7} className="px-6 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-extrabold text-white">{team.coachName}</div>
                  <div className="text-[10px] text-gray-400">Head Coach</div>
                </div>
              </div>
              <div className="text-gray-400">
                <span className="text-gray-500">Email: </span>
                <span className="font-mono text-gray-200">{team.coachEmail}</span>
              </div>
              <div className="text-gray-400">
                <span className="text-gray-500">Team: </span>
                <span className="font-bold text-emerald-400">{team.name}</span>
              </div>
              <div className="text-gray-400">
                <span className="text-gray-500">League: </span>
                <span
                  className={`font-bold ${
                    team.league === 'EPL' ? 'text-blue-400' : 'text-amber-400'
                  }`}
                >
                  {team.league}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── League Table Section ──────────────────────────────────────────────────────

const LeagueSection = ({
  title,
  teams,
  icon: Icon,
  iconColor,
}: {
  title: string;
  teams: CoachAnalysisTeam[];
  icon: React.ElementType;
  iconColor: string;
}) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{title}</h3>
        <span className="text-[11px] text-gray-400 font-normal">({teams.length} clubs)</span>
      </div>
      {/* Legend */}
      <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-400 font-medium">
        <span>
          <span className="text-emerald-400 font-bold">✓</span> Done
        </span>
        <span>
          <span className="text-emerald-400 font-bold">✓✓</span> XI + Subs
        </span>
        <span>
          <span className="text-rose-400 font-bold">✗</span> Pending
        </span>
        <span>
          <span className="text-rose-400 font-bold border border-rose-500 rounded-full px-1">
            #
          </span>{' '}
          No Coach
        </span>
      </div>
    </div>

    <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
      <table className="w-full text-left font-sans text-xs min-w-[700px]">
        <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider">
          <tr>
            <th className="p-3 text-center w-10">#</th>
            <th className="p-3">Team</th>
            <th className="p-3 text-center whitespace-nowrap">
              <span title="Finished matches played">MP</span>
            </th>
            <th className="p-3 text-center">
              <span title="Kits uploaded">
                <Shirt className="w-3.5 h-3.5 inline" />
              </span>
            </th>
            <th className="p-3 text-center">
              <span title="Logo uploaded">
                <ImageIcon className="w-3.5 h-3.5 inline" />
              </span>
            </th>
            <th className="p-3">
              <span className="text-[10px] text-gray-400 font-bold">
                Per-Match Analysis (Shirt · Squad · Events · Logo)
              </span>
            </th>
            <th className="p-3 text-right">Coach</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
          {teams.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                No teams found in this league.
              </td>
            </tr>
          ) : (
            teams.map((team) => <TeamRow key={team.id} team={team} />)
          )}
        </tbody>
      </table>
    </div>
  </section>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const AdminCoachAnalysisModal: React.FC<AdminCoachAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { eplTeams, championshipTeams, isLoading, error, fetchData } = useCoachAnalysisData();

  // Fetch on first open
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  if (!isOpen) return null;

  const totalTeams = eplTeams.length + championshipTeams.length;
  const teamsWithCoach = [...eplTeams, ...championshipTeams].filter((t) => t.hasCoach).length;
  const teamsNoCoach = totalTeams - teamsWithCoach;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#2A2A2A] bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                Coach Analysis
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Per-team, per-match readiness — kits · squad · events · logo — live from database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Summary badges */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              ✓ {teamsWithCoach} with coach
            </span>
            {teamsNoCoach > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold">
                <AlertCircle className="w-3 h-3" />
                {teamsNoCoach} no coach
              </span>
            )}

            <button
              onClick={() => fetchData()}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-gray-400 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-8 flex-1">
          {/* Legend (mobile) */}
          <div className="sm:hidden flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-medium pb-2 border-b border-[#2A2A2A]">
            <span>
              <span className="text-emerald-400 font-bold">✓</span> Done
            </span>
            <span>
              <span className="text-emerald-400 font-bold">✓✓</span> XI + Subs
            </span>
            <span>
              <span className="text-rose-400 font-bold">✗</span> Pending
            </span>
            <span>
              <span className="text-rose-400 font-bold border border-rose-500 rounded-full px-1">
                #
              </span>{' '}
              No Coach
            </span>
          </div>

          {/* Column key explanation */}
          <div className="flex flex-wrap gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] text-gray-300">
              <Shirt className="w-3 h-3 text-blue-400" />
              <span>Kits uploaded</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] text-gray-300">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Match squad (✓✓ = XI + subs)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] text-gray-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Match events logged</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] text-gray-300">
              <ImageIcon className="w-3 h-3 text-purple-400" />
              <span>Team logo uploaded</span>
            </span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
                <span className="text-sm font-bold text-gray-300">Loading coach analysis...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => fetchData()}
                className="ml-auto px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tables */}
          {!isLoading && !error && (
            <>
              <LeagueSection
                title="EPL League"
                teams={eplTeams}
                icon={Trophy}
                iconColor="text-blue-400"
              />
              <LeagueSection
                title="Championship League"
                teams={championshipTeams}
                icon={Star}
                iconColor="text-amber-400"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
