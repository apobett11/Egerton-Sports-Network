import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

// Ensure scripts directory exists
const scriptDir = path.resolve('scripts');
if (!fs.existsSync(scriptDir)) {
  fs.mkdirSync(scriptDir, { recursive: true });
}

console.log('='.repeat(80));
console.log('🚀 EGERCORE STORE - 1,000 CONCURRENT USERS STRESS TEST SIMULATION');
console.log('='.repeat(80));

// Read catalog data directly from src
const mockProductsRaw = fs.readFileSync(path.resolve('src/JoseCommerce/data/mockProducts.ts'), 'utf8');
const jsonStart = mockProductsRaw.indexOf('[', mockProductsRaw.indexOf('='));
const jsonEnd = mockProductsRaw.lastIndexOf(']');
const catalog = JSON.parse(mockProductsRaw.slice(jsonStart, jsonEnd + 1));
const totalCatalogSize = catalog.length;
console.log(`[Setup] Loaded full authentic catalog of ${totalCatalogSize} products for benchmark simulation.`);

// ---------------------------------------------------------------------
// 1. COMPUTATIONAL & ENGINE CONCURRENCY BENCHMARK (1,000 CONCURRENT USERS)
// ---------------------------------------------------------------------
console.log('\n[Phase 1] Launching 1,000 Concurrent Virtual Users on Store Engine Operations...');

const CONCURRENT_USERS = 1000;
const results = {
  browsing: [],
  cartOperations: [],
  checkoutCalculations: [],
  authValidations: [],
  storageSerialization: []
};

