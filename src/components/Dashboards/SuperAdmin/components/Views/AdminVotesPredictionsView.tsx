import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { EPL_COMPETITION_ID, weekendDates } from '../../../../../lib/predictions/weekendSlate';
import { showVotesForConsensus } from '../../../../../lib/predictions/voteDisplay.mjs';

interface TeamEmbed {
  name?: string | null;
  short_name?: string | null;
}

interface FixtureRow {
  id: string;
  matchday: number | null;
  scheduled_time: string;
  status: string | null;
  home_team: TeamEmbed | TeamEmbed[] | null;
  away_team: TeamEmbed | TeamEmbed[] | null;
}

interface CacheRow {
  match_id: string;
  votes_home: number | null;
  votes_draw: number | null;
  votes_away: number | null;
  total_votes: number | null;
  home_pct: number | null;
  draw_pct: number | null;
  away_pct: number | null;
}

export interface WeekendVoteMatch {
  id: string;
  matchday: number;
  dayLabel: 'Saturday' | 'Sunday';
  kickoff: string;
  homeName: string;
  awayName: string;
  shown: { home: number; draw: number; away: number };
  actual: { home: number; draw: number; away: number };
}

const countOf = (value: number | null | undefined) => Math.max(0, Math.round(Number(value) || 0));

function teamLabel(value: TeamEmbed | TeamEmbed[] | null): string {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name || row?.short_name || 'TBC';
}

function dateKey(iso: string): string {
  return String(iso || '').slice(0, 10);
}

function dayLabel(key: string): 'Saturday' | 'Sunday' {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, (month || 1) - 1, day || 1)).getUTCDay();
  return weekday === 0 ? 'Sunday' : 'Saturday';
}

function nextUtcDate(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + 1));
  return next.toISOString().slice(0, 10);
}

function nairobiKickoff(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(parsed);
}

function toVoteMatch(fixture: FixtureRow, cache: CacheRow | undefined): WeekendVoteMatch {
  const actual = {
    home: countOf(cache?.votes_home),
    draw: countOf(cache?.votes_draw),
    away: countOf(cache?.votes_away),
  };
  const shown = showVotesForConsensus(
    {
      matchId: fixture.id,
      homePct: countOf(cache?.home_pct),
      drawPct: countOf(cache?.draw_pct),
      awayPct: countOf(cache?.away_pct),
      totalVotes: countOf(cache?.total_votes),
      pulseLabel: '',
    },
    fixture.id,
  );

  return {
    id: fixture.id,
    matchday: fixture.matchday || 0,
    dayLabel: dayLabel(dateKey(fixture.scheduled_time)),
    kickoff: nairobiKickoff(fixture.scheduled_time),
    homeName: teamLabel(fixture.home_team),
    awayName: teamLabel(fixture.away_team),
    shown: { home: shown.homeVotes, draw: shown.drawVotes, away: shown.awayVotes },
    actual,
  };
}

async function weekendBounds(): Promise<{ saturday: string; sunday: string } | null> {
  try {
    const { data, error } = await supabase.rpc('get_next_epl_weekend');
    if (!error && data) {
      const saturday = String(data.saturday || '').slice(0, 10);
      const sunday = String(data.sunday || '').slice(0, 10);
      if (saturday && sunday) return { saturday, sunday };
    }
  } catch {
    // Fall through to the same calendar weekend the prediction page uses.
  }
  const fallback = weekendDates();
  if (!fallback.saturday || !fallback.sunday) return null;
  return fallback;
}

