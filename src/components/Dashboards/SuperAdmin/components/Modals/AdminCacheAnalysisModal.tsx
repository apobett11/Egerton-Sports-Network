import React, { useState } from 'react';
import {
  X,
  Shirt,
  Users,
  Zap,
  Image as ImageIcon,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  useCacheAnalysisData,
  type CacheLeagueTable,
  type CacheMatchCell,
  type CacheOption,
  type CacheTeamRow,
} from '../../hooks/useCacheAnalysisData';

interface AdminCacheAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OPTIONS: { id: CacheOption; label: string; hint: string; icon: React.ElementType; color: string }[] = [
  { id: 'kits', label: 'Kits', hint: 'Kit upload on each finished match', icon: Shirt, color: 'text-blue-400' },
  { id: 'squad', label: 'Match Squad', hint: 'First XI, double tick when subs are in', icon: Users, color: 'text-emerald-400' },
  { id: 'events', label: 'Match Events', hint: 'Events written from the coach dashboard', icon: Zap, color: 'text-amber-400' },
  { id: 'logo', label: 'Team Logo', hint: 'Logo saved on the team record', icon: ImageIcon, color: 'text-purple-400' },
];

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

const Mark = ({ cell, option }: { cell: CacheMatchCell | undefined; option: CacheOption }) => {
  if (!cell || cell.mark === 'none') {
    return <span className="text-[10px] text-gray-600">—</span>;
  }
  const where = `${cell.isHome ? 'vs' : '@'} ${cell.opponentName}`;
  if (cell.mark === 'double') return <Tick double title={`${where} — first XI and substitutes`} />;
  if (cell.mark === 'tick') {
    const label =
      option === 'kits'
        ? 'Kits on file'
        : option === 'logo'
          ? 'Logo on file'
          : option === 'events'
            ? 'Match events recorded'
            : 'First XI submitted';
    return <Tick title={`${where} — ${label}`} />;
  }
  const missing =
    option === 'kits'
      ? 'Kits not uploaded'
      : option === 'logo'
        ? 'Logo not uploaded'
        : option === 'events'
          ? 'No match events'
          : 'No first XI';
  return <Cross title={`${where} — ${missing}`} />;
};

