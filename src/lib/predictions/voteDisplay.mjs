const TEAM_FLOOR = 70;
const DERBY_TEAM_FLOOR = 101;
const MAX_LEAD_SHARE = 0.1;

const cleanCount = (value) => Math.max(0, Math.round(Number(value) || 0));

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Converts stored consensus percentages into integer actual counts. This is
 * only an input adapter: the returned counts still sum to the stored total.
 */
export function actualVoteSplit(consensus) {
  const total = cleanCount(consensus?.totalVotes);
  if (!total) return { total: 0, homeVotes: 0, drawVotes: 0, awayVotes: 0 };

  const weights = [
    Math.max(0, Number(consensus?.homePct) || 0),
    Math.max(0, Number(consensus?.drawPct) || 0),
    Math.max(0, Number(consensus?.awayPct) || 0),
  ];
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  if (!weightTotal) return { total, homeVotes: 0, drawVotes: total, awayVotes: 0 };

  const exact = weights.map((weight) => (total * weight) / weightTotal);
  const counts = exact.map(Math.floor);
  let remainder = total - counts.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - counts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index += 1) counts[order[index].index] += 1;

  return { total, homeVotes: counts[0], drawVotes: counts[1], awayVotes: counts[2] };
}

function teamFloor(isDerby) {
  return isDerby ? DERBY_TEAM_FLOOR : TEAM_FLOOR;
}

/** Small steady lift. Every extra recorded vote moves the shown count up. */
function lifted(actualVotes, floor) {
  return Math.max(floor, actualVotes + 1 + Math.floor(actualVotes / 20));
}

function leadIsInsideRange(leader, trailer, draw) {
  const total = leader + trailer + draw;
  return leader - trailer <= Math.floor(total * MAX_LEAD_SHARE);
}

/**
 * Presentation counts only. Recorded votes stay untouched.
 * The actual leader still leads, each side stays above its real count,
 * and the lead stays inside 10% of the shown total.
 */
export function deriveShowVotes(actual, seedKey = '', preferredOption = null, isDerby = false) {
  const homeActual = cleanCount(actual?.homeVotes);
  const drawActual = cleanCount(actual?.drawVotes);
  const awayActual = cleanCount(actual?.awayVotes);
  const floor = teamFloor(Boolean(isDerby));
  const tied = homeActual === awayActual;
  const homeLeads = tied
    ? preferredOption === '2'
      ? false
      : preferredOption === '1'
        ? true
        : stableHash(seedKey) % 2 === 0
    : homeActual > awayActual;

  let leader = lifted(homeLeads ? homeActual : awayActual, tied ? floor : floor + 1);
  let trailer = lifted(homeLeads ? awayActual : homeActual, floor);
  let draw = Math.max(drawActual + 1, Math.round((leader + trailer) * 0.08));

  if (tied) {
    const level = Math.max(leader, trailer, floor);
    leader = level;
    trailer = level;
  } else if (trailer >= leader) {
    leader = trailer + 1;
  }

  let guard = 0;
  while (!leadIsInsideRange(leader, trailer, draw) && guard < 10000) {
    trailer += 1;
    if (!tied && trailer >= leader) leader = trailer + 1;
    draw = Math.max(draw, drawActual + 1, Math.round((leader + trailer) * 0.08));
    guard += 1;
  }

  const homeVotes = homeLeads ? leader : trailer;
  const awayVotes = homeLeads ? trailer : leader;
  const total = homeVotes + draw + awayVotes;
  const homePct = Math.round((homeVotes * 100) / total);
  const awayPct = Math.round((awayVotes * 100) / total);

  return {
    total,
    homeVotes,
    drawVotes: draw,
    awayVotes,
    homePct,
    drawPct: 100 - homePct - awayPct,
    awayPct,
  };
}

export function showVotesForConsensus(consensus, seedKey = consensus?.matchId || '', preferredOption = null, isDerby = false) {
  return deriveShowVotes(actualVoteSplit(consensus), seedKey, preferredOption, isDerby);
}
