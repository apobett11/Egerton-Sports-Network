import test from 'node:test';
import assert from 'node:assert/strict';

// Replicate SQL mathematical sigmoid logic for unit testing of algorithmic constraints
function simulateSqlAlgorithm({
  idStr = 'test-id',
  ageSeconds = 0,
  realImpressions = 0,
  realLikes = 0,
  realReposts = 0,
  realReplies = 0,
  realBookmarks = 0,
  isTrending = false,
  isReply = false,
  parentDisplayedImpressions = null,
}) {
  // 1. Bitwise 64-bit seed
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // 2. Strict zero-origin guarantee
  if (ageSeconds <= 0) {
    return {
      displayedImpressions: realImpressions,
      displayedLikes: realLikes,
      displayedReposts: realReposts,
      displayedReplies: realReplies,
      displayedBookmarks: realBookmarks,
      isTrending: false,
    };
  }

  // 3. Deterministic 8-15 hour window
  const windowSec = 28800 + (seed % 25201);
  const t0 = windowSec * 0.45;
  const k = 10.0 / windowSec;

  const clampU = (u) => Math.min(30.0, Math.max(-30.0, u));
  const f0 = 1.0 / (1.0 + Math.exp(clampU(-k * (0.0 - t0))));
  const fT = 1.0 / (1.0 + Math.exp(clampU(-k * (windowSec - t0))));
  const ft = 1.0 / (1.0 + Math.exp(clampU(-k * (ageSeconds - t0))));

  let sNorm = (ft - f0) / (fT - f0);
  sNorm = Math.min(1.0, Math.max(0.0, sNorm));

  // 4. Micro-jitter after 15 min (900s)
  let microJitter = 0.0;
  if (ageSeconds > 900.0) {
    const fade = Math.min(1.0, (ageSeconds - 900.0) / 900.0);
    microJitter = fade * Math.sin(ageSeconds / 900.0 + (seed % 6283) / 1000.0) * 1.5;
  }

  // 5. Activity score and ceiling
  const realEngagements = realLikes * 3 + realReposts * 5 + realReplies * 4 + realBookmarks * 3;
  const fallbackCeiling = 15.0 + (seed % 51);
  const amplification = realImpressions * (8.0 + (seed % 5)) + realEngagements * (15.0 + (seed % 7));
  let inflatedTarget = fallbackCeiling + amplification;

  const trending = isTrending || realImpressions + realEngagements >= 15;
  const targetCap = trending ? 1550 + (seed % 1450) : 320 + (seed % 681);
  inflatedTarget = Math.min(targetCap, inflatedTarget);

  if (isReply) {
    const dampen = 0.12 + (seed % 14) * 0.01;
    inflatedTarget = Math.floor(inflatedTarget * dampen);
  }

  // 6. Displayed metrics
  const simulatedImpressions = Math.max(0, Math.floor(inflatedTarget * sNorm + microJitter));
  let displayedImpressions = realImpressions + simulatedImpressions;

  if (isReply && parentDisplayedImpressions !== null) {
    const maxReplyImpr = Math.floor(parentDisplayedImpressions * 0.65);
    displayedImpressions = Math.min(displayedImpressions, maxReplyImpr);
    displayedImpressions = Math.max(realImpressions, displayedImpressions);
  }

  const likeRatio = 0.035 + (seed % 41) / 1000.0;
  const simulatedLikes = Math.floor(displayedImpressions * likeRatio);
  const displayedLikes = realLikes + simulatedLikes;

  let displayedReposts = realReposts;
  if (!isReply && displayedImpressions > 50) {
    const repostRatio = 0.004 + (seed % 15) / 1000.0;
    const simulatedReposts = Math.floor((displayedImpressions - 50) * repostRatio);
    displayedReposts = realReposts + simulatedReposts;
  }

  const displayedReplies = realReplies; // 100% organic
  const bookmarkRatio = 0.002 + (seed % 7) / 1000.0;
  const simulatedBookmarks = displayedImpressions > 30 ? Math.floor(displayedImpressions * bookmarkRatio) : 0;
  const displayedBookmarks = realBookmarks + simulatedBookmarks;

  return {
    displayedImpressions,
    displayedLikes,
    displayedReposts,
    displayedReplies,
    displayedBookmarks,
    isTrending: isReply ? false : trending,
  };
}

test('Sigmoid Adoption: Strict zero-origin guarantee at age = 0', () => {
  const result = simulateSqlAlgorithm({
    idStr: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    ageSeconds: 0,
    realImpressions: 0,
    realLikes: 0,
    realReposts: 0,
    realReplies: 0,
  });

  assert.equal(result.displayedImpressions, 0);
  assert.equal(result.displayedLikes, 0);
  assert.equal(result.displayedReposts, 0);
  assert.equal(result.displayedReplies, 0);
  assert.equal(result.displayedBookmarks, 0);
});

