import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Shirt,
  Users,
  ScrollText,
  Image as ImageIcon,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import {
  summarizePreparedness,
  useCacheAnalysisData,
  type CacheOption,
  type KitFlags,
  type PreparednessLeague,
  type PreparednessTeam,
} from '../../hooks/useCacheAnalysisData';

interface AdminCacheAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OPTIONS: {
  id: CacheOption;
  label: string;
  coachCard: string;
  hint: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: 'kits',
    label: 'Team Kits',
    coachCard: 'Upload Player Kits',
    hint: 'Kit 1, Kit 2, Kit 3, and the goalkeeper kit',
    icon: Shirt,
    color: 'text-emerald-400',
  },
  {
    id: 'squad',
    label: 'Match Details',
    coachCard: 'Arrange Match Squad',
    hint: 'Only the starting players the coach saved for that match',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    id: 'events',
    label: 'Match Log',
    coachCard: 'Update Match Events',
    hint: 'Only scorers and assists the coach selected',
    icon: ScrollText,
    color: 'text-amber-400',
  },
  {
    id: 'logo',
    label: 'Team Logo',
    coachCard: 'Edit Team Details',
    hint: 'One tick when the crest is uploaded',
    icon: ImageIcon,
    color: 'text-rose-400',
  },
];

const KIT_COLUMNS: { key: keyof KitFlags; label: string }[] = [
  { key: 'kit1', label: 'Kit 1' },
  { key: 'kit2', label: 'Kit 2' },
  { key: 'kit3', label: 'Kit 3' },
  { key: 'gk', label: 'GK' },
];

const Tick = ({ title }: { title: string }) => (
  <span
    title={title}
    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-black text-[11px] leading-none"
  >
    ✓
  </span>
);

const Cross = ({ title }: { title: string }) => (
  <span
    title={title}
    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/40 font-black text-[11px] leading-none"
  >
    ✗
  </span>
);

const Dash = ({ title }: { title: string }) => (
  <span title={title} className="text-[11px] text-gray-600 font-bold">
    —
  </span>
);

const Mark = ({ on, yes, no }: { on: boolean; yes: string; no: string }) =>
  on ? <Tick title={yes} /> : <Cross title={no} />;

const TeamIdentity = ({ team, note }: { team: PreparednessTeam; note: string }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    {team.logoUrl ? (
      <img
        src={team.logoUrl}
        alt=""
        className="w-8 h-8 rounded-full object-cover border border-[#333333] bg-slate-800 shrink-0"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
        {team.name.slice(0, 2).toUpperCase()}
      </div>
    )}
    <div className="min-w-0">
      <div className="font-extrabold text-white text-xs truncate">{team.name}</div>
      <div className="text-[10px] text-gray-500 font-medium truncate">{note}</div>
    </div>
  </div>
);