function calculateStats(latencies) {
  if (latencies.length === 0) return { min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p90 = sorted[Math.floor(sorted.length * 0.90)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return {
    count: sorted.length,
    min: Number(sorted[0].toFixed(3)),
    max: Number(sorted[sorted.length - 1].toFixed(3)),
    mean: Number(mean.toFixed(3)),
    p50: Number(p50.toFixed(3)),
    p90: Number(p90.toFixed(3)),
    p95: Number(p95.toFixed(3)),
    p99: Number(p99.toFixed(3))
  };
}

const initialMemory = process.memoryUsage();
const tStart = performance.now();

// Simulate 1,000 distinct concurrent users doing complex parallel workflows
const userPromises = Array.from({ length: CONCURRENT_USERS }).map(async (_, userIdx) => {
  const userId = `usr_${userIdx + 1}`;
  const userType = userIdx % 4; // 0 = Browser, 1 = Shopper, 2 = Checkout, 3 = Account/Auth

  // ACTION 1: Catalog Filtering, Searching, and Sorting
  const tBrowseStart = performance.now();
  const searchTerms = ['jersey', 'boot', 'glove', 'ball', 'whistle', 'bag', 'tape'];
  const term = searchTerms[userIdx % searchTerms.length];
  const selectedClass = ['all', 'team', 'individual', 'training'][userIdx % 4];
  const selectedCat = ['kit', 'goalkeepers', 'fitness-and-training', 'boots-and-balls'][userIdx % 4];

  // Filtering engine simulation
  const filtered = catalog.filter(p => {
    if (selectedClass !== 'all' && p.productClass !== selectedClass) return false;
    if (p.categorySlug !== selectedCat) return false;
    return p.name.toLowerCase().includes(term);
  }).sort((a, b) => (userIdx % 2 === 0 ? a.price - b.price : b.price - a.price));

  const tBrowseEnd = performance.now();
  results.browsing.push(tBrowseEnd - tBrowseStart);

  // ACTION 2: Cart Operations & Local Cache Serialization
  const tCartStart = performance.now();
  const cartItemCount = (userIdx % 4) + 1; // 1 to 4 items
  const userCart = [];
  for (let c = 0; c < cartItemCount; c++) {
    const p = catalog[(userIdx * 3 + c) % catalog.length];
    userCart.push({
      productId: p.id,
      size: ['M', 'L', 'XL', 'Standard'][c % 4],
      color: ['Black', 'White', 'Red', 'Blue'][c % 4],
      quantity: 1 + (c % 2),
      price: p.price
    });
  }
  // LocalStorage JSON serialization simulation
  const serializedCart = JSON.stringify(userCart);
  const deserializedCart = JSON.parse(serializedCart);
  const tCartEnd = performance.now();
  results.cartOperations.push(tCartEnd - tCartStart);
  results.storageSerialization.push(tCartEnd - tCartStart);

  // ACTION 3: Checkout Algorithm & Pricing Computations
  const tCheckoutStart = performance.now();
  const subtotal = deserializedCart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const discountApplied = userIdx % 3 === 0 ? 0.10 : 0; // 10% coupon
  const discountVal = subtotal * discountApplied;
  const shipping = subtotal > 15000 || subtotal === 0 ? 0 : 500;
  const grandTotal = Math.max(0, subtotal - discountVal + shipping);
  const tCheckoutEnd = performance.now();
  results.checkoutCalculations.push(tCheckoutEnd - tCheckoutStart);

  // ACTION 4: Authentication, Input Validation Regex & Rate Limit Check
  const tAuthStart = performance.now();
  const email = `shopper_${userIdx + 1}@egerscore.co.ke`;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);
  
  const password = `Pass${userIdx}#2026`;
  const ALLOWED_SPECIAL_REGEX = /[#$@&(),.!%^&*_\-]/;
  const ILLEGAL_CHARS_REGEX = /[^a-zA-Z0-9#$@&(),.!%^&*_\-]/;
  const isValidLength = password.length <= 10;
  const hasAllowedSpecial = ALLOWED_SPECIAL_REGEX.test(password);
  const hasNoIllegalChars = !ILLEGAL_CHARS_REGEX.test(password);
  
  // Rate limit tracking map simulation
  const attempts = userIdx % 6;
  const isLocked = attempts >= 6;
  const tAuthEnd = performance.now();
  results.authValidations.push(tAuthEnd - tAuthStart);

  return { userId, filteredCount: filtered.length, grandTotal, isValidEmail };
});

await Promise.all(userPromises);
const tTotal = performance.now() - tStart;
const peakMemory = process.memoryUsage();

console.log(`[Phase 1] Completed 1,000 users simulation in ${tTotal.toFixed(2)}ms!`);

// ---------------------------------------------------------------------
// 2. NETWORK CONCURRENCY STRESS TEST (PRODUCTION BUNDLE & ASSET SERVING)
// ---------------------------------------------------------------------
console.log('\n[Phase 2] Simulating Concurrent Network Request Spike (1,000 HTTP Requests)...');

let networkResults = [];
let networkErrors = 0;
let serverPort = 5173;
let serverInstance = null;

const distDir = path.resolve('dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  serverInstance = http.createServer((req, res) => {
    let rawPath = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(distDir, rawPath);
    if (rawPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Stress-Test': '1000-users'
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise((resolve) => serverInstance.listen(serverPort, resolve));
  console.log(`[Network] Spun up production server on port ${serverPort}. Launching 1,000 concurrent HTTP requests...`);
}

const netStart = performance.now();
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

const httpPromises = Array.from({ length: CONCURRENT_USERS }).map(async (_, reqIdx) => {
  const reqStart = performance.now();
  try {
    const path = reqIdx % 3 === 0 ? '/dist/assets/index.html' : reqIdx % 3 === 1 ? '/assets/App-DslyXqPA.css' : '/';
    await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${serverPort}${path}`, { agent: httpAgent }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          const reqEnd = performance.now();
          networkResults.push(reqEnd - reqStart);
          resolve();
        });
      });
      req.on('error', (err) => {
        networkErrors++;
        reject(err);
      });
      req.setTimeout(5000, () => {
        req.destroy();
        networkErrors++;
        resolve();
      });
    });
  } catch (e) {
    // recorded in networkErrors
  }
});

await Promise.allSettled(httpPromises);
const netTotal = performance.now() - netStart;
console.log(`[Network] 1,000 HTTP requests completed in ${netTotal.toFixed(2)}ms (Errors: ${networkErrors})`);

if (serverInstance) {
  serverInstance.close();
}

// ---------------------------------------------------------------------
// 3. STATISTICAL AGGREGATION & REPORT
// ---------------------------------------------------------------------
const browseStats = calculateStats(results.browsing);
const cartStats = calculateStats(results.cartOperations);
const checkoutStats = calculateStats(results.checkoutCalculations);
const authStats = calculateStats(results.authValidations);
const netStats = calculateStats(networkResults);

const totalOps = CONCURRENT_USERS * 4;
const opsPerSec = Math.round((totalOps / (tTotal / 1000)));

const heapDiffMB = ((peakMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024)).toFixed(2);
const totalHeapMB = (peakMemory.heapUsed / (1024 * 1024)).toFixed(2);

console.log('\n' + '='.repeat(80));
console.log('📊 COMPREHENSIVE STRESS TEST RESULTS (1,000 CONCURRENT USERS)');
console.log('='.repeat(80));

console.log(`\n• Concurrency Load:       ${CONCURRENT_USERS} Concurrent Users`);
console.log(`• Total Operations:       ${totalOps.toLocaleString()} ops`);
console.log(`• Total Execution Time:   ${tTotal.toFixed(2)} ms`);
console.log(`• Engine Throughput:      ${opsPerSec.toLocaleString()} ops/sec`);
console.log(`• Memory Heap Growth:     +${heapDiffMB} MB (Total Heap Used: ${totalHeapMB} MB)`);

console.log('\nLATENCY BENCHMARKS (PER ACTION):');
console.log('--------------------------------------------------------------------------------');
console.log('Action                  | Mean (ms) | P50 (ms) | P90 (ms) | P95 (ms) | P99 (ms) | Max (ms)');
console.log('--------------------------------------------------------------------------------');
console.log(`Catalog Filter & Sort   | ${browseStats.mean.toFixed(2).padEnd(9)} | ${browseStats.p50.toFixed(2).padEnd(8)} | ${browseStats.p90.toFixed(2).padEnd(8)} | ${browseStats.p95.toFixed(2).padEnd(8)} | ${browseStats.p99.toFixed(2).padEnd(8)} | ${browseStats.max.toFixed(2)}`);
console.log(`Cart & Storage Cache    | ${cartStats.mean.toFixed(2).padEnd(9)} | ${cartStats.p50.toFixed(2).padEnd(8)} | ${cartStats.p90.toFixed(2).padEnd(8)} | ${cartStats.p95.toFixed(2).padEnd(8)} | ${cartStats.p99.toFixed(2).padEnd(8)} | ${cartStats.max.toFixed(2)}`);
console.log(`Checkout Math & Promo   | ${checkoutStats.mean.toFixed(2).padEnd(9)} | ${checkoutStats.p50.toFixed(2).padEnd(8)} | ${checkoutStats.p90.toFixed(2).padEnd(8)} | ${checkoutStats.p95.toFixed(2).padEnd(8)} | ${checkoutStats.p99.toFixed(2).padEnd(8)} | ${checkoutStats.max.toFixed(2)}`);
console.log(`Auth & Regex Validation | ${authStats.mean.toFixed(2).padEnd(9)} | ${authStats.p50.toFixed(2).padEnd(8)} | ${authStats.p90.toFixed(2).padEnd(8)} | ${authStats.p95.toFixed(2).padEnd(8)} | ${authStats.p99.toFixed(2).padEnd(8)} | ${authStats.max.toFixed(2)}`);
if (networkResults.length > 0) {
  console.log(`Network Concurrency     | ${netStats.mean.toFixed(2).padEnd(9)} | ${netStats.p50.toFixed(2).padEnd(8)} | ${netStats.p90.toFixed(2).padEnd(8)} | ${netStats.p95.toFixed(2).padEnd(8)} | ${netStats.p99.toFixed(2).padEnd(8)} | ${netStats.max.toFixed(2)}`);
}
console.log('--------------------------------------------------------------------------------');

// Save json output for analysis
const report = {
  timestamp: new Date().toISOString(),
  concurrentUsers: CONCURRENT_USERS,
  totalOps,
  totalDurationMs: tTotal,
  opsPerSec,
  memory: {
    initialMB: (initialMemory.heapUsed / (1024 * 1024)).toFixed(2),
    peakMB: totalHeapMB,
    deltaMB: heapDiffMB
  },
  metrics: {
    browsing: browseStats,
    cartOperations: cartStats,
    checkoutCalculations: checkoutStats,
    authValidations: authStats,
    network: networkResults.length > 0 ? netStats : null
  }
};

fs.writeFileSync(path.resolve('scripts/stress-report-1000.json'), JSON.stringify(report, null, 2));
console.log('\n[Report Saved] scripts/stress-report-1000.json generated successfully.\n');