test('Sigmoid Adoption: Monotonic increase over time without step jumps', () => {
  let prevImpressions = 0;
  for (let t = 0; t <= 36000; t += 300) {
    const res = simulateSqlAlgorithm({
      idStr: 'seed-monotonic-test',
      ageSeconds: t,
      realImpressions: 0,
      realLikes: 0,
      realReposts: 0,
      realReplies: 0,
    });
    // Impressions must never decrease below 0 and must generally rise smoothly
    assert.ok(res.displayedImpressions >= prevImpressions || res.displayedImpressions >= prevImpressions - 2);
    if (res.displayedImpressions > prevImpressions) {
      // Step jumps should be gentle (never jump 500+ in 5 minutes)
      assert.ok(res.displayedImpressions - prevImpressions <= 100);
    }
    prevImpressions = Math.max(prevImpressions, res.displayedImpressions);
  }
});

test('Real Engagement Anchoring: Higher real engagement strictly produces higher ceiling', () => {
  const postInactive = simulateSqlAlgorithm({
    idStr: 'activity-compare',
    ageSeconds: 20000,
    realImpressions: 0,
    realLikes: 0,
    realReposts: 0,
  });

  const postActive = simulateSqlAlgorithm({
    idStr: 'activity-compare',
    ageSeconds: 20000,
    realImpressions: 5,
    realLikes: 2,
    realReposts: 1,
  });

  assert.ok(postActive.displayedImpressions > postInactive.displayedImpressions);
});

test('Instant +1 Optimistic Feedback: Displayed count increases immediately when real count increments', () => {
  const t = 15000;
  const beforeLike = simulateSqlAlgorithm({
    idStr: 'like-test',
    ageSeconds: t,
    realImpressions: 10,
    realLikes: 1,
  });

  const afterLike = simulateSqlAlgorithm({
    idStr: 'like-test',
    ageSeconds: t,
    realImpressions: 10,
    realLikes: 2,
  });

  assert.equal(afterLike.displayedLikes - beforeLike.displayedLikes, 1);
});

test('Parent-Child Clamping: Reply impressions strictly clamped <= 65% of parent', () => {
  const parentImpressions = 400;
  const reply = simulateSqlAlgorithm({
    idStr: 'reply-child',
    ageSeconds: 30000,
    realImpressions: 2,
    isReply: true,
    parentDisplayedImpressions: parentImpressions,
  });

  const maxAllowed = Math.floor(parentImpressions * 0.65);
  assert.ok(reply.displayedImpressions <= maxAllowed);
});

test('Organic Replies: Replies count strictly equals real replies (zero inflation)', () => {
  const res = simulateSqlAlgorithm({
    idStr: 'reply-check',
    ageSeconds: 40000,
    realReplies: 7,
  });

  assert.equal(res.displayedReplies, 7);
});

test('Reply Repost Suppression: Replies never have inflated reposts', () => {
  const reply = simulateSqlAlgorithm({
    idStr: 'reply-reposts',
    ageSeconds: 40000,
    realImpressions: 100,
    realReposts: 0,
    isReply: true,
    parentDisplayedImpressions: 1000,
  });

  assert.equal(reply.displayedReposts, 0);
});

test('Poll Function: Begins with exact 1 vote at age = 0', async () => {
  const getPollBaseline = (pollId, optionsCount, createdAt) => {
    let hash = 0;
    for (let i = 0; i < pollId.length; i++) {
      hash = (hash << 5) - hash + pollId.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const createdTs = createdAt ? new Date(createdAt).getTime() : Date.now();
    const ageSeconds = Math.max(0, (Date.now() - createdTs) / 1000);
    if (ageSeconds <= 5) {
      return { baseTotal: 1, optionShares: Array.from({ length: optionsCount }, (_, idx) => (idx === 0 ? 1 : 0)) };
    }
    return { baseTotal: 1, optionShares: [1] };
  };

  const poll = getPollBaseline('poll-new-001', 3, new Date().toISOString());
  assert.equal(poll.baseTotal, 1);
  assert.equal(poll.optionShares[0], 1);
  assert.equal(poll.optionShares[1], 0);
  assert.equal(poll.optionShares[2], 0);
});

test('Poll Function: Climbs smoothly along sigmoid curve over time', () => {
  // Replicate poll sigmoid math
  function simulatePollSigmoid(pollId, optionsCount, ageSeconds) {
    let hash = 0;
    for (let i = 0; i < pollId.length; i++) {
      hash = (hash << 5) - hash + pollId.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const windowSec = 28800 + (seed % 25201);
    const t0 = windowSec * 0.45;
    const k = 10.0 / windowSec;
    const clampU = (u) => Math.min(30.0, Math.max(-30.0, u));
    const f0 = 1.0 / (1.0 + Math.exp(clampU(-k * (0.0 - t0))));
    const fT = 1.0 / (1.0 + Math.exp(clampU(-k * (windowSec - t0))));
    const ft = 1.0 / (1.0 + Math.exp(clampU(-k * (ageSeconds - t0))));
    const sNorm = Math.min(1.0, Math.max(0.0, (ft - f0) / (fT - f0)));
    const target = 54 + (seed % 127);
    const simulated = Math.max(0, Math.floor((target - 1) * sNorm));
    return 1 + simulated;
  }

  assert.equal(simulatePollSigmoid('poll-test', 2, 0), 1);
  const midVotes = simulatePollSigmoid('poll-test', 2, 18000); // ~5 hours in
  assert.ok(midVotes > 1);
  const saturatedVotes = simulatePollSigmoid('poll-test', 2, 54000); // 15 hours in
  assert.ok(saturatedVotes >= midVotes);
  assert.ok(saturatedVotes >= 54);
});
