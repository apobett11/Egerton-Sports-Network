import React from 'react';
import { ImageResponse } from '@vercel/og';
import { decodeShareCard } from '../src/lib/predictions/shareCard.mjs';
import { loadPredictionShare, loadShareCode } from '../src/lib/predictions/shareServer.mjs';

const h = React.createElement;

const colors = {
  bg: '#081018',
  card: '#0e1c2b',
  line: '#29435d',
  text: '#f8fafc',
  muted: '#9fb0c2',
  red: '#ff0046',
  green: '#00b04f',
  amber: '#ff9800',
};

function logo(src, name) {
  return h(
    'div',
    {
      style: {
        width: 92,
        height: 92,
        borderRadius: 999,
        border: `3px solid ${colors.line}`,
        background: '#15273b',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    src
      ? h('img', { src, width: 92, height: 92, style: { objectFit: 'cover' } })
      : h('span', { style: { color: colors.text, fontSize: 26 } }, name.slice(0, 3).toUpperCase()),
  );
}

function range(label, value, background, selected) {
  return h(
    'div',
    {
      style: {
        flex: Math.max(value, 20),
        minWidth: 0,
        height: 84,
        borderRadius: 24,
        border: selected ? '4px solid #ffffff' : `2px solid ${colors.line}`,
        background,
        color: selected && background === colors.amber ? '#081018' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    h('span', { style: { fontSize: 27, fontWeight: 700 } }, Number(value).toLocaleString()),
    h('span', { style: { fontSize: 16, opacity: 0.9 } }, label),
  );
}

function derby(card) {
  const selectedHome = card.pick === card.home;
  const selectedAway = card.pick === card.away;
  const selectedDraw = card.pick === 'Draw';
  return h(
    'div',
    { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: 24 } },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 22, width: 430 } },
        logo(card.homeLogo, card.home),
        h('span', { style: { fontSize: 34, fontWeight: 650 } }, card.home),
      ),
      h('span', { style: { color: colors.amber, fontSize: 25, fontWeight: 700 } }, 'VS'),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 22, width: 430 } },
        h('span', { style: { fontSize: 34, fontWeight: 650, textAlign: 'right' } }, card.away),
        logo(card.awayLogo, card.away),
      ),
    ),
    h(
      'div',
      { style: { display: 'flex', gap: 14, width: '100%' } },
      range(card.home, card.homeVotes, colors.green, selectedHome),
      range('Draw', card.drawVotes, colors.amber, selectedDraw),
      range(card.away, card.awayVotes, colors.red, selectedAway),
    ),
    h(
      'div',
      {
        style: {
          borderRadius: 28,
          border: `2px solid ${colors.line}`,
          background: '#122336',
          padding: '22px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        },
      },
      h('span', { style: { color: '#ffd07a', fontSize: 21 } }, `You chose ${card.pick}`),
      h('span', { style: { color: colors.text, fontSize: 27, fontWeight: 550 } }, card.call),
      h('span', { style: { color: colors.muted, fontSize: 18 } }, card.stake),
    ),
  );
}

function slip(card) {
  return h(
    'div',
    { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10 } },
    ...card.rows.slice(0, 6).map((row, index) =>
      h(
        'div',
        {
          key: `${row.match}-${index}`,
          style: {
            height: 60,
            borderRadius: 20,
            border: `2px solid ${row.isDerby ? colors.amber : colors.line}`,
            background: row.selected ? '#13283d' : '#0a1624',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 12 } },
          row.isDerby
            ? h('span', { style: { color: colors.amber, fontSize: 15, fontWeight: 700 } }, 'DERBY')
            : null,
          h('span', { style: { color: colors.text, fontSize: 22 } }, row.match),
        ),
        h(
          'span',
          { style: { color: row.selected ? '#ffffff' : colors.muted, fontSize: 19 } },
          row.selected ? row.pick : 'Not selected',
        ),
      ),
    ),
  );
}

function fallbackCard() {
  return h('div', { style: { fontSize: 48, fontWeight: 650 } }, 'Make your EPL predictions');
}

async function supabaseRows(path) {
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!base || !key) return [];
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function crest(src, name) {
  return h(
    'div',
    {
      style: {
        width: 54,
        height: 54,
        borderRadius: 999,
        overflow: 'hidden',
        background: '#ff0046',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 700,
      },
    },
    src
      ? h('img', { src, width: 54, height: 54, style: { objectFit: 'cover' } })
      : (name || 'E').slice(0, 2).toUpperCase(),
  );
}

