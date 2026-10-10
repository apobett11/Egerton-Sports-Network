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

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] || 'E') + (parts[1]?.[0] || parts[0]?.[1] || '');
  return letters.toUpperCase();
}

function crestColor(name) {
  let hash = 0;
  const str = String(name || '');
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  const palette = ['#ff0046', '#1565c0', '#00b04f', '#7c3aed', '#d97706', '#0f766e'];
  return palette[hash % palette.length];
}

function renderCrest(src, name, size = 42) {
  const bg = crestColor(name);
  const txt = initials(name);
  return h(
    'div',
    {
      style: {
        width: size,
        height: size,
        borderRadius: 999,
        border: '2.5px solid #29435d',
        background: bg,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      },
    },
    src && typeof src === 'string' && src.startsWith('http')
      ? h('img', {
          src,
          width: size,
          height: size,
          style: { width: size, height: size, objectFit: 'cover' },
        })
      : h(
          'span',
          {
            style: {
              color: '#ffffff',
              fontSize: Math.floor(size * 0.42),
              fontWeight: 800,
            },
          },
          txt,
        ),
  );
}

async function fetchTableData() {
  const teams = await supabaseRows('teams?select=id,name,logo_url&competition_id=eq.11111111-1111-1111-1111-111111111111');
  const fixtures = await supabaseRows('fixtures?select=home_team_id,away_team_id,score_home,score_away,status&competition_id=eq.11111111-1111-1111-1111-111111111111&status=in.(FT,FINISHED,ft,finished)');
  if (!teams || teams.length === 0) {
    return [
      { name: 'Egerton FC', played: 12, won: 9, drawn: 2, lost: 1, gd: '+18', points: 29, logo: '' },
      { name: 'Njoro City', played: 12, won: 8, drawn: 3, lost: 1, gd: '+14', points: 27, logo: '' },
      { name: 'Pavilion Warriors', played: 12, won: 7, drawn: 3, lost: 2, gd: '+10', points: 24, logo: '' },
      { name: 'Tatton Strikers', played: 12, won: 6, drawn: 3, lost: 3, gd: '+6', points: 21, logo: '' },
      { name: 'Ruwenzori FC', played: 12, won: 5, drawn: 4, lost: 3, gd: '+4', points: 19, logo: '' },
      { name: 'Riverbank United', played: 12, won: 4, drawn: 4, lost: 4, gd: '+1', points: 16, logo: '' },
    ];
  }
  const acc = new Map(
    teams.map((t) => [
      t.id,
      {
        name: t.name || 'Team',
        logo: t.logo_url || '',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      },
    ])
  );
  fixtures.forEach((f) => {
    const home = Number(f.score_home) || 0;
    const away = Number(f.score_away) || 0;
    const apply = (id, gf, ga) => {
      const row = acc.get(id);
      if (!row) return;
      row.played += 1;
      row.gf += gf;
      row.ga += ga;
      if (gf > ga) {
        row.won += 1;
        row.points += 3;
      } else if (gf === ga) {
        row.drawn += 1;
        row.points += 1;
      } else {
        row.lost += 1;
      }
      row.gd = row.gf - row.ga;
    };
    apply(f.home_team_id, home, away);
    apply(f.away_team_id, away, home);
  });
  return [...acc.values()]
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))
    .slice(0, 6)
    .map((r) => ({
      ...r,
      gd: r.gd > 0 ? `+${r.gd}` : String(r.gd),
    }));
}

async function fetchCleanSheetsData() {
  const teams = await supabaseRows('teams?select=id,name,logo_url&competition_id=eq.11111111-1111-1111-1111-111111111111');
  const fixtures = await supabaseRows('fixtures?select=home_team_id,away_team_id,score_home,score_away,status&competition_id=eq.11111111-1111-1111-1111-111111111111&status=in.(FT,FINISHED,ft,finished)');
  if (!teams || teams.length === 0) {
    return [
      { name: 'Egerton FC', clean: 7, points: 29, logo: '' },
      { name: 'Pavilion Warriors', clean: 6, points: 24, logo: '' },
      { name: 'Njoro City', clean: 5, points: 27, logo: '' },
      { name: 'Tatton Strikers', clean: 4, points: 21, logo: '' },
      { name: 'Ruwenzori FC', clean: 3, points: 19, logo: '' },
      { name: 'Riverbank United', clean: 3, points: 16, logo: '' },
    ];
  }
  const acc = new Map(
    teams.map((t) => [
      t.id,
      {
        name: t.name || 'Team',
        logo: t.logo_url || '',
        points: 0,
        clean: 0,
      },
    ])
  );
  fixtures.forEach((f) => {
    const home = Number(f.score_home) || 0;
    const away = Number(f.score_away) || 0;
    const apply = (id, gf, ga) => {
      const row = acc.get(id);
      if (!row) return;
      if (gf > ga) row.points += 3;
      else if (gf === ga) row.points += 1;
      if (ga === 0) row.clean += 1;
    };
    apply(f.home_team_id, home, away);
    apply(f.away_team_id, away, home);
  });
  return [...acc.values()]
    .sort((a, b) => b.clean - a.clean || b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, 6);
}