const CoachMenu = ({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-bold text-gray-200 hover:text-white transition-all cursor-pointer"
    aria-expanded={open}
  >
    Coach
    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
  </button>
);

const LeagueTable = ({ league, option }: { league: CacheLeagueTable; option: CacheOption }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
        {league.name}
        <span className="ml-2 text-[11px] font-normal text-gray-400">({league.teams.length} clubs)</span>
      </h3>
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-medium">
        <span><span className="text-emerald-400 font-bold">✓</span> Updated</span>
        {option === 'squad' && (
          <span><span className="text-emerald-400 font-bold">✓✓</span> XI + subs</span>
        )}
        <span><span className="text-rose-400 font-bold">✗</span> Not updated</span>
        <span>
          <span className="text-rose-400 font-bold border border-rose-500 rounded-full px-1">#</span> No coach
        </span>
      </div>
    </div>

    <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
      <table className="w-full text-left font-sans text-xs min-w-[720px]">
        <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider">
          <tr>
            <th className="p-3 text-center w-12">#</th>
            <th className="p-3 min-w-[160px]">Team</th>
            <th className="p-3 text-center" title="Finished matches played">MP</th>
            {league.matchdays.map((md) => (
              <th key={md} className="p-3 text-center whitespace-nowrap">MD{md}</th>
            ))}
            <th className="p-3 text-right">Coach</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
          {league.teams.length === 0 ? (
            <tr>
              <td colSpan={4 + league.matchdays.length} className="p-8 text-center text-xs text-gray-400">
                No teams in this league.
              </td>
            </tr>
          ) : (
            league.teams.map((team) => (
              <TeamRow key={team.id} team={team} option={option} matchdays={league.matchdays} colSpan={4 + league.matchdays.length} />
            ))
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const TeamRow = ({
  team,
  option,
  matchdays,
  colSpan,
}: {
  team: CacheTeamRow;
  option: CacheOption;
  matchdays: number[];
  colSpan: number;
}) => {
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-[#1F1F1F] transition-colors">
        <td className="p-3 text-center">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold ${
              team.hasCoach
                ? 'bg-[#2A2A2A] text-gray-300'
                : 'bg-rose-500/20 text-rose-400 border-2 border-rose-500'
            }`}
            title={team.hasCoach ? 'Coach assigned' : 'No coach assigned'}
          >
            {team.index}
          </span>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt=""
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
        <td className="p-3 text-center">
          <span className="font-mono font-bold text-white text-sm">{team.matchesPlayed}</span>
        </td>
        {matchdays.map((md) => {
          const cell = team.cells[md];
          return (
            <td key={md} className="p-2 text-center align-middle">
              <div className="flex flex-col items-center gap-1 min-w-[64px]">
                <Mark cell={cell} option={option} />
                {cell && (
                  <span className="text-[9px] text-gray-500 max-w-[72px] truncate">
                    {cell.isHome ? 'vs ' : '@ '}
                    {cell.opponentName}
                  </span>
                )}
              </div>
            </td>
          );
        })}
        <td className="p-3 text-right">
          {team.coach ? (
            <CoachMenu open={coachOpen} onToggle={() => setCoachOpen((v) => !v)} />
          ) : (
            <span className="text-[11px] font-bold text-rose-400">No coach</span>
          )}
        </td>
      </tr>
      {coachOpen && team.coach && (
        <tr className="bg-[#141414]">
          <td colSpan={colSpan} className="px-6 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Coach details</div>
                <div className="font-extrabold text-white">{team.coach.name}</div>
              </div>
              <div className="text-gray-300">
                <span className="text-gray-500">Email </span>
                <span className="font-mono text-gray-100">{team.coach.email || '—'}</span>
              </div>
              <div className="text-gray-300">
                <span className="text-gray-500">Team </span>
                <span className="font-bold text-white">{team.name}</span>
              </div>
              <div className="text-gray-300">
                <span className="text-gray-500">League </span>
                <span className="font-bold text-emerald-400">{team.leagueName}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const AdminCacheAnalysisModal: React.FC<AdminCacheAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [option, setOption] = useState<CacheOption | null>(null);
  const { leagues, isLoading, isRefreshing, error, updatedAt, reload } = useCacheAnalysisData(isOpen, option);

  if (!isOpen) return null;

  const active = OPTIONS.find((item) => item.id === option) || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-[#2A2A2A] bg-[#141414] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <Database className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Cache Analysis</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                Finished matches, written from the database
                {updatedAt ? ` · updated ${updatedAt}` : ''}
                {isRefreshing ? ' · syncing' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => reload()}
              disabled={isLoading || isRefreshing}
              className="p-2 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Reload from database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-gray-400 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {OPTIONS.map((item) => {
              const Icon = item.icon;
              const selected = option === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOption(item.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selected
                      ? 'bg-[#1f2e24] border-emerald-500/60'
                      : 'bg-[#111111] border-[#2A2A2A] hover:border-emerald-500/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <div className="mt-2 text-xs font-extrabold text-white">{item.label}</div>
                  <div className="mt-0.5 text-[10px] text-gray-400 leading-snug">{item.hint}</div>
                </button>
              );
            })}
          </div>

          {!option && (
            <p className="text-xs text-gray-400 text-center py-8">
              Choose kits, match squad, match events, or team logo. Each option opens its own league tables.
            </p>
          )}

          {option && isLoading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
              <span className="text-sm font-bold text-gray-300">Loading {active?.label.toLowerCase()} from the database...</span>
            </div>
          )}

          {option && error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => reload()}
                className="ml-auto px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {option && !isLoading && !error && leagues.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-10">No league teams found in the database.</p>
          )}

          {option && !isLoading && leagues.map((league) => (
            <LeagueTable key={league.id} league={league} option={option} />
          ))}
        </div>
      </div>
    </div>
  );
};
