import React from 'react';
import { ImageResponse } from '@vercel/og';
import { decodeShareCard } from '../src/lib/predictions/shareCard.mjs';
import { loadPredictionShare } from '../src/lib/predictions/shareServer.mjs';

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

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('d') || '';
  const shared = url.searchParams.get('m')
    ? await loadPredictionShare(url.searchParams.get('m'), url.searchParams.get('p'))
    : null;
  const card = shared?.card || decodeShareCard(token);
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
