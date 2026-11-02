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

const DEFAULT_SUPABASE_URL = 'https://tdfiodqlzptaruhivapj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_R8MgdxmLXhHdmcE8cwJADw_aLIplyk6';

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

export async function supabaseGet(path) {
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
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

export async function loadProductShare(productId) {
  if (!productId) return null;
  const cleanId = String(productId).trim();
  const select = encodeURIComponent(
    'id,sku,name,price,original_price,rating,review_count,badge,audience,is_new,category_id,categories(name,slug),product_images(image_path,is_primary,display_order)'
  );

  let rows = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
    rows = await supabaseGet(`products?id=eq.${cleanId}&select=${select}&limit=1`);
  } else {
    rows = await supabaseGet(`products?sku=eq.${cleanId}&select=${select}&limit=1`);
    if (!rows || rows.length === 0) {
      rows = await supabaseGet(`products?id=eq.${cleanId}&select=${select}&limit=1`);
    }
  }

  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!row) return null;

  const images = (row.product_images || [])
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map((img) => img.image_path);
  const primaryImage = (row.product_images || []).find((img) => img.is_primary)?.image_path
    || images[0]
    || 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80';

  const categoryName = (Array.isArray(row.categories) ? row.categories[0] : row.categories)?.name || 'Equipment';

  return {
    id: row.sku || row.id,
    uid: row.id,
    sku: row.sku || row.id,
    name: row.name,
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : null,
    rating: Number(row.rating) || 5.0,
    reviewCount: Number(row.review_count) || 38,
    badge: row.badge || (row.is_new ? 'NEW ARRIVAL' : 'Official Match Grade'),
    audience: row.audience || 'team',
    category: categoryName,
    image: primaryImage,
  };
}

export async function loadBanterShare(banterId) {
  if (!banterId) return null;
  const cleanId = String(banterId).trim().replace(/^post-seed-/, '').replace(/^temp-/, '');
  const select = encodeURIComponent('id,content,author_handle,author_badge,created_at');

  let rows = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
    rows = await supabaseGet(`banter_posts?id=eq.${cleanId}&select=${select}&limit=1`);
  } else {
    rows = await supabaseGet(`banter_posts?id=ilike.*${cleanId}*&select=${select}&limit=1`);
  }

  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!row) {
    return {
      id: cleanId,
      content: 'Official Matchday Banter and Discussion on EgerScore',
      authorName: 'EgerScore Banter',
      authorHandle: '@EgerScore',
      authorBadge: '',
      image: null,
    };
  }

  return {
    id: row.id,
    content: row.content || '',
    authorName: row.author_handle || 'Fanatic',
    authorHandle: row.author_handle || '@fan',
    authorBadge: row.author_badge || '',
    image: null,
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