async function fetchFixturesData() {
  const fixtures = await supabaseRows(
    'fixtures?select=scheduled_time,status,score_home,score_away,venue,home_team:teams!fixtures_home_team_id_fkey(name,logo_url),away_team:teams!fixtures_away_team_id_fkey(name,logo_url)&order=scheduled_time.desc&limit=6'
  );
  if (!fixtures || fixtures.length === 0) {
    return [
      { home: 'Egerton FC', away: 'Pavilion Warriors', homeLogo: '', awayLogo: '', score: '2 - 1', time: 'FT', venue: 'PAVILION' },
      { home: 'Njoro City', away: 'Tatton Strikers', homeLogo: '', awayLogo: '', score: '1 - 1', time: 'FT', venue: 'NJORO' },
      { home: 'Ruwenzori FC', away: 'Riverbank United', homeLogo: '', awayLogo: '', score: 'VS', time: '15:00', venue: 'PAVILION' },
      { home: 'Egerton FC', away: 'Njoro City', homeLogo: '', awayLogo: '', score: 'VS', time: '17:00', venue: 'MAIN PITCH' },
      { home: 'Pavilion Warriors', away: 'Ruwenzori FC', homeLogo: '', awayLogo: '', score: 'VS', time: '19:00', venue: 'PAVILION' },
    ];
  }
  return fixtures.map((f) => {
    const home = f.home_team?.name || 'Home Team';
    const away = f.away_team?.name || 'Away Team';
    const status = String(f.status || '').toUpperCase();
    const isFinished = ['FT', 'FINISHED'].includes(status);
    const score = isFinished ? `${Number(f.score_home) || 0} - ${Number(f.score_away) || 0}` : 'VS';
    let timeText = '15:00';
    if (f.scheduled_time) {
      try {
        const d = new Date(f.scheduled_time);
        timeText = isFinished ? 'FT' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {}
    }
    return {
      home,
      away,
      homeLogo: f.home_team?.logo_url || '',
      awayLogo: f.away_team?.logo_url || '',
      score,
      time: timeText,
      venue: (f.venue || 'PAVILION').slice(0, 14).toUpperCase(),
    };
  });
}

function renderTableRow(row, index) {
  const isTop3 = index < 3;
  const isEven = index % 2 === 0;
  return h(
    'div',
    {
      key: `table-row-${index}`,
      style: {
        width: '100%',
        height: 66,
        background: isEven ? '#0e1c2b' : '#112236',
        borderBottom: '1px solid #172a3d',
        display: 'flex',
        alignItems: 'center',
        padding: '0 44px',
        position: 'relative',
      },
    },
    isTop3
      ? h('div', {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: '#00b04f',
          },
        })
      : null,
    h(
      'span',
      {
        style: {
          width: 50,
          textAlign: 'center',
          color: isTop3 ? '#00b04f' : '#64748b',
          fontSize: 20,
          fontWeight: 800,
        },
      },
      String(index + 1),
    ),
    h(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          paddingLeft: 16,
          overflow: 'hidden',
        },
      },
      renderCrest(row.logo, row.name, 42),
      h(
        'span',
        {
          style: {
            color: '#f8fafc',
            fontSize: 21,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },
        row.name,
      ),
    ),
    h('span', { style: { width: 68, textAlign: 'center', color: '#cbd5e1', fontSize: 18, fontWeight: 700 } }, String(row.played ?? 0)),
    h('span', { style: { width: 68, textAlign: 'center', color: '#cbd5e1', fontSize: 18, fontWeight: 700 } }, String(row.won ?? 0)),
    h('span', { style: { width: 68, textAlign: 'center', color: '#cbd5e1', fontSize: 18, fontWeight: 700 } }, String(row.drawn ?? 0)),
    h('span', { style: { width: 68, textAlign: 'center', color: '#cbd5e1', fontSize: 18, fontWeight: 700 } }, String(row.lost ?? 0)),
    h('span', { style: { width: 78, textAlign: 'center', color: '#94a3b8', fontSize: 18, fontWeight: 700 } }, String(row.gd ?? '+0')),
    h('span', { style: { width: 88, textAlign: 'center', color: '#ffffff', fontSize: 24, fontWeight: 900 } }, String(row.points ?? 0)),
  );
}

function renderCleanSheetRow(row, index) {
  const isTop3 = index < 3;
  const isEven = index % 2 === 0;
  return h(
    'div',
    {
      key: `cs-row-${index}`,
      style: {
        width: '100%',
        height: 66,
        background: isEven ? '#0e1c2b' : '#112236',
        borderBottom: '1px solid #172a3d',
        display: 'flex',
        alignItems: 'center',
        padding: '0 44px',
        position: 'relative',
      },
    },
    isTop3
      ? h('div', {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: '#a855f7',
          },
        })
      : null,
    h(
      'span',
      {
        style: {
          width: 60,
          textAlign: 'center',
          color: isTop3 ? '#a855f7' : '#64748b',
          fontSize: 20,
          fontWeight: 800,
        },
      },
      String(index + 1),
    ),
    h(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          paddingLeft: 16,
          overflow: 'hidden',
        },
      },
      renderCrest(row.logo, row.name, 42),
      h(
        'span',
        {
          style: {
            color: '#f8fafc',
            fontSize: 22,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },
        row.name,
      ),
    ),
    h(
      'span',
      {
        style: {
          width: 220,
          textAlign: 'center',
          color: '#a855f7',
          fontSize: 28,
          fontWeight: 900,
        },
      },
      `${row.clean ?? 0} CS`,
    ),
    h(
      'span',
      {
        style: {
          width: 100,
          textAlign: 'center',
          color: '#f8fafc',
          fontSize: 22,
          fontWeight: 900,
        },
      },
      String(row.points ?? 0),
    ),
  );
}

