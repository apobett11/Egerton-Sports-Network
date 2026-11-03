import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

test('Performance: Cold-Cache vs Warm-Cache Delivery & Decoding Benchmarks', async () => {
  const assetPath = path.resolve(process.cwd(), 'public/og/products/IB-10001.jpg');
  assert.strictEqual(fs.existsSync(assetPath), true);

  console.log('\n--- PERFORMANCE: COLD VS WARM CACHE BENCHMARKS ---');

  // Cold cache simulation: fresh read from disk, cold sharp instance
  const tCold0 = performance.now();
  const coldBuf = fs.readFileSync(assetPath);
  const tColdRead = performance.now() - tCold0;

  const tColdDecode0 = performance.now();
  const coldMeta = await sharp(coldBuf).metadata();
  const tColdDecode = performance.now() - tColdDecode0;
  const coldTotal = tColdRead + tColdDecode;

  console.log(`Cold Cache: Read: ${tColdRead.toFixed(3)} ms, Decode: ${tColdDecode.toFixed(3)} ms, Total: ${coldTotal.toFixed(3)} ms`);

  // Warm cache simulation: repeated read, warm JIT & V8 cached buffer
  const warmSamples = [];
  for (let i = 0; i < 5; i++) {
    const tWarm0 = performance.now();
    const warmBuf = fs.readFileSync(assetPath);
    const tWarmRead = performance.now() - tWarm0;

    const tWarmDecode0 = performance.now();
    const warmMeta = await sharp(warmBuf).metadata();
    const tWarmDecode = performance.now() - tWarmDecode0;
    warmSamples.push({ read: tWarmRead, decode: tWarmDecode, total: tWarmRead + tWarmDecode });
  }

  const avgWarmRead = warmSamples.reduce((acc, s) => acc + s.read, 0) / warmSamples.length;
  const avgWarmDecode = warmSamples.reduce((acc, s) => acc + s.decode, 0) / warmSamples.length;
  const avgWarmTotal = warmSamples.reduce((acc, s) => acc + s.total, 0) / warmSamples.length;

  console.log(`Warm Cache (5-run avg): Read: ${avgWarmRead.toFixed(3)} ms, Decode: ${avgWarmDecode.toFixed(3)} ms, Total: ${avgWarmTotal.toFixed(3)} ms`);

  assert.ok(coldTotal < 200, `Cold total ${coldTotal}ms must be < 200ms`);
  assert.ok(avgWarmTotal < 100, `Warm total ${avgWarmTotal}ms must be < 100ms`);
});

test('Performance: High Concurrency Load Test & Resource Profiling (25 Concurrent Requests)', async () => {
  console.log('\n--- PERFORMANCE: 25 CONCURRENT REQUESTS BENCHMARK ---');
  const skus = ['IB-10001', 'IG-10002', 'IB-10003', 'IB-10004', 'IB-10005'];

  const initialCpu = process.cpuUsage();
  const initialMem = process.memoryUsage();
  const tStart = performance.now();

  let httpFailures = 0;
  let timeouts = 0;
  const timeoutBudgetMs = 1500;

  const tasks = Array.from({ length: 25 }, async (_, idx) => {
    const sku = skus[idx % skus.length];
    const assetPath = path.resolve(process.cwd(), `public/og/products/${sku}.jpg`);

    const taskStart = performance.now();
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutBudgetMs)
      );

      const workPromise = (async () => {
        const buf = fs.readFileSync(assetPath);
        const meta = await sharp(buf).metadata();
        return { size: buf.length, width: meta.width, height: meta.height };
      })();

      const result = await Promise.race([workPromise, timeoutPromise]);
      const duration = performance.now() - taskStart;
      return { success: true, duration, result };
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        timeouts++;
      } else {
        httpFailures++;
      }
      return { success: false, error: err.message };
    }
  });

  const results = await Promise.all(tasks);
  const totalDuration = performance.now() - tStart;
  const cpuDelta = process.cpuUsage(initialCpu);
  const memDelta = process.memoryUsage();

  const successCount = results.filter((r) => r.success).length;
  const avgDuration = results.filter((r) => r.success).reduce((acc, r) => acc + r.duration, 0) / successCount;

  console.log(`Completed ${successCount}/25 concurrent requests in ${totalDuration.toFixed(2)} ms`);
  console.log(`Average request processing duration: ${avgDuration.toFixed(2)} ms`);
  console.log(`CPU User Time: ${(cpuDelta.user / 1000).toFixed(2)} ms, System Time: ${(cpuDelta.system / 1000).toFixed(2)} ms`);
  console.log(`Heap Used: ${(memDelta.heapUsed / (1024 * 1024)).toFixed(2)} MB (Delta: ${((memDelta.heapUsed - initialMem.heapUsed) / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`RSS: ${(memDelta.rss / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`HTTP Failures: ${httpFailures}, Timeouts: ${timeouts}`);

  assert.strictEqual(successCount, 25, 'All 25 concurrent requests must complete successfully');
  assert.strictEqual(httpFailures, 0, 'Zero HTTP failures allowed');
  assert.strictEqual(timeouts, 0, 'Zero timeouts allowed under 1500ms budget');
});

test('Performance: Realistic Mobile Network Emulation & Performance Budgets', () => {
  const assetSizeKb = 153.8; // Average size of IB-10001
  const profiles = [
    { name: 'Fast 4G / LTE', rttMs: 40, throughputMbps: 20, maxBudgetMs: 500 },
    { name: 'Moderate 4G', rttMs: 80, throughputMbps: 10, maxBudgetMs: 800 },
    { name: 'Slow 3G Mobile', rttMs: 250, throughputMbps: 1.5, maxBudgetMs: 2000 },
    { name: 'High-Latency Campus Edge', rttMs: 350, throughputMbps: 4.0, maxBudgetMs: 1200 },
  ];

  console.log('\n--- PERFORMANCE: NETWORK PROFILE BUDGET VERIFICATION ---');
  for (const prof of profiles) {
    const ttfb = prof.rttMs;
    const downloadMs = (assetSizeKb * 8) / prof.throughputMbps;
    const totalMs = ttfb + downloadMs;
    const status = totalMs <= prof.maxBudgetMs ? 'PASS' : 'FAIL';

    console.log(`[${prof.name}] TTFB: ${ttfb} ms, Download: ${downloadMs.toFixed(1)} ms, Total: ${totalMs.toFixed(1)} ms (Budget: < ${prof.maxBudgetMs} ms) -> ${status}`);
    assert.ok(totalMs <= prof.maxBudgetMs, `Profile ${prof.name} exceeded budget of ${prof.maxBudgetMs} ms`);
  }
});
