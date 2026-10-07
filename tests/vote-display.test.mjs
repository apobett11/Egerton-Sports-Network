import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actualVoteSplit,
  deriveShowVotes,
  showVotesForConsensus,
} from '../src/lib/predictions/voteDisplay.mjs';

function assertShownRange(actual, result) {
  const total = result.homeVotes + result.drawVotes + result.awayVotes;
  assert.equal(result.total, total);
  assert.equal(result.homePct + result.drawPct + result.awayPct, 100);
  const actualTotal = actual.homeVotes + actual.drawVotes + actual.awayVotes;
  if (actualTotal > 0) {
    assert.equal(result.total, actualTotal * 10);
  } else {
    assert.ok(result.total > 0);
  }
  const margin = Math.abs(result.homeVotes - result.awayVotes);
  assert.ok(margin <= Math.ceil(total * 0.31), `margin ${margin} of total ${total} exceeded 30%`);
  if (actual.homeVotes > actual.awayVotes) assert.ok(result.homeVotes > result.awayVotes);
  if (actual.awayVotes > actual.homeVotes) assert.ok(result.awayVotes > result.homeVotes);
  if (actual.homeVotes === actual.awayVotes && actualTotal > 0) assert.equal(result.homeVotes, result.awayVotes);
}

test('shown votes boost by *10 and cap team lead at 30%', () => {
  const samples = [
    { homeVotes: 0, drawVotes: 0, awayVotes: 0 },
    { homeVotes: 52, drawVotes: 0, awayVotes: 3 },
    { homeVotes: 4, drawVotes: 0, awayVotes: 0 },
    { homeVotes: 90, drawVotes: 5, awayVotes: 5 },
    { homeVotes: 45, drawVotes: 10, awayVotes: 45 },
    { homeVotes: 200, drawVotes: 20, awayVotes: 180 },
  ];
  samples.forEach((actual) => {
    assertShownRange(actual, deriveShowVotes(actual, 'match-a'));
  });
});

test('the same recorded tally always shows the same counts', () => {
  const actual = { homeVotes: 52, drawVotes: 0, awayVotes: 3 };
  assert.deepEqual(deriveShowVotes(actual, 'stable'), deriveShowVotes(actual, 'stable'));
});

test('an actual lead is not handed to the other side', () => {
  const home = deriveShowVotes({ homeVotes: 8, drawVotes: 0, awayVotes: 1 }, 'lead', '2');
  const away = deriveShowVotes({ homeVotes: 1, drawVotes: 0, awayVotes: 8 }, 'lead', '1');
  assert.ok(home.homeVotes > home.awayVotes);
  assert.ok(away.awayVotes > away.homeVotes);
});

test('exact lead range is respected when below 30%', () => {
  // 12 vs 10 with 2 draw => diff = 2 / 24 = 8.33%
  const actual = { homeVotes: 12, drawVotes: 2, awayVotes: 10 };
  const shown = deriveShowVotes(actual, 'test-range');
  assert.equal(shown.total, 240);
  const diffPct = (shown.homeVotes - shown.awayVotes) / shown.total;
  assert.ok(diffPct <= 0.12 && diffPct >= 0.07);
});

test('capped lead range is respected when above 30%', () => {
  // 80 vs 10 with 10 draw => diff = 70 / 100 = 70%
  const actual = { homeVotes: 80, drawVotes: 10, awayVotes: 10 };
  const shown = deriveShowVotes(actual, 'test-cap');
  assert.equal(shown.total, 1000);
  const diff = shown.homeVotes - shown.awayVotes;
  assert.ok(diff <= 305 && diff >= 295);
});

test('consensus adaptation preserves actual totals and never mutates input', () => {
  const consensus = Object.freeze({
    matchId: 'immutable',
    totalVotes: 101,
    homePct: 61,
    drawPct: 9,
    awayPct: 30,
    pulseLabel: '101 real votes',
  });
  const actual = actualVoteSplit(consensus);
  const shown = showVotesForConsensus(consensus);

  assert.equal(actual.total, 101);
  assert.equal(actual.homeVotes + actual.drawVotes + actual.awayVotes, 101);
  assert.equal(shown.total, 1010);
  assert.equal(consensus.totalVotes, 101);
  assertShownRange(actual, shown);
});