function renderFixtureRow(row, index) {
  const isEven = index % 2 === 0;
  const hasScore = /\d/.test(row.score);
  return h(
    'div',
    {
      key: `fixture-row-${index}`,
      style: {
        width: '100%',
        height: 66,
        background: isEven ? '#0e1c2b' : '#112236',
        borderBottom: '1px solid #172a3d',
        display: 'flex',
        alignItems: 'center',
        padding: '0 44px',
      },
    },
    h(
      'div',
      {
        style: {
          width: 140,
          height: 48,
          borderRadius: 8,
          background: '#14273d',
          border: '1.5px solid #223c5a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      h('span', { style: { color: '#f8fafc', fontSize: 16, fontWeight: 800 } }, row.time || '15:00'),
      h('span', { style: { color: '#64748b', fontSize: 10, fontWeight: 700 } }, row.venue || 'PAVILION'),
    ),
    h(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 20px',
        },
      },
      h(
        'div',
        {
          style: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          },
        },
        h(
          'span',
          {
            style: {
              color: '#f8fafc',
              fontSize: 20,
              fontWeight: 800,
              textAlign: 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          row.home,
        ),
        renderCrest(row.homeLogo, row.home, 40),
      ),
      h(
        'div',
        {
          style: {
            width: 86,
            height: 40,
            borderRadius: 8,
            background: '#162b42',
            border: '1.5px solid #29435d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        h(
          'span',
          {
            style: {
              color: hasScore ? '#ff0046' : '#94a3b8',
              fontSize: 18,
              fontWeight: 900,
            },
          },
          row.score,
        ),
      ),
      h(
        'div',
        {
          style: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
          },
        },
        renderCrest(row.awayLogo, row.away, 40),
        h(
          'span',
          {
            style: {
              color: '#f8fafc',
              fontSize: 20,
              fontWeight: 800,
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
          row.away,
        ),
      ),
    ),
  );
}

function boardCard(kind, rows) {
  const isTable = kind === 'table';
  const isClean = kind === 'cleansheets';
  const isFixtures = kind === 'fixtures';

  const mainTitle = isTable
    ? 'OFFICIAL LEAGUE STANDINGS'
    : isClean
      ? 'EPL CLEAN SHEETS'
      : 'MATCHDAY FIXTURES';

  const subtitle = isTable
    ? 'EGERTON PREMIER LEAGUE · OFFICIAL RANKINGS'
    : isClean
      ? 'DEFENSIVE WALL · SHUTOUT RANKINGS'
      : 'EGERTON PREMIER LEAGUE · LIVE FIXTURES';

  const badgeLabel = isTable ? 'DIVISION 1' : isClean ? 'GOLDEN GLOVE' : 'MATCHDAY';
  const badgeColor = isClean ? '#a855f7' : '#ff0046';
  const badgeBg = isClean ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 0, 70, 0.12)';
  const badgeBorder = isClean ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 0, 70, 0.4)';

  const buttonLabel = isFixtures ? 'OPEN FIXTURES →' : isClean ? 'OPEN CLEAN SHEETS →' : 'OPEN FULL TABLE →';

  return h(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: '#081018',
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
      },
    },
    h('div', { style: { width: '100%', height: 6, background: '#ff0046', flexShrink: 0 } }),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 52,
          background: '#0a1624',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 44px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center' } },
        h('span', { style: { color: '#ff0046', fontSize: 22, fontWeight: 900, letterSpacing: '0.08em' } }, 'EGERSCORE'),
        h('span', { style: { color: '#64748b', fontSize: 14, fontWeight: 700, marginLeft: 14 } }, '·  OFFICIAL EGERTON SPORTS NETWORK'),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            borderRadius: 16,
            background: 'rgba(255, 0, 70, 0.12)',
            border: '1.5px solid rgba(255, 0, 70, 0.4)',
            padding: '4px 14px',
            color: '#ff0046',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
          },
        },
        'LIVE STATS',
      ),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 76,
          background: '#0e1c2b',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 44px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { color: '#f8fafc', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' } }, mainTitle),
        h('span', { style: { color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 } }, subtitle),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            borderRadius: 18,
            background: badgeBg,
            border: `1.5px solid ${badgeBorder}`,
            padding: '6px 18px',
            color: badgeColor,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.05em',
          },
        },
        badgeLabel,
      ),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 40,
          background: '#112236',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          padding: '0 44px',
          flexShrink: 0,
        },
      },
      isTable
        ? [
            h('span', { key: 'col-rk', style: { width: 50, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, '#'),
            h('span', { key: 'col-tm', style: { flex: 1, textAlign: 'left', color: '#94a3b8', fontSize: 13, fontWeight: 800, paddingLeft: 16 } }, 'TEAM'),
            h('span', { key: 'col-mp', style: { width: 68, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'MP'),
            h('span', { key: 'col-w', style: { width: 68, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'W'),
            h('span', { key: 'col-d', style: { width: 68, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'D'),
            h('span', { key: 'col-l', style: { width: 68, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'L'),
            h('span', { key: 'col-gd', style: { width: 78, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'GD'),
            h('span', { key: 'col-pts', style: { width: 88, textAlign: 'center', color: '#f8fafc', fontSize: 14, fontWeight: 900 } }, 'PTS'),
          ]
        : isClean
        ? [
            h('span', { key: 'col-rk', style: { width: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, '#'),
            h('span', { key: 'col-tm', style: { flex: 1, textAlign: 'left', color: '#94a3b8', fontSize: 13, fontWeight: 800, paddingLeft: 16 } }, 'TEAM'),
            h('span', { key: 'col-cs', style: { width: 220, textAlign: 'center', color: '#c084fc', fontSize: 13, fontWeight: 800 } }, 'CLEAN SHEETS (CS)'),
            h('span', { key: 'col-pts', style: { width: 100, textAlign: 'center', color: '#f8fafc', fontSize: 14, fontWeight: 900 } }, 'PTS'),
          ]
        : [
            h('span', { key: 'col-tm', style: { width: 140, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'STATUS / TIME'),
            h('span', { key: 'col-fix', style: { flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'MATCH FIXTURE & TEAMS'),
            h('span', { key: 'col-sc', style: { width: 120, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, 'SCORE'),
          ],
    ),
    h(
      'div',
      { style: { width: '100%', display: 'flex', flexDirection: 'column', flex: 1 } },
      ...rows.slice(0, 6).map((row, index) => {
        if (isTable) return renderTableRow(row, index);
        if (isClean) return renderCleanSheetRow(row, index);
        return renderFixtureRow(row, index);
      }),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 60,
          background: '#0a1522',
          borderTop: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 44px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { color: '#64748b', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' } }, 'EGERSCORE.COM · OFFICIAL CAMPUS SPORTS PLATFORM'),
        h('span', { style: { color: '#475569', fontSize: 11, fontWeight: 600, marginTop: 2 } }, 'CAMPUS MATCH COVERAGE · REAL-TIME LEAGUE STATS'),
      ),
      h(
        'div',
        {
          style: {
            borderRadius: 24,
            background: '#ff0046',
            padding: '8px 22px',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
          },
        },
        buttonLabel,
      ),
    ),
  );
}

function renderGraphSvg(amplitudeSeries) {
  const chartWidth = 1120;
  const chartHeight = 160;
  const leftMargin = 95;
  const rightMargin = 30;
  const plotWidth = chartWidth - leftMargin - rightMargin;

  const getX = (md) => leftMargin + ((md - 1) / 10) * plotWidth;
  const getY = (amp) => (amp === 1 ? 28 : amp === 0 ? 80 : 132);

  const series = (amplitudeSeries && amplitudeSeries.length > 0) ? amplitudeSeries : [
    { matchday: 1, amp: 1, score: '2-0' },
    { matchday: 2, amp: 0, score: '1-1' },
    { matchday: 3, amp: 1, score: '2-1' },
    { matchday: 4, amp: 1, score: '3-1' },
    { matchday: 5, amp: -1, score: '0-1' },
    { matchday: 6, amp: 1, score: '2-0' },
    { matchday: 7, amp: 0, score: '0-0' },
    { matchday: 8, amp: 1, score: '1-0' },
    { matchday: 9, amp: 1, score: '3-2' },
    { matchday: 10, amp: 0, score: '1-1' },
    { matchday: 11, amp: 1, score: '2-1' },
  ];

  const points = series
    .map((pt, i) => `${getX(pt.matchday || i + 1)},${getY(pt.amp)}`)
    .join(' ');

  const svgChildren = [
    h('line', { key: 'l-w', x1: leftMargin, y1: 28, x2: chartWidth - rightMargin, y2: 28, stroke: '#10b981', strokeOpacity: 0.35, strokeDasharray: '4 4' }),
    h('line', { key: 'l-d', x1: leftMargin, y1: 80, x2: chartWidth - rightMargin, y2: 80, stroke: '#64748b', strokeOpacity: 0.5, strokeWidth: 1.5 }),
    h('line', { key: 'l-l', x1: leftMargin, y1: 132, x2: chartWidth - rightMargin, y2: 132, stroke: '#f43f5e', strokeOpacity: 0.35, strokeDasharray: '4 4' }),
  ];

  for (let md = 1; md <= 11; md++) {
    const x = getX(md);
    svgChildren.push(
      h('line', { key: `tick-${md}`, x1: x, y1: 18, x2: x, y2: 142, stroke: '#ffffff', strokeOpacity: 0.08 })
    );
  }

  if (points) {
    svgChildren.push(
      h('polyline', { key: 'poly', fill: 'none', stroke: '#10b981', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round', points })
    );
  }

  series.forEach((pt, i) => {
    const cx = getX(pt.matchday || i + 1);
    const cy = getY(pt.amp);
    const color = pt.amp === 1 ? '#10b981' : pt.amp === 0 ? '#f59e0b' : '#f43f5e';
    svgChildren.push(
      h('circle', { key: `c-${i}`, cx, cy, r: 6.5, fill: color, stroke: '#070d18', strokeWidth: 2.5 })
    );
  });

  const htmlLabels = [
    h('span', { key: 't-w', style: { position: 'absolute', left: 10, top: 20, color: '#10b981', fontSize: 13, fontWeight: 800 } }, '+1.0 WIN'),
    h('span', { key: 't-d', style: { position: 'absolute', left: 10, top: 72, color: '#94a3b8', fontSize: 13, fontWeight: 800 } }, '0.0 DRAW'),
    h('span', { key: 't-l', style: { position: 'absolute', left: 10, top: 124, color: '#f43f5e', fontSize: 13, fontWeight: 800 } }, '-1.0 LOSS'),
  ];

  for (let md = 1; md <= 11; md++) {
    const x = getX(md);
    htmlLabels.push(
      h('span', { key: `lbl-${md}`, style: { position: 'absolute', left: x - 15, top: 142, color: '#64748b', fontSize: 11, fontWeight: 800, width: 30, textAlign: 'center' } }, `M${md}`)
    );
  }

  series.forEach((pt, i) => {
    const cx = getX(pt.matchday || i + 1);
    const cy = getY(pt.amp);
    if (pt.score) {
      htmlLabels.push(
        h('span', { key: `txt-${i}`, style: { position: 'absolute', left: cx - 22, top: cy - 20, color: '#ffffff', fontSize: 10.5, fontWeight: 800, width: 44, textAlign: 'center' } }, pt.score)
      );
    }
  });

  return h(
    'div',
    { style: { position: 'relative', width: chartWidth, height: chartHeight, display: 'flex' } },
    h('svg', { width: chartWidth, height: chartHeight, viewBox: `0 0 ${chartWidth} ${chartHeight}`, style: { position: 'absolute', left: 0, top: 0 } }, ...svgChildren),
    ...htmlLabels
  );
}

function teamAnalyticsCard(team) {
  return h(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: '#070d18',
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
      },
    },
    h('div', { style: { width: '100%', height: 6, background: '#a855f7', flexShrink: 0 } }),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 48,
          background: '#0a1624',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center' } },
        h('span', { style: { color: '#a855f7', fontSize: 20, fontWeight: 900, letterSpacing: '0.08em' } }, 'EGERSCORE'),
        h('span', { style: { color: '#64748b', fontSize: 13, fontWeight: 700, marginLeft: 14 } }, '·  OFFICIAL EGERTON SPORTS NETWORK'),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            borderRadius: 14,
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1.5px solid rgba(168, 85, 247, 0.4)',
            padding: '4px 14px',
            color: '#c084fc',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
          },
        },
        'COACH ANALYTICS DOSSIER',
      ),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 72,
          background: '#0e1c2b',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 16 } },
        renderCrest(team.logo, team.name, 52),
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          h('span', { style: { color: '#f8fafc', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' } }, team.name.toUpperCase()),
          h('span', { style: { color: '#a855f7', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 } }, 'LEG 1 PERFORMANCE DOSSIER · OFFICIAL LEAGUE PROFILE'),
        ),
      ),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 14 } },
        h(
          'div',
          {
            style: {
              borderRadius: 16,
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1.5px solid rgba(168, 85, 247, 0.5)',
              padding: '6px 16px',
              color: '#c084fc',
              fontSize: 14,
              fontWeight: 900,
            },
          },
          `TABLE #${team.position} · ${team.pts} PTS`,
        ),
        h(
          'div',
          {
            style: {
              borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              padding: '6px 14px',
              color: '#10b981',
              fontSize: 13,
              fontWeight: 800,
            },
          },
          `${team.ppg} PPG`,
        ),
      ),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 72,
          background: '#0a1322',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 40px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { flex: 1, height: 54, background: '#070d18', borderRadius: 12, border: '1px solid #1a2e45', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
        h('span', { style: { color: '#94a3b8', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em' } }, 'RECORD'),
        h('span', { style: { color: '#10b981', fontSize: 14, fontWeight: 900, marginTop: 1 } }, `${team.won}W-${team.drawn}D-${team.lost}L`),
        h('span', { style: { color: '#64748b', fontSize: 9 } }, `${team.winRate}% WIN`),
      ),
      h(
        'div',
        { style: { flex: 1, height: 54, background: '#070d18', borderRadius: 12, border: '1px solid #1a2e45', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
        h('span', { style: { color: '#94a3b8', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em' } }, 'SCORED'),
        h('span', { style: { color: '#38bdf8', fontSize: 14, fontWeight: 900, marginTop: 1 } }, String(team.gf)),
        h('span', { style: { color: '#64748b', fontSize: 9 } }, `${team.gfPerGame}/m`),
      ),
      h(
        'div',
        { style: { flex: 1, height: 54, background: '#070d18', borderRadius: 12, border: '1px solid #1a2e45', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
        h('span', { style: { color: '#94a3b8', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em' } }, 'CONCEDED'),
        h('span', { style: { color: '#f43f5e', fontSize: 14, fontWeight: 900, marginTop: 1 } }, String(team.ga)),
        h('span', { style: { color: '#64748b', fontSize: 9 } }, `${team.gaPerGame}/m`),
      ),
      h(
        'div',
        { style: { flex: 1, height: 54, background: '#070d18', borderRadius: 12, border: '1px solid #1a2e45', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
        h('span', { style: { color: '#94a3b8', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em' } }, 'SHUTOUTS'),
        h('span', { style: { color: '#c084fc', fontSize: 14, fontWeight: 900, marginTop: 1 } }, String(team.cleanSheets)),
        h('span', { style: { color: '#64748b', fontSize: 9 } }, `${team.cleanSheetRate}% CS`),
      ),
      h(
        'div',
        { style: { flex: 1.3, height: 54, background: '#070d18', borderRadius: 12, border: '1px solid #1a2e45', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
        h('span', { style: { color: '#94a3b8', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em' } }, 'HOME · AWAY · DIFF'),
        h('span', { style: { color: '#f8fafc', fontSize: 13, fontWeight: 900, marginTop: 1 } }, `H: ${team.homeWon}-${team.homeDrawn}-${team.homeLost} · A: ${team.awayWon}-${team.awayDrawn}-${team.awayLost}`),
        h('span', { style: { color: team.gd.startsWith('+') ? '#10b981' : '#f43f5e', fontSize: 9, fontWeight: 800 } }, `GD: ${team.gd}`),
      ),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 38,
          background: '#0d1b2a',
          borderBottom: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        h(
          'span',
          {
            style: {
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '2px 10px',
              color: '#f59e0b',
              fontSize: 10.5,
              fontWeight: 900,
            },
          },
          `🔥 ${team.tagline.toUpperCase()}`,
        ),
        h('span', { style: { color: '#94a3b8', fontSize: 11.5, fontWeight: 600 } }, 'Official match tactics & consistency directives locked'),
      ),
      h('span', { style: { color: '#64748b', fontSize: 11, fontWeight: 700 } }, 'MATCHDAYS 1 - 11 SEQUENCE'),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          flex: 1,
          background: '#070d18',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 40px',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 } },
        h('span', { style: { color: '#10b981', fontSize: 12, fontWeight: 900, letterSpacing: '0.04em' } }, 'FORM CHANGE & PERFORMANCE AMPLITUDE GRAPH (±1.0 to -1.0)'),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, fontWeight: 800 } },
          h('span', { style: { color: '#10b981' } }, '● +1.0 Win'),
          h('span', { style: { color: '#94a3b8' } }, '● 0.0 Draw'),
          h('span', { style: { color: '#f43f5e' } }, '● -1.0 Loss'),
        ),
      ),
      renderGraphSvg(team.amplitudeSeries),
    ),
    h(
      'div',
      {
        style: {
          width: '100%',
          height: 52,
          background: '#0a1624',
          borderTop: '1px solid #1a2e45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          flexShrink: 0,
        },
      },
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h('span', { style: { color: '#64748b', fontSize: 13, fontWeight: 700 } }, 'EGERSCORE.COM · TAP TO VIEW FULL TEAM ANALYTICS, SQUAD & ROSTER'),
        h('span', { style: { color: '#475569', fontSize: 10.5, fontWeight: 600, marginTop: 1 } }, 'REAL-TIME MATCH RECORDS & PERFORMANCE TRAJECTORY'),
      ),
      h(
        'div',
        {
          style: {
            borderRadius: 20,
            background: '#a855f7',
            padding: '7px 20px',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
          },
        },
        'OPEN TEAM ANALYTICS →',
      ),
    ),
  );
}

const EPL_FALLBACK_TEAMS = [
  { name: 'Super Eagles', slug: 'super-eagles', logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80', pos: 1, pts: 24, w: 7, d: 3, l: 1, gf: 18, ga: 7, cs: 6 },
  { name: 'Wazito FC', slug: 'wazito-fc', logo_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80', pos: 2, pts: 22, w: 6, d: 4, l: 1, gf: 16, ga: 8, cs: 5 },
  { name: 'BCOM FC', slug: 'bcom-fc', logo_url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80', pos: 3, pts: 21, w: 6, d: 3, l: 2, gf: 17, ga: 9, cs: 5 },
  { name: 'Celtics FC', slug: 'celtics-fc', logo_url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80', pos: 4, pts: 19, w: 5, d: 4, l: 2, gf: 15, ga: 10, cs: 4 },
  { name: 'Santos FC', slug: 'santos-fc', logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80', pos: 5, pts: 18, w: 5, d: 3, l: 3, gf: 14, ga: 11, cs: 4 },
  { name: 'Legends FC', slug: 'legends-fc', logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80', pos: 6, pts: 16, w: 4, d: 4, l: 3, gf: 13, ga: 11, cs: 4 },
  { name: 'Blue Blazers', slug: 'blue-blazers', logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80', pos: 7, pts: 15, w: 4, d: 3, l: 4, gf: 12, ga: 12, cs: 3 },
  { name: 'Giants FC', slug: 'giants-fc', logo_url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80', pos: 8, pts: 14, w: 3, d: 5, l: 3, gf: 11, ga: 12, cs: 3 },
  { name: 'Med FC', slug: 'med-fc', logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80', pos: 9, pts: 12, w: 3, d: 3, l: 5, gf: 10, ga: 14, cs: 3 },
  { name: 'Five Stars FC', slug: 'five-stars-fc', logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80', pos: 10, pts: 10, w: 2, d: 4, l: 5, gf: 9, ga: 16, cs: 2 },
  { name: 'Mighty Blacks', slug: 'mighty-blacks', logo_url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80', pos: 11, pts: 9, w: 2, d: 3, l: 6, gf: 8, ga: 18, cs: 2 },
  { name: 'Rising Stars', slug: 'rising-stars', logo_url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80', pos: 12, pts: 6, w: 1, d: 3, l: 7, gf: 7, ga: 20, cs: 1 },
];

function getFallbackTeamData(teamSlug) {
  const cleanSlug = String(teamSlug || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const matched = EPL_FALLBACK_TEAMS.find(t => t.slug === cleanSlug || t.slug.includes(cleanSlug) || cleanSlug.includes(t.slug))
    || {
      name: cleanSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || 'Egerton FC',
      logo_url: '',
      pos: 1,
      pts: 24,
      w: 7,
      d: 3,
      l: 1,
      gf: 18,
      ga: 7,
      cs: 5,
    };

  const won = matched.w || 7;
  const drawn = matched.d || 3;
  const lost = matched.l || 1;
  const played = won + drawn + lost;
  const pts = matched.pts || 24;
  const gf = matched.gf || 18;
  const ga = matched.ga || 7;
  const gd = gf - ga;
  const cleanSheets = matched.cs || 5;

  return {
    name: matched.name,
    logo: matched.logo_url || '',
    position: matched.pos || 1,
    pts,
    ppg: (pts / played).toFixed(2),
    played,
    won,
    drawn,
    lost,
    winRate: Math.round((won / played) * 100),
    gf,
    gfPerGame: (gf / played).toFixed(2),
    ga,
    gaPerGame: (ga / played).toFixed(2),
    gd: gd > 0 ? `+${gd}` : String(gd),
    cleanSheets,
    cleanSheetRate: Math.round((cleanSheets / played) * 100),
    homeWon: Math.ceil(won * 0.6),
    homeDrawn: Math.floor(drawn * 0.5),
    homeLost: Math.floor(lost * 0.5),
    awayWon: Math.floor(won * 0.4),
    awayDrawn: Math.ceil(drawn * 0.5),
    awayLost: Math.ceil(lost * 0.5),
    tagline: ga <= 8 ? 'Defensive Champions' : 'Title Contenders',
    amplitudeSeries: [
      { matchday: 1, amp: 1, score: '2-0', res: 'W' },
      { matchday: 2, amp: 0, score: '1-1', res: 'D' },
      { matchday: 3, amp: 1, score: '2-1', res: 'W' },
      { matchday: 4, amp: 1, score: '3-0', res: 'W' },
      { matchday: 5, amp: -1, score: '0-1', res: 'L' },
      { matchday: 6, amp: 1, score: '2-0', res: 'W' },
      { matchday: 7, amp: 0, score: '0-0', res: 'D' },
      { matchday: 8, amp: 1, score: '2-1', res: 'W' },
      { matchday: 9, amp: 1, score: '1-0', res: 'W' },
      { matchday: 10, amp: 0, score: '1-1', res: 'D' },
      { matchday: 11, amp: 1, score: '3-1', res: 'W' },
    ],
  };
}

async function fetchTeamAnalyticsData(teamSlug) {
  try {
    const teams = await supabaseRows('teams?select=id,name,logo_url&competition_id=eq.11111111-1111-1111-1111-111111111111');
    const cleanSlug = String(teamSlug || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const effectiveTeams = (teams && teams.length > 0) ? teams : EPL_FALLBACK_TEAMS;

    const targetTeam = effectiveTeams.find((t) => {
      const s = String(t.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      return s === cleanSlug || s.includes(cleanSlug) || cleanSlug.includes(s);
    }) || getFallbackTeamData(teamSlug);

    const allFixtures = await supabaseRows(
      'fixtures?select=home_team_id,away_team_id,score_home,score_away,status,matchday,scheduled_time&competition_id=eq.11111111-1111-1111-1111-111111111111&status=in.(FT,FINISHED,ft,finished)&order=scheduled_time.asc'
    );

    if (!allFixtures || allFixtures.length === 0) {
      return getFallbackTeamData(teamSlug);
    }

    const tableMap = new Map();
    effectiveTeams.forEach((t) => {
      tableMap.set(t.id || t.slug, { id: t.id || t.slug, name: t.name, pts: 0, gd: 0, won: 0 });
    });
    allFixtures.forEach((f) => {
      const sh = Number(f.score_home) || 0;
      const sa = Number(f.score_away) || 0;
      const hTeam = tableMap.get(f.home_team_id);
      const aTeam = tableMap.get(f.away_team_id);
      if (hTeam) {
        hTeam.gd += sh - sa;
        if (sh > sa) { hTeam.pts += 3; hTeam.won += 1; }
        else if (sh === sa) { hTeam.pts += 1; }
      }
      if (aTeam) {
        aTeam.gd += sa - sh;
        if (sa > sh) { aTeam.pts += 3; aTeam.won += 1; }
        else if (sa === sh) { aTeam.pts += 1; }
      }
    });

    const sortedTable = [...tableMap.values()].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
    const position = Math.max(1, sortedTable.findIndex((t) => t.id === targetTeam.id) + 1);

    const teamMatches = allFixtures
      .filter((f) => (f.home_team_id === targetTeam.id || f.away_team_id === targetTeam.id) && f.matchday <= 11)
      .slice(0, 11);

    let played = teamMatches.length;
    let won = 0, drawn = 0, lost = 0;
    let gf = 0, ga = 0;
    let homeWon = 0, homeDrawn = 0, homeLost = 0;
    let awayWon = 0, awayDrawn = 0, awayLost = 0;
    let cleanSheets = 0;

    const amplitudeSeries = teamMatches.map((m, i) => {
      const isHome = m.home_team_id === targetTeam.id;
      const sh = Number(m.score_home) || 0;
      const sa = Number(m.score_away) || 0;
      const teamGoals = isHome ? sh : sa;
      const oppGoals = isHome ? sa : sh;

      let res = 'D';
      let amp = 0;
      if (teamGoals > oppGoals) {
        res = 'W';
        amp = 1;
        won += 1;
        if (isHome) homeWon += 1; else awayWon += 1;
      } else if (teamGoals < oppGoals) {
        res = 'L';
        amp = -1;
        lost += 1;
        if (isHome) homeLost += 1; else awayLost += 1;
      } else {
        drawn += 1;
        if (isHome) homeDrawn += 1; else awayDrawn += 1;
      }

      gf += teamGoals;
      ga += oppGoals;
      if (oppGoals === 0) cleanSheets += 1;

      return {
        matchday: m.matchday || i + 1,
        amp,
        score: `${teamGoals}-${oppGoals}`,
        res,
      };
    });

    if (amplitudeSeries.length === 0) {
      return getFallbackTeamData(teamSlug);
    }

    const pts = won * 3 + drawn;
    const ppg = played > 0 ? (pts / played).toFixed(2) : '0.00';
    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    const cleanSheetRate = played > 0 ? Math.round((cleanSheets / played) * 100) : 0;
    const gfPerGame = played > 0 ? (gf / played).toFixed(2) : '0.00';
    const gaPerGame = played > 0 ? (ga / played).toFixed(2) : '0.00';
    const gd = gf - ga;

    let tagline = 'Resilient Contenders';
    if (ga <= 5) tagline = 'Defensive Champions';
    else if (cleanSheetRate >= 40) tagline = 'Impenetrable Fortress';
    else if (gf >= 12) tagline = 'Clinical Finishers';
    else if (winRate >= 50) tagline = 'Title Contenders';

    return {
      name: targetTeam.name || 'Egerton FC',
      logo: targetTeam.logo_url || '',
      position,
      pts,
      ppg,
      played,
      won,
      drawn,
      lost,
      winRate,
      gf,
      gfPerGame,
      ga,
      gaPerGame,
      gd: gd > 0 ? `+${gd}` : String(gd),
      cleanSheets,
      cleanSheetRate,
      homeWon,
      homeDrawn,
      homeLost,
      awayWon,
      awayDrawn,
      awayLost,
      tagline,
      amplitudeSeries,
    };
  } catch {
    return getFallbackTeamData(teamSlug);
  }
}

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const team = url.searchParams.get('team');
  if (team) {
    try {
      const teamData = await fetchTeamAnalyticsData(team);
      return new ImageResponse(teamAnalyticsCard(teamData), {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000' },
      });
    } catch {
      const defaultData = getFallbackTeamData(team);
      return new ImageResponse(teamAnalyticsCard(defaultData), {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000' },
      });
    }
  }

  const view = url.searchParams.get('view');
  if (view === 'table' || view === 'fixtures' || view === 'cleansheets') {
    try {
      const rows = view === 'fixtures'
        ? await fetchFixturesData()
        : view === 'cleansheets'
        ? await fetchCleanSheetsData()
        : await fetchTableData();

      return new ImageResponse(boardCard(view, rows), {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400' },
      });
    } catch {
      const defaultRows = view === 'fixtures'
        ? await fetchFixturesData()
        : view === 'cleansheets'
        ? await fetchCleanSheetsData()
        : await fetchTableData();
      return new ImageResponse(boardCard(view, defaultRows), {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400' },
      });
    }
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
