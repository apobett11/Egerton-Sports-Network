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

/**
 * Presentation counts only. Recorded votes stay untouched.
 * Formula:
 * 1. Total show votes = actual total * 10 (with baseline for zero-vote slates).
 * 2. Calculate actual lead percentage between the two teams.
 * 3. Leading team leads by at most 30% of total votes. If actual range is less than 30%,
 *    lead by that exact percentage. If draw/tie, then draw.
 * 4. The actual leading team strictly leads in shown votes.
 */
export function deriveShowVotes(actual, seedKey = '', preferredOption = null, isDerby = false) {
  let homeActual = cleanCount(actual?.homeVotes);
  let drawActual = cleanCount(actual?.drawVotes);
  let awayActual = cleanCount(actual?.awayVotes);

  if (preferredOption === '1') homeActual += 1;
  else if (preferredOption === 'X') drawActual += 1;
  else if (preferredOption === '2') awayActual += 1;

  let actualTotal = homeActual + drawActual + awayActual;

  // Baseline fallback when actual votes are zero
  if (actualTotal === 0) {
    const hash = stableHash(seedKey);
    const baseTotal = isDerby ? 15 : 10;
    const drawBase = Math.max(1, Math.floor(baseTotal * 0.2));
    const remain = baseTotal - drawBase;
    const splitOffset = (hash % 3); // 0, 1, or 2
    const homeBase = Math.floor(remain / 2) + splitOffset;
    const awayBase = Math.max(1, remain - homeBase);
    homeActual = homeBase;
    drawActual = drawBase;
    awayActual = awayBase;
    actualTotal = homeActual + drawActual + awayActual;
  }

  // Boost total votes by *10 for show votes
  const total = actualTotal * 10;

  // Calculate draw portion
  const drawShare = actualTotal > 0 ? drawActual / actualTotal : 0.15;
  let drawVotes = Math.round(drawShare * total);
  let teamsTotal = Math.max(0, total - drawVotes);

  const homeLeads = homeActual > awayActual;
  const awayLeads = awayActual > homeActual;
  const isTied = homeActual === awayActual;

  let homeVotes = 0;
  let awayVotes = 0;

  if (isTied) {
    homeVotes = Math.floor(teamsTotal / 2);
    awayVotes = homeVotes;
    drawVotes = total - homeVotes - awayVotes;
  } else {
    // Lead percentage in actual votes
    const actualDiff = Math.abs(homeActual - awayActual);
    const actualLeadPct = actualTotal > 0 ? actualDiff / actualTotal : 0;
    // Leading team will lead by at most 30% of votes
    const showLeadPct = Math.min(0.30, actualLeadPct);
    const leadVotes = Math.round(showLeadPct * total);

    let leaderVotes = Math.round((teamsTotal + leadVotes) / 2);
    let trailerVotes = teamsTotal - leaderVotes;

    if (leaderVotes <= trailerVotes) {
      leaderVotes = trailerVotes + 1;
      teamsTotal = leaderVotes + trailerVotes;
    }

    if (homeLeads) {
      homeVotes = leaderVotes;
      awayVotes = trailerVotes;
    } else {
      awayVotes = leaderVotes;
      homeVotes = trailerVotes;
    }
  }

  const finalTotal = homeVotes + drawVotes + awayVotes;
  const homePct = Math.round((homeVotes * 100) / finalTotal);
  const awayPct = Math.round((awayVotes * 100) / finalTotal);
  const drawPct = 100 - homePct - awayPct;

  return {
    total: finalTotal,
    homeVotes,
    drawVotes,
    awayVotes,
    homePct,
    drawPct,
    awayPct,
  };
}

export function showVotesForConsensus(consensus, seedKey = consensus?.matchId || '', preferredOption = null, isDerby = false) {
  return deriveShowVotes(actualVoteSplit(consensus), seedKey, preferredOption, isDerby);
}