function boardRow(left, right, logo) {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: colors.card,
        borderRadius: 16,
        padding: '10px 16px',
        marginBottom: 10,
      },
    },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } }, crest(logo, left), h('span', { style: { fontSize: 28, fontWeight: 700 } }, left)),
    h('span', { style: { color: colors.green, fontSize: 28, fontWeight: 800 } }, right),
  );
}

async function tableRows() {
  const teams = await supabaseRows('teams?select=id,name,logo_url&competition_id=eq.11111111-1111-1111-1111-111111111111');
  const fixtures = await supabaseRows('fixtures?select=home_team_id,away_team_id,score_home,score_away,status&competition_id=eq.11111111-1111-1111-1111-111111111111&status=in.(FT,FINISHED,ft,finished)');
  const acc = new Map(teams.map((team) => [team.id, { name: team.name || 'Team', logo: team.logo_url || '', points: 0, clean: 0 }]));
  fixtures.forEach((fixture) => {
    const home = Number(fixture.score_home) || 0;
    const away = Number(fixture.score_away) || 0;
    const apply = (id, goalsFor, goalsAgainst) => {
      const row = acc.get(id);
      if (!row) return;
      if (goalsFor > goalsAgainst) row.points += 3;
      else if (goalsFor === goalsAgainst) row.points += 1;
      if (goalsAgainst === 0) row.clean += 1;
    };
    apply(fixture.home_team_id, home, away);
    apply(fixture.away_team_id, away, home);
  });
  return [...acc.values()]
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, 6)
    .map((row) => boardRow(row.name, `${row.points} pts`, row.logo));
}

async function fixtureRows() {
  const fixtures = await supabaseRows('fixtures?select=scheduled_time,status,score_home,score_away,home_team:teams!fixtures_home_team_id_fkey(name,logo_url),away_team:teams!fixtures_away_team_id_fkey(name,logo_url)&order=scheduled_time.desc&limit=6');
  return fixtures.map((fixture) => {
    const home = fixture.home_team?.name || 'Home';
    const away = fixture.away_team?.name || 'Away';
    const finished = ['FT', 'FINISHED'].includes(String(fixture.status || '').toUpperCase());
    const score = finished ? `${Number(fixture.score_home) || 0}-${Number(fixture.score_away) || 0}` : 'vs';
    return boardRow(`${home} ${score} ${away}`, '', fixture.home_team?.logo_url);
  });
}

function boardCard(title, rows) {
  const body = rows.length > 0 ? rows : [boardRow('Egerton Premier League', '', '')];
  return h(
    'div',
    { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: colors.bg, color: colors.text, padding: '36px 48px', fontFamily: 'Arial, sans-serif' } },
    h('div', { style: { color: colors.red, fontSize: 22, fontWeight: 800, letterSpacing: 2 } }, 'EGERSCORE'),
    h('div', { style: { fontSize: 48, fontWeight: 800, margin: '8px 0 18px' } }, title),
    h('div', { style: { display: 'flex', flexDirection: 'column' } }, ...body),
    h('div', { style: { marginTop: 'auto', color: colors.muted, fontSize: 22 } }, 'Tap to open the full list'),
  );
}

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const view = url.searchParams.get('view');
  if (view === 'table' || view === 'fixtures') {
    const rows = view === 'fixtures' ? await fixtureRows() : await tableRows();
    return new ImageResponse(boardCard(view === 'fixtures' ? 'Fixtures' : 'EPL Table', rows), {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400' },
    });
  }
  const token = url.searchParams.get('d') || '';
  const code = url.searchParams.get('c') || '';
  const stored = code ? await loadShareCode(code) : null;
  const shared = !stored && url.searchParams.get('m')
    ? await loadPredictionShare(url.searchParams.get('m'), url.searchParams.get('p'))
    : null;
  const card = stored?.card || shared?.card || decodeShareCard(code.length > 12 ? code : token);
  const title = card?.k === 'derby' ? 'MY DERBY PICK' : card?.k === 'slip' ? 'MY EPL TEAM SHEET' : 'EGERSCORE';

  const tree = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        padding: '44px 56px',
        background: colors.bg,
        color: colors.text,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      },
    },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 } },
      h('span', { style: { color: colors.red, fontSize: 25, fontWeight: 750, letterSpacing: 2 } }, title),
      h('span', { style: { color: colors.muted, fontSize: 19 } }, 'EgerScore · EPL Predictions'),
    ),
    card?.k === 'derby' ? derby(card) : card?.k === 'slip' ? slip(card) : fallbackCard(),
    h(
      'div',
      { style: { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('span', { style: { color: colors.muted, fontSize: 17 } }, 'Tap this card to make your picks'),
      h('span', { style: { color: colors.red, fontSize: 18, fontWeight: 700 } }, 'egerscore'),
    ),
  );

  return new ImageResponse(tree, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
