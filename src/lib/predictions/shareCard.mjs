const MAX_TOKEN = 6000;

function clip(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function encodeShareCard(card) {
  const json = JSON.stringify(card);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeShareCard(token) {
  if (!token || token.length > MAX_TOKEN) return null;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || (data.k !== 'derby' && data.k !== 'slip' && data.k !== 'talk')) return null;
    return data;
  } catch {
    return null;
  }
}

export function derbyCard(args) {
  return {
    k: 'derby',
    home: clip(args.home, 32),
    away: clip(args.away, 32),
    pick: clip(args.pick, 32),
    call: clip(args.call, 110),
    stake: clip(args.stake, 90),
    homeVotes: Number(args.homeVotes) || 0,
    drawVotes: Number(args.drawVotes) || 0,
    awayVotes: Number(args.awayVotes) || 0,
    others: (args.others || []).slice(0, 4).map((line) => clip(line, 72)),
  };
}

export function slipCard(args) {
  return {
    k: 'slip',
    rows: (args.rows || []).slice(0, 5).map((row) => ({
      match: clip(row.match, 42),
      pick: clip(row.pick, 28),
      votes: Number(row.votes) || 0,
    })),
    hidden: Number(args.hidden) || 0,
    hasDerby: Boolean(args.hasDerby),
  };
}

export function talkCard(args) {
  return {
    k: 'talk',
    handle: clip(args.handle, 32),
    text: clip(args.text, 180),
    postId: clip(args.postId, 80),
  };
}

export function cardTitle(card) {
  if (!card) return 'Come vote';
  if (card.k === 'derby') return `My Match · ${card.home} vs ${card.away}`;
  if (card.k === 'slip') return 'My slip';
  return card.handle ? `A take from ${card.handle}` : 'A take';
}

export function cardDescription(card) {
  if (card?.k === 'talk') return 'Come say yours. Touch the take.';
  return 'This is my vote selections. Check yours now, and express your prediction.';
}

export function cardDestination(card) {
  if (card?.k === 'talk') {
    const post = card.postId ? `&post=${encodeURIComponent(card.postId)}` : '';
    return `/?view=talk${post}`;
  }
  return '/?view=picks';
}
