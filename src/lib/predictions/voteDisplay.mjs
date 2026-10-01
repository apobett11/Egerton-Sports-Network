const TEAM_SHARE = Object.freeze({ stronger: 49, weaker: 41, draw: 10 });
const SEED_TOTAL = 20;
const LOW_COUNT_THRESHOLD = 12;

const cleanCount = (value) => Math.max(0, Math.round(Number(value) || 0));

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededDisplay(seedKey, homeLeads, preferredOption) {
  if (preferredOption === 'X') {
    return {
      total: 28,
      homeVotes: 9,
      drawVotes: 10,
      awayVotes: 9,
      homePct: 32,
      drawPct: 36,
      awayPct: 32,
    };
  }
  const homeIsStronger = preferredOption === '1'
    ? true
    : preferredOption === '2'
      ? false
      : homeLeads ?? stableHash(seedKey) % 2 === 0;
  const homeVotes = homeIsStronger ? 10 : 9;
  const awayVotes = homeIsStronger ? 9 : 10;
  const total = homeVotes + awayVotes + 2;
  const homePct = Math.round((homeVotes * 100) / total);
  const awayPct = Math.round((awayVotes * 100) / total);
  return {
    total,
    homeVotes,
    drawVotes: 2,
    awayVotes,
    homePct,
    drawPct: 100 - homePct - awayPct,
    awayPct,
  };
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

/**
 * Produces deterministic presentation-only votes.
 *
 * Above the seed threshold, the weaker side receives roughly one balancing
 * vote per three real stronger-side votes. That augmentation is capped at
 * twice the weaker side's real count. The resulting presentation sample is
 * normalized around a close 49/41 team split, leaving about 10% for draws.
 */
export function deriveShowVotes(actual, seedKey = '', preferredOption = null) {
  const homeActual = cleanCount(actual?.homeVotes);
  const drawActual = cleanCount(actual?.drawVotes);
  const awayActual = cleanCount(actual?.awayVotes);
  const actualTotal = homeActual + drawActual + awayActual;
  const homeLeads = homeActual === awayActual ? stableHash(seedKey) % 2 === 0 : homeActual > awayActual;

  if (actualTotal < LOW_COUNT_THRESHOLD || Math.min(homeActual, awayActual) === 0) {
    return seededDisplay(seedKey, homeLeads, preferredOption);
  }

  const strongerActual = homeLeads ? homeActual : awayActual;
  const weakerActual = homeLeads ? awayActual : homeActual;
  const cadenceBoost = Math.floor(strongerActual / 3);
  const augmentationCap = weakerActual * 2;
  const weakerVotes = weakerActual + Math.min(cadenceBoost, augmentationCap);

  const total = Math.max(SEED_TOTAL, Math.round((weakerVotes * 100) / TEAM_SHARE.weaker));
  const strongerVotes = Math.round((total * TEAM_SHARE.stronger) / 100);
  const normalizedWeakerVotes = Math.round((total * TEAM_SHARE.weaker) / 100);
  const drawVotes = Math.max(1, total - strongerVotes - normalizedWeakerVotes);

  const homeVotes = homeLeads ? strongerVotes : normalizedWeakerVotes;
  const awayVotes = homeLeads ? normalizedWeakerVotes : strongerVotes;
  const shownTotal = homeVotes + drawVotes + awayVotes;
  const homePct = Math.round((homeVotes * 100) / shownTotal);
  const awayPct = Math.round((awayVotes * 100) / shownTotal);

  return {
    total: shownTotal,
    homeVotes,
    drawVotes,
    awayVotes,
    homePct,
    drawPct: 100 - homePct - awayPct,
    awayPct,
  };
}

export function showVotesForConsensus(consensus, seedKey = consensus?.matchId || '', preferredOption = null) {
  return deriveShowVotes(actualVoteSplit(consensus), seedKey, preferredOption);
}
