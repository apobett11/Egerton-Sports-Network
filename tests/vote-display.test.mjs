import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actualVoteSplit,
  deriveShowVotes,
  showVotesForConsensus,
} from '../src/lib/predictions/voteDisplay.mjs';

function assertCloseDerbyRange(result) {
  const teamShares = [result.homePct, result.awayPct].sort((a, b) => a - b);
  assert.ok(teamShares[0] >= 40 && teamShares[0] <= 42, `weaker share was ${teamShares[0]}%`);
  assert.ok(teamShares[1] >= 48 && teamShares[1] <= 50, `stronger share was ${teamShares[1]}%`);
  assert.ok(result.homeVotes > 0);
  assert.ok(result.awayVotes > 0);
  assert.equal(result.total, result.homeVotes + result.drawVotes + result.awayVotes);
  assert.equal(result.homePct + result.drawPct + result.awayPct, 100);
}

test('zero votes receive a deterministic non-zero seed', () => {
  const first = deriveShowVotes({ homeVotes: 0, drawVotes: 0, awayVotes: 0 }, 'derby-1');
  const second = deriveShowVotes({ homeVotes: 0, drawVotes: 0, awayVotes: 0 }, 'derby-1');

  assert.deepEqual(first, second);
  assert.equal(first.total, 20);
  assert.ok(first.homeVotes > 0 && first.drawVotes > 0 && first.awayVotes > 0);
});

test('very low counts use the fun-game baseline without a first-voter state', () => {
  const result = deriveShowVotes({ homeVotes: 2, drawVotes: 1, awayVotes: 0 }, 'low');
  assert.equal(result.total, 20);
  assert.ok(Math.min(result.homeVotes, result.awayVotes) >= 8);
});

test('lopsided totals are projected to a close range and cap weaker augmentation', () => {
  const actual = { homeVotes: 90, drawVotes: 5, awayVotes: 5 };
  const result = deriveShowVotes(actual, 'lopsided');

  assertCloseDerbyRange(result);
  assert.ok(result.awayVotes - actual.awayVotes <= actual.awayVotes * 2);
  assert.equal(result.awayVotes - actual.awayVotes, 10);
});

test('balanced totals retain a modest deterministic stronger side', () => {
  const actual = { homeVotes: 45, drawVotes: 10, awayVotes: 45 };
  const result = deriveShowVotes(actual, 'balanced');

  assertCloseDerbyRange(result);
  assert.deepEqual(result, deriveShowVotes(actual, 'balanced'));
});

test('large totals follow one weaker display vote per three stronger real votes', () => {
  const actual = { homeVotes: 6000, drawVotes: 1000, awayVotes: 3000 };
  const result = deriveShowVotes(actual, 'large');

  assertCloseDerbyRange(result);
  assert.equal(result.awayVotes - actual.awayVotes, Math.floor(actual.homeVotes / 3));
  assert.ok(result.awayVotes - actual.awayVotes <= actual.awayVotes * 2);
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
  assert.notEqual(shown.total, consensus.totalVotes);
  assert.equal(consensus.totalVotes, 101);
});
