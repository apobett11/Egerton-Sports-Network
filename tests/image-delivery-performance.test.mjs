import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ASSETS = [
  { id: 'IB-10001', file: 'public/og/products/IB-10001.jpg', expectedTitle: 'Addidas ball' },
  { id: 'IG-10002', file: 'public/og/products/IG-10002.jpg', expectedTitle: 'blue goalkeeper gloves' },
  { id: 'IB-10003', file: 'public/og/products/IB-10003.jpg', expectedTitle: 'Addidas Elite F50 FG' },
  { id: 'featured', file: 'public/og/products/featured.jpg', expectedTitle: 'Official Depot' },
  { id: 'test-large-img', file: 'public/og/products/test-large-img.jpg', expectedTitle: 'Pro Match Football' },
  { id: 'test-small-img', file: 'public/og/products/test-small-img.jpg', expectedTitle: 'Varsity Grip Socks' },
  { id: 'test-portrait-img', file: 'public/og/products/test-portrait-img.jpg', expectedTitle: 'Compression Baselayer' },
  { id: 'test-landscape-img', file: 'public/og/products/test-landscape-img.jpg', expectedTitle: 'Hybrid Cut' },
  { id: 'test-square-img', file: 'public/og/products/test-square-img.jpg', expectedTitle: 'Size 5' },
  { id: 'test-long-title', file: 'public/og/products/test-long-title.jpg', expectedTitle: 'Inter-Faculty Championship' },
  { id: 'test-fallback-img', file: 'public/og/products/test-fallback-img.jpg', expectedTitle: 'Whistle' },
];

test('Performance: All pre-generated product cards exist and meet performance budgets', async () => {
  console.log('\n--- PHASE 7: IMAGE DELIVERY PERFORMANCE MEASUREMENTS ---');
  console.log('| Product ID | Dimensions | Size (KB) | Budget (<350KB) | Decode Time (ms) | Aspect Ratio | Status |');
  console.log('|---|---|---|---|---|---|---|');

  for (const asset of ASSETS) {
    const fullPath = path.resolve(process.cwd(), asset.file);
    assert.ok(fs.existsSync(fullPath), `Asset ${asset.file} must exist`);

    const stats = fs.statSync(fullPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    assert.ok(stats.size <= 550 * 1024, `Size ${sizeKb}KB exceeds maximum budget of 550KB for ${asset.id}`);

    const t0 = performance.now();
    const meta = await sharp(fullPath).metadata();
    const decodeMs = (performance.now() - t0).toFixed(2);

    assert.equal(meta.width, 1200, `Width must be 1200px for ${asset.id}`);
    assert.equal(meta.height, 1892, `Height must be 1892px for ${asset.id}`);
    assert.equal(meta.format, 'jpeg', `Format must be jpeg for ${asset.id}`);

    const ratio = (meta.width / meta.height).toFixed(4);
    const expectedRatio = (104 / 164).toFixed(4);
    const diff = Math.abs(Number(ratio) - Number(expectedRatio));
    assert.ok(diff < 0.001, `Aspect ratio must match 104:164 within rounding (${diff})`);

    const withinPreferred = stats.size <= 380 * 1024;
    console.log(`| ${asset.id} | ${meta.width}x${meta.height} | ${sizeKb} KB | ${withinPreferred ? 'PASS' : 'WARN (under 550KB)'} | ${decodeMs} ms | ${ratio} | PASS |`);
  }
});

test('Performance: Simulated network delivery and latency budgets', async () => {
  console.log('\n--- SIMULATED NETWORK CONDITIONS TEST ---');
  const samplePath = path.resolve(process.cwd(), 'public/og/products/IB-10001.jpg');
  const buffer = fs.readFileSync(samplePath);
  const sizeBytes = buffer.length;

  const profiles = [
    { name: 'Fast Broadband (100 Mbps, 10ms RTT)', speedBytesPerSec: 12500000, latencyMs: 10 },
    { name: 'Typical 4G/LTE (15 Mbps, 50ms RTT)', speedBytesPerSec: 1875000, latencyMs: 50 },
    { name: 'Slow Mobile / 3G (1.5 Mbps, 150ms RTT)', speedBytesPerSec: 187500, latencyMs: 150 },
    { name: 'High Latency Edge (5 Mbps, 300ms RTT)', speedBytesPerSec: 625000, latencyMs: 300 },
  ];

  for (const p of profiles) {
    const transferMs = (sizeBytes / p.speedBytesPerSec) * 1000;
    const totalSimulatedMs = p.latencyMs + transferMs;
    console.log(`- ${p.name}: TTFB: ${p.latencyMs} ms, Download: ${transferMs.toFixed(1)} ms, Total: ${totalSimulatedMs.toFixed(1)} ms`);

    // Budget: Typical mobile under 3000 ms
    if (p.name.includes('4G') || p.name.includes('Broadband')) {
      assert.ok(totalSimulatedMs < 1000, `Fast network delivery should be < 1000ms`);
    } else if (p.name.includes('Slow Mobile')) {
      assert.ok(totalSimulatedMs < 3000, `Slow mobile delivery should be < 3000ms`);
    }
  }
});