/** One read of the upcoming Saturday and Sunday slate, plus the stored tallies for those matches. */
export async function loadWeekendVoteBoard(): Promise<{
  saturday: string;
  sunday: string;
  matches: WeekendVoteMatch[];
}> {
  const bounds = await weekendBounds();
  if (!bounds) return { saturday: '', sunday: '', matches: [] };

  const { data: fixtures, error: fixtureError } = await supabase
    .from('fixtures')
    .select(`
      id,
      matchday,
      scheduled_time,
      status,
      home_team:teams!fixtures_home_team_id_fkey(name, short_name),
      away_team:teams!fixtures_away_team_id_fkey(name, short_name)
    `)
    .eq('competition_id', EPL_COMPETITION_ID)
    .gte('scheduled_time', `${bounds.saturday}T00:00:00.000Z`)
    .lt('scheduled_time', `${nextUtcDate(bounds.sunday)}T00:00:00.000Z`)
    .neq('status', 'CANCELLED')
    .order('scheduled_time', { ascending: true })
    .limit(18);

  if (fixtureError) throw new Error(fixtureError.message);

  const rows = (fixtures || []) as FixtureRow[];
  const ids = rows.map((row) => row.id).filter(Boolean);
  const cacheByMatch = new Map<string, CacheRow>();

  if (ids.length > 0) {
    const { data: cacheRows, error: cacheError } = await supabase
      .from('match_consensus_cache')
      .select('match_id, votes_home, votes_draw, votes_away, total_votes, home_pct, draw_pct, away_pct')
      .in('match_id', ids);

    if (cacheError) throw new Error(cacheError.message);
    (cacheRows || []).forEach((row: CacheRow) => {
      if (row.match_id) cacheByMatch.set(row.match_id, row);
    });
  }

  return {
    saturday: bounds.saturday,
    sunday: bounds.sunday,
    matches: rows.map((row) => toVoteMatch(row, cacheByMatch.get(row.id))),
  };
}

function VoteCard({
  matchId,
  option,
  caption,
  shown,
  actual,
}: {
  matchId: string;
  option: '1' | 'X' | '2';
  caption: string;
  shown: number;
  actual: number;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#121212] px-3 py-2.5">
      <div className="text-[11px] font-black uppercase tracking-wider text-white">
        {option} <span className="font-semibold text-gray-500">{caption}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div
            data-testid={`shown-${matchId}-${option}`}
            className="text-xl font-black leading-none text-[#00b04f]"
          >
            {shown}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#00b04f]">Shown</div>
        </div>
        <div className="text-right">
          <div
            data-testid={`actual-${matchId}-${option}`}
            className="text-xl font-black leading-none text-red-500"
          >
            {actual}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-red-400">Actual</div>
        </div>
      </div>
    </div>
  );
}

export const AdminVotesPredictionsView: React.FC = () => {
  const [matches, setMatches] = useState<WeekendVoteMatch[]>([]);
  const [saturday, setSaturday] = useState('');
  const [sunday, setSunday] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshTable = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const board = await loadWeekendVoteBoard();
      setSaturday(board.saturday);
      setSunday(board.sunday);
      setMatches(board.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read weekend votes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTable();
  }, [refreshTable]);

  return (
    <section data-testid="votes-predictions-panel" className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-sky-300" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Votes & Predictions
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            {saturday && sunday
              ? `Saturday ${saturday} and Sunday ${sunday}`
              : 'Upcoming Saturday and Sunday'}
            {matches.length > 0 ? ` · ${matches.length} matches` : ''}
          </p>
          <p className="text-[11px] text-gray-500">
            Green is the count shown on the prediction page. Red is every vote recorded for that result.
          </p>
        </div>
        <button
          type="button"
          data-testid="votes-predictions-refresh"
          onClick={() => { void refreshTable(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-sky-500/40 bg-[#1a1a1a] px-3.5 py-2 text-xs font-bold text-sky-300 transition-colors hover:bg-[#222] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div
        data-testid="votes-predictions-table"
        data-state={loading ? 'loading' : 'ready'}
        className="space-y-3 rounded-2xl border border-[#262626] bg-[#141414] p-3"
      >
        {error && (
          <p data-testid="votes-predictions-error" className="px-2 text-xs font-medium text-red-400">
            {error}
          </p>
        )}

        {!loading && matches.length === 0 && !error && (
          <p className="px-2 py-6 text-center text-xs text-gray-400">
            No Saturday or Sunday matches are stored for this weekend.
          </p>
        )}

        {matches.map((match) => (
          <article
            key={match.id}
            data-testid="weekend-vote-match"
            data-match-id={match.id}
            className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-3"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-black text-white">
                  {match.homeName} <span className="font-semibold text-gray-500">vs</span> {match.awayName}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-gray-400">
                  {match.dayLabel}
                  {match.matchday ? ` · Matchday ${match.matchday}` : ''}
                  {match.kickoff ? ` · ${match.kickoff}` : ''}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <VoteCard matchId={match.id} option="1" caption={match.homeName} shown={match.shown.home} actual={match.actual.home} />
              <VoteCard matchId={match.id} option="X" caption="Draw" shown={match.shown.draw} actual={match.actual.draw} />
              <VoteCard matchId={match.id} option="2" caption={match.awayName} shown={match.shown.away} actual={match.actual.away} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
