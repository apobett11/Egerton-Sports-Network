import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actualVoteSplit,
  deriveShowVotes,
  showVotesForConsensus,
} from '../src/lib/predictions/voteDisplay.mjs';

function assertShownRange(actual, result, isDerby = false) {
  const floor = isDerby ? 101 : 70;
  const total = result.homeVotes + result.drawVotes + result.awayVotes;
  assert.equal(result.total, total);
  assert.equal(result.homePct + result.drawPct + result.awayPct, 100);
  assert.ok(result.homeVotes >= floor, `home ${result.homeVotes} below ${floor}`);
  assert.ok(result.awayVotes >= floor, `away ${result.awayVotes} below ${floor}`);
  assert.ok(result.homeVotes > actual.homeVotes);
  assert.ok(result.awayVotes > actual.awayVotes);
  assert.ok(result.drawVotes > actual.drawVotes);
  assert.ok(result.total > actual.homeVotes + actual.drawVotes + actual.awayVotes);
  const margin = Math.abs(result.homeVotes - result.awayVotes);
  assert.ok(margin <= Math.floor(total * 0.1), `margin ${margin} of total ${total}`);
  if (actual.homeVotes > actual.awayVotes) assert.ok(result.homeVotes > result.awayVotes);
  if (actual.awayVotes > actual.homeVotes) assert.ok(result.awayVotes > result.homeVotes);
}

test('shown votes stay above the recorded counts inside a 10% lead', () => {
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

test('shown team counts rise as recorded votes rise', () => {
  let previous = deriveShowVotes({ homeVotes: 10, drawVotes: 0, awayVotes: 4 }, 'climb');
  for (let home = 11; home <= 80; home += 1) {
    const next = deriveShowVotes({ homeVotes: home, drawVotes: 0, awayVotes: 4 }, 'climb');
    assert.ok(next.homeVotes >= previous.homeVotes);
    assert.ok(next.total >= previous.total);
    previous = next;
  }
});

test('derby sides show more than a hundred votes', () => {
  const actual = { homeVotes: 12, drawVotes: 1, awayVotes: 3 };
  const result = deriveShowVotes(actual, 'derby', null, true);
  assertShownRange(actual, result, true);
  assert.ok(result.homeVotes > 100);
  assert.ok(result.awayVotes > 100);
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
  assert.ok(shown.total > consensus.totalVotes);
  assert.equal(consensus.totalVotes, 101);
  assertShownRange(actual, shown);
});