const CoachMenu = ({
  team,
  open,
  onToggle,
}: {
  team: PreparednessTeam;
  open: boolean;
  onToggle: () => void;
}) => {
  if (!team.coach) {
    return <span className="text-[11px] font-bold text-rose-400">No coach</span>;
  }

  return (
    <div className="inline-block text-left">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-xs font-bold text-gray-200 hover:text-white transition-all cursor-pointer"
        aria-expanded={open}
      >
        Coach
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

const CoachPanel = ({ team, colSpan }: { team: PreparednessTeam; colSpan: number }) => {
  if (!team.coach) return null;
  const fields = [
    { label: 'Name', value: team.coach.name || 'Not on file', icon: UserRound },
    { label: 'Email', value: team.coach.email || 'Not on file', icon: Mail },
    { label: 'Phone', value: team.coach.phone || 'Not on file', icon: Phone },
  ];

  return (
    <tr className="bg-[#121212]">
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="rounded-xl border border-[#2E2E2E] bg-[#181818] p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
            Coach details · {team.name}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="rounded-lg bg-[#111111] border border-[#2A2A2A] px-3 py-2 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    <Icon className="w-3 h-3" />
                    {field.label}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-white truncate">{field.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );
};

const CoachFiling = ({
  team,
  option,
  colSpan,
}: {
  team: PreparednessTeam;
  option: CacheOption;
  colSpan: number;
}) => {
  const filed = Object.entries(team.cells)
    .map(([matchday, cell]) => {
      const lines = option === 'squad' ? cell.squadNames : cell.eventLines;
      if (!lines || lines.length === 0) return null;
      return {
        matchday,
        where: `${cell.isHome ? 'vs' : '@'} ${cell.opponentName}`,
        lines,
      };
    })
    .filter((row): row is { matchday: string; where: string; lines: string[] } => Boolean(row));

  if (filed.length === 0) return null;

  return (
    <tr className="bg-[#101010]">
      <td colSpan={colSpan} className="px-4 py-2 border-b border-[#242424]">
        <div className="space-y-1">
          {filed.map((row) => (
            <p key={row.matchday} className="text-[11px] text-gray-300 leading-snug">
              <span className="font-black text-white">MD {row.matchday}</span>
              <span className="text-gray-500"> {row.where}: </span>
              {row.lines.join(' · ')}
            </p>
          ))}
        </div>
      </td>
    </tr>
  );
};

const teamNote = (team: PreparednessTeam, option: CacheOption) => {
  if (option === 'kits') {
    const filed = KIT_COLUMNS.filter((column) => team.kits[column.key]).length;
    return `${filed} of 4 kits`;
  }
  if (option === 'logo') return team.hasLogo ? 'Crest uploaded' : 'Crest missing';
  const cells = Object.values(team.cells);
  if (cells.length === 0) return 'No fixture yet';
  const filed = cells.filter((cell) => (option === 'squad' ? cell.squad : cell.events)).length;
  return `${filed} of ${cells.length} filed`;
};

const LeagueTable = ({ league, option }: { league: PreparednessLeague; option: CacheOption }) => {
  const [openCoachId, setOpenCoachId] = useState<string | null>(null);
  const isMatch = option === 'squad' || option === 'events';
  const dataColumns = isMatch ? league.matchdays.length : option === 'kits' ? KIT_COLUMNS.length : 1;
  const colSpan = 2 + dataColumns;

  useEffect(() => {
    setOpenCoachId(null);
  }, [option, league.id]);

  return (
    <section className="rounded-2xl border border-[#2A2A2A] bg-[#121212] overflow-hidden">
      <header className="px-4 py-3 border-b border-[#2A2A2A] flex flex-wrap items-center justify-between gap-3 bg-[#161616]">
        <div>
          <h3 className="text-sm font-extrabold text-white">{league.name}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {league.teams.length} clubs
            {isMatch && league.matchdayTo > 0 ? ` · Matchday 1 to ${league.matchdayTo}` : ''}
          </p>
        </div>
        {isMatch && (
          <div className="px-3 py-1.5 rounded-full bg-[#111111] border border-[#2A2A2A] text-[11px] font-bold text-gray-200">
            {league.matchdayTo > 0 ? `${league.matchdayTo} matchday${league.matchdayTo === 1 ? '' : 's'}` : 'No matchdays'}
          </div>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[640px] border-separate border-spacing-0">
          <thead className="text-gray-400 uppercase text-[10px] font-extrabold tracking-wider">
            <tr>
              <th className="p-3 min-w-[220px] sticky left-0 z-10 bg-[#101010] border-b border-[#242424]">Team</th>
              {option === 'kits' &&
                KIT_COLUMNS.map((column) => (
                  <th key={column.key} className="p-3 text-center whitespace-nowrap bg-[#101010] border-b border-[#242424]">
                    {column.label}
                  </th>
                ))}
              {option === 'logo' && <th className="p-3 text-center bg-[#101010] border-b border-[#242424]">Logo</th>}
              {isMatch &&
                league.matchdays.map((matchday) => (
                  <th key={matchday} className="p-2 text-center w-10 bg-[#101010] border-b border-[#242424]" title={`Matchday ${matchday}`}>
                    {matchday}
                  </th>
                ))}
              <th className="p-3 text-right sticky right-0 z-10 bg-[#101010] border-b border-[#242424]">Coach</th>
            </tr>
          </thead>
          <tbody>
            {league.teams.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-8 text-center text-xs text-gray-400">
                  No teams in this league.
                </td>
              </tr>
            ) : (
              league.teams.map((team) => (
                <React.Fragment key={team.id}>
                  <tr className="group">
                    <td className="p-3 sticky left-0 z-10 bg-[#161616] group-hover:bg-[#1C1C1C] border-b border-[#242424]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold shrink-0 ${
                            team.hasCoach
                              ? 'bg-[#2A2A2A] text-gray-300'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500'
                          }`}
                          title={team.hasCoach ? 'Coach assigned' : 'No coach assigned'}
                        >
                          {team.index}
                        </span>
                        <TeamIdentity team={team} note={teamNote(team, option)} />
                      </div>
                    </td>
                    {option === 'kits' &&
                      KIT_COLUMNS.map((column) => (
                        <td key={column.key} className="p-3 text-center bg-[#161616] group-hover:bg-[#1C1C1C] border-b border-[#242424]">
                          <Mark
                            on={team.kits[column.key]}
                            yes={`${column.label} uploaded`}
                            no={`${column.label} not uploaded`}
                          />
                        </td>
                      ))}
                    {option === 'logo' && (
                      <td className="p-3 text-center bg-[#161616] group-hover:bg-[#1C1C1C] border-b border-[#242424]">
                        <Mark on={team.hasLogo} yes="Logo uploaded" no="Logo not uploaded" />
                      </td>
                    )}
                    {isMatch &&
                      league.matchdays.map((matchday) => {
                        const cell = team.cells[matchday];
                        const filed = cell ? (option === 'squad' ? cell.squad : cell.events) : false;
                        const where = cell ? `${cell.isHome ? 'vs' : '@'} ${cell.opponentName}` : '';
                        const lines = cell ? (option === 'squad' ? cell.squadNames : cell.eventLines) : [];
                        const detail = lines.length > 0 ? lines.join(' · ') : '';
                        return (
                          <td key={matchday} className="p-1.5 text-center bg-[#161616] group-hover:bg-[#1C1C1C] border-b border-[#242424]">
                            {!cell ? (
                              <Dash title={`Matchday ${matchday} — no fixture`} />
                            ) : (
                              <Mark
                                on={filed}
                                yes={detail ? `MD ${matchday} ${where}: ${detail}` : `Matchday ${matchday} ${where}`}
                                no={`Matchday ${matchday} ${where} — coach has not filed this`}
                              />
                            )}
                          </td>
                        );
                      })}
                    <td className="p-3 text-right sticky right-0 z-10 bg-[#161616] group-hover:bg-[#1C1C1C] border-b border-[#242424]">
                      <CoachMenu
                        team={team}
                        open={openCoachId === team.id}
                        onToggle={() => setOpenCoachId((current) => (current === team.id ? null : team.id))}
                      />
                    </td>
                  </tr>
                  {isMatch && <CoachFiling team={team} option={option} colSpan={colSpan} />}
                  {openCoachId === team.id && <CoachPanel team={team} colSpan={colSpan} />}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const AdminCacheAnalysisModal: React.FC<AdminCacheAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [option, setOption] = useState<CacheOption | null>(null);
  const { leagues, isLoading, isRefreshing, error, updatedAt, reload } = useCacheAnalysisData(isOpen);
  const summary = useMemo(
    () => (option ? summarizePreparedness(leagues, option) : null),
    [leagues, option],
  );
  const active = OPTIONS.find((item) => item.id === option) || null;
  const progress = summary && summary.expected > 0 ? Math.round((summary.filed / summary.expected) * 100) : 0;

  useEffect(() => {
    if (!isOpen) setOption(null);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A2A2A] bg-[#141414] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <ClipboardCheck className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Team Preparedness</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                Coach command center
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

        <div className="px-5 pt-4 pb-3 shrink-0 border-b border-[#222222] bg-[#161616]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {OPTIONS.map((item) => {
              const Icon = item.icon;
              const selected = option === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOption(item.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selected
                      ? 'bg-[#1f2e24] border-emerald-500/70 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
                      : 'bg-[#111111] border-[#2A2A2A] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{item.coachCard}</span>
                  </div>
                  <div className="mt-2 text-xs font-extrabold text-white">{item.label}</div>
                  <div className="mt-0.5 text-[10px] text-gray-400 leading-snug">{item.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!option && (
            <div className="rounded-2xl border border-dashed border-[#333333] bg-[#141414] px-6 py-12 text-center">
              <p className="text-sm font-bold text-white">Choose one coach action</p>
              <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                Each button opens its own table for both leagues. Kits, match details, the match log, and the logo stay separate.
              </p>
            </div>
          )}

          {option && summary && !isLoading && (
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">{active?.label}</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">{summary.headline}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{summary.detail}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white font-mono">{progress}%</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Filed</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 font-medium pt-1">
                <span><span className="text-emerald-400 font-bold">✓</span> Filed by the coach</span>
                <span><span className="text-rose-400 font-bold">✗</span> Not filed</span>
                {(option === 'squad' || option === 'events') && <span><span className="text-gray-500 font-bold">—</span> No fixture that matchday</span>}
              </div>
            </div>
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

          {option && !isLoading && !error && (
            <div className="space-y-5">
              {leagues.map((league) => (
                <LeagueTable key={league.id} league={league} option={option} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
