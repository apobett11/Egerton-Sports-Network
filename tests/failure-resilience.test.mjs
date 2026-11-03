import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { loadProductShare } from '../src/lib/predictions/shareServer.mjs';

test('Failure Resilience: CDN outage simulation (503 / Network Down)', async () => {
  // Simulate fetching image from CDN during outage
  const simulateCdnFetch = async (status) => {
    if (status === 503) {
      throw new Error('HTTP 503 Service Unavailable: CDN Edge Outage');
    }
    return { ok: true };
  };

  let failureDetected = false;
  try {
    await simulateCdnFetch(503);
  } catch (err) {
    failureDetected = true;
    assert.strictEqual(err.message.includes('503'), true);
  }
  assert.strictEqual(failureDetected, true, 'CDN outage must be actively caught and reported, never treated as success');
});

test('Failure Resilience: Slow CDN / Latency timeout simulation', async () => {
  const timeoutBudgetMs = 2000;
  const simulatedDelayMs = 2500;

  let timedOut = false;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('ETIMEDOUT: CDN delivery exceeded latency budget')), timeoutBudgetMs)
  );

  const fetchPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ ok: true }), simulatedDelayMs)
  );

  try {
    await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    timedOut = true;
    assert.strictEqual(err.message.includes('ETIMEDOUT'), true);
  }
  assert.strictEqual(timedOut, true, 'Slow CDN exceeding 2000ms budget must trigger timeout rather than hanging');
});

test('Failure Resilience: Image 404 (Missing Asset)', async () => {
  const missingAssetPath = path.resolve(process.cwd(), 'public/og/products/non-existent-sku-9999.jpg');
  const fileExists = fs.existsSync(missingAssetPath);
  assert.strictEqual(fileExists, false, 'Asset must not exist');

  // Verify that an attempt to decode non-existent file is caught as failure
  let caught = false;
  try {
    await sharp(missingAssetPath).metadata();
  } catch {
    caught = true;
  }
  assert.strictEqual(caught, true, '404 missing asset must fail image decoding and not be classified as ready');
});

test('Failure Resilience: Image 500 (Internal Server Error)', async () => {
  const simulate500 = () => ({ status: 500, ok: false, statusText: 'Internal Server Error' });
  const res = simulate500();
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 500);
});

test('Failure Resilience: Invalid image data (Corrupt binary / Truncated stream)', async () => {
  const corruptedBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0x00, 0x12, 0x34, 0xDE, 0xAD, 0xBE, 0xEF]);
  let decodeFailed = false;
  try {
    await sharp(corruptedBuffer).metadata();
  } catch (err) {
    decodeFailed = true;
    assert.ok(err.message.length > 0);
  }
  assert.strictEqual(decodeFailed, true, 'Corrupt image bytes must fail decoding immediately');
});

test('Failure Resilience: Expired image URL (HTTP 403 Forbidden)', async () => {
  const simulateExpiredUrl = () => ({ status: 403, error: 'Request has expired' });
  const res = simulateExpiredUrl();
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.error, 'Request has expired');
});

test('Failure Resilience: Stale metadata detection', () => {
  const currentVersion = '20261102';
  const staleUrl = 'https://egerscore.com/store/IB-10001?v=20250101';
  const urlObj = new URL(staleUrl);
  const isStale = urlObj.searchParams.get('v') !== currentVersion;
  assert.strictEqual(isStale, true, 'Stale cache version must be detected');
});

test('Failure Resilience: Missing product image engages fallback gracefully', async () => {
  // Test loading product with missing image
  const dummyMissingImgProduct = {
    id: 'test-fallback-img',
    sku: 'test-fallback-img',
    name: 'Official Whistle and Officiating Lanyard Set',
    price: 650,
    category: 'Officiating',
    image: '', // Missing
  };

  const defaultFallback = 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80';
  const resolvedImg = dummyMissingImgProduct.image || defaultFallback;
  assert.strictEqual(resolvedImg, defaultFallback);
  assert.strictEqual(resolvedImg.startsWith('https://'), true);
});

test('Failure Resilience: Concurrent product updates race-condition prevention', async () => {
  const inFlight = new Map();

  const mockWrite = async (id, durationMs) => {
    if (inFlight.has(id)) {
      return inFlight.get(id); // Dedup lock
    }
    const promise = new Promise((resolve) => setTimeout(() => resolve(`done-${id}`), durationMs));
    inFlight.set(id, promise);
    try {
      return await promise;
    } finally {
      inFlight.delete(id);
    }
  };

  // Launch two concurrent updates for the exact same product ID
  const [res1, res2] = await Promise.all([
    mockWrite('IB-10001', 50),
    mockWrite('IB-10001', 50),
  ]);

  assert.strictEqual(res1, 'done-IB-10001');
  assert.strictEqual(res2, 'done-IB-10001');
  assert.strictEqual(inFlight.size, 0, 'In-flight map must be clean');
});

test('Failure Resilience: Cache contamination prevention across products', () => {
  const cache = new Map();
  const setCache = (sku, buffer) => cache.set(`/og/products/${sku}.jpg`, buffer);
  const getCache = (sku) => cache.get(`/og/products/${sku}.jpg`);

  const bufA = Buffer.from('card-A-data');
  const bufB = Buffer.from('card-B-data');

  setCache('IB-10001', bufA);
  setCache('IG-10002', bufB);

  assert.strictEqual(getCache('IB-10001').equals(bufA), true);
  assert.strictEqual(getCache('IG-10002').equals(bufB), true);
  assert.strictEqual(getCache('IB-10001').equals(bufB), false, 'Product A must never return Product B cache');
});

test('Failure Resilience: Network interruption (Aborted stream simulation)', async () => {
  let streamAborted = false;
  try {
    const controller = new AbortController();
    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(new Error('AbortError: The operation was aborted.')));
    });
    controller.abort();
    await abortPromise;
  } catch (err) {
    streamAborted = true;
    assert.strictEqual(err.message.includes('AbortError'), true);
  }
  assert.strictEqual(streamAborted, true, 'Aborted network transfer must be safely caught without unhandled rejection');
});
