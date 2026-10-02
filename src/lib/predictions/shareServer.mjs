import { derbyCard } from './shareCard.mjs';
import { showVotesForConsensus } from './voteDisplay.mjs';

const PICK_MAP = {
  home: '1',
  draw: 'X',
  away: '2',
  '1': '1',
  x: 'X',
  '2': '2',
};

export function normalizeFixtureId(value) {
  const raw = String(value || '').toLowerCase().replace(/[^0-9a-f-]/g, '');
  if (/^[0-9a-f]{32}$/.test(raw)) {
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(raw)
    ? raw
    : null;
}

export function normalizePick(value) {
  return PICK_MAP[String(value || '').toLowerCase()] || null;
}

async function supabaseGet(path) {
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!base || !key) return null;
  const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function loadPredictionShare(matchValue, pickValue) {
  const matchId = normalizeFixtureId(matchValue);
  const pick = normalizePick(pickValue);
  if (!matchId || !pick) return null;

  const fixtureSelect = encodeURIComponent(
    'id,scheduled_time,venue,home_team:teams!fixtures_home_team_id_fkey(id,name,logo_url),away_team:teams!fixtures_away_team_id_fkey(id,name,logo_url)',
  );
  const fixtures = await supabaseGet(`fixtures?id=eq.${matchId}&select=${fixtureSelect}&limit=1`);
  const fixture = Array.isArray(fixtures) ? fixtures[0] : null;
  if (!fixture?.home_team || !fixture?.away_team) return null;

  const rows = await supabaseGet(
    `match_consensus_cache?match_id=eq.${matchId}&select=match_id,home_pct,draw_pct,away_pct,total_votes&limit=1`,
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  const consensus = {
    matchId,
    homePct: Number(row?.home_pct) || 0,
    drawPct: Number(row?.draw_pct) || 0,
    awayPct: Number(row?.away_pct) || 0,
    totalVotes: Number(row?.total_votes) || 0,
  };
  const shown = showVotesForConsensus(consensus, matchId, pick);
  const home = fixture.home_team.name;
  const away = fixture.away_team.name;
  const selected = pick === '1' ? home : pick === '2' ? away : 'Draw';
  const selectedVotes = pick === '1' ? shown.homeVotes : pick === '2' ? shown.awayVotes : shown.drawVotes;
  const opponent = pick === '1' ? away : pick === '2' ? home : 'Both teams';
  const leading = selectedVotes >= Math.max(shown.homeVotes, shown.drawVotes, shown.awayVotes);

  return {
    matchId,
    pick,
    card: derbyCard({
      home,
      away,
      homeLogo: fixture.home_team.logo_url,
      awayLogo: fixture.away_team.logo_url,
      pick: selected,
      call: leading
        ? `${opponent} will catch up soon. Invite others to uplift ${selected}.`
        : `You need to invite more people to uplift ${selected}.`,
      stake: `${Math.max(0, selectedVotes - 1).toLocaleString()} other fanatics made this choice.`,
      homeVotes: shown.homeVotes,
      drawVotes: shown.drawVotes,
      awayVotes: shown.awayVotes,
      others: [],
    }),
  };
}

export function predictionDestination(origin, matchId) {
  return `${origin}/?view=picks&match=${encodeURIComponent(matchId)}#/news`;
}

export async function loadShareCode(code) {
  const safe = String(code || '').replace(/[^a-zA-Z0-9]/g, '');
  if (safe.length < 6 || safe.length > 12) return null;
  const rows = await supabaseGet(
    `prediction_share_links?code=eq.${safe}&select=code,kind,card&limit=1`,
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row?.card || (row.card.k !== 'derby' && row.card.k !== 'slip' && row.card.k !== 'talk')) return null;
  return { code: row.code, kind: row.kind, card: row.card };
}
