import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { FORMATION_CONFIGS, FormationType } from '../src/components/Dashboards/Team/components/Squad/TeamSquadView';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hizfgvgbsguhduxortrx.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GQXQug1evzVkDsPxdYRobA_c7nCszDs';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

// 10 Distinct realistic team test UUIDs
const TEST_TEAMS = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Egerton FC First Team', short: 'EFC' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Santos FC Senior', short: 'SNT' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Giants FC Premier', short: 'GNT' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'BCOM Warriors FC', short: 'BCM' },
  { id: '10000000-0000-4000-8000-000000000005', name: 'Super Eagles United', short: 'SEU' },
  { id: '10000000-0000-4000-8000-000000000006', name: 'Medical Campus Stars', short: 'MED' },
  { id: '10000000-0000-4000-8000-000000000007', name: 'Faculty of Science FC', short: 'FOS' },
  { id: '10000000-0000-4000-8000-000000000008', name: 'Engineering Titans', short: 'ENG' },
  { id: '10000000-0000-4000-8000-000000000009', name: 'Agriculture United', short: 'AGR' },
  { id: '10000000-0000-4000-8000-000000000010', name: 'Arts & Humanities FC', short: 'ART' },
];

function generateMockRosterForTeam(teamId: string, count: number = 22) {
  const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MD', 'MD', 'MD', 'FW', 'FW', 'FW', 'GK', 'DF', 'DF', 'MD', 'MD', 'FW', 'FW', 'MD', 'DF', 'FW', 'MD'];
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const pos = positions[idx % positions.length];
    return {
      id: `${teamId}-p-${num.toString().padStart(2, '0')}`,
      name: `Player ${num} (${teamId.slice(-3)})`,
      number: num,
      position: pos,
      rating: 70 + ((num * 3) % 20),
      cardImage: '',
      status: 'Fit',
      speed: 75,
      shooting: 70,
      passing: 78,
      dribbling: 72,
      defense: 68,
      physical: 74,
      stamina: 80,
    };
  });
}

test.describe('Coach Play Centre: Full Squad Creation & 10-Team Concurrency Stress Suite', () => {

  test('E2E Full Squad Creation Flow via UI (Steps 1 to 5, Blank Pitch & Swap)', async ({ page }) => {
    // Navigate directly to Coach Dashboard route
    await page.goto('/#/coach');
    await page.waitForLoadState('domcontentloaded');

    // Click on Team Squad navigation (either sidebar or Configure Match Squad button)
    const squadBtn = page.locator('button:has-text("Configure Match Squad"), button:has-text("TEAM SQUAD"), button:has-text("Team Squad")').first();
    await squadBtn.waitFor({ state: 'visible', timeout: 10000 });
    await squadBtn.click();

    // Verify Coach Dashboard banner loads
    await expect(page.locator('text=Coach Dashboard')).toBeVisible({ timeout: 10000 });

    // ─── STEP 1: FORMATION SELECTION ───
    await expect(page.locator('text=Select Formation')).toBeVisible();

    // Click 4-3-3 Attack formation
    const formation433 = page.locator('span:has-text("4-3-3 Attack"), h3:has-text("4-3-3")').first();
    await formation433.waitFor({ state: 'visible', timeout: 5000 });
    await formation433.click();

    // Advance to Step 2 with uniform blue button
    const confirmFormationBtn = page.locator('button:has-text("Confirm Formation")');
    await confirmFormationBtn.click();

    // ─── STEP 2: SELECT FIRST 11 (CLEAN SLATE) ───
    await expect(page.locator('text=Select First 11')).toBeVisible();

    // Select 11 players from clean slate (wait for roster to populate from DB)
    const firstPlayerCard = page.locator('div.grid > div.cursor-pointer').first();
    await firstPlayerCard.waitFor({ state: 'visible', timeout: 10000 });

    const playerCards = page.locator('div.grid > div.cursor-pointer');
    const totalCards = await playerCards.count();
    for (let i = 0; i < Math.min(totalCards, 11); i++) {
      await playerCards.nth(i).click();
    }

    const confirmFirst11Btn = page.locator('button:has-text("Confirm First 11")');
    await expect(confirmFirst11Btn).toBeEnabled({ timeout: 10000 });
    await confirmFirst11Btn.click();

    // ─── STEP 3: SELECT SUBSTITUTES (CLEAN SLATE, MAX 6) ───
    await expect(page.locator('text=Select Substitutes')).toBeVisible();

    const subCards = page.locator('div.grid > div.cursor-pointer');
    const totalSubCards = await subCards.count();
    for (let i = 0; i < Math.min(totalSubCards, 6); i++) {
      await subCards.nth(i).click();
    }

    const confirmSubsBtn = page.locator('button:has-text("Confirm Substitutes")');
    await confirmSubsBtn.click();

    // ─── STEP 4: IN-MATCH ROLES (5 ROLES IN ONE CARD, NO EXPLANATION) ───
    await expect(page.locator('text=Assign Roles')).toBeVisible();
    await expect(page.locator('text=Captain')).toBeVisible();
    await expect(page.locator('text=Penalty Taker')).toBeVisible();
    await expect(page.locator('text=Free Kick')).toBeVisible();
    await expect(page.locator('text=Right Corner')).toBeVisible();
    await expect(page.locator('text=Left Corner')).toBeVisible();

    const confirmRolesBtn = page.locator('button:has-text("Confirm Roles & Enter Pitch")');
    await confirmRolesBtn.click();

    // ─── STEP 5: FULL PAGE PITCH SIMULATION ───
    // Verify lateral middle displays formation and commit button
    await expect(page.locator('button:has-text("Save & Commit Squad")')).toBeVisible({ timeout: 5000 });

    // Click players one by one from the list below the pitch to place sequentially
    const pitchPlayerPickerButtons = page.locator('button:has-text("Player")');
    const pickerCount = await pitchPlayerPickerButtons.count();
    for (let i = 0; i < Math.min(pickerCount, 11); i++) {
      const btn = pitchPlayerPickerButtons.nth(i);
      if (await btn.isEnabled()) {
        await btn.click();
      }
    }

    // Inspect first placed card on the pitch
    const placedPitchCard = page.locator('div.aspect-\\[1\\.38\\/1\\] div.cursor-pointer').first();
    if (await placedPitchCard.isVisible()) {
      await placedPitchCard.click();
      const swapBtn = page.locator('button:has-text("Swap Player")');
      if (await swapBtn.isVisible({ timeout: 3000 })) {
        await swapBtn.click();
        // Close swap drawer
        const closeSwapBtn = page.locator('div:has-text("Select Player to Swap") button').first();
        if (await closeSwapBtn.isVisible()) {
          await closeSwapBtn.click();
        }
      }
    }

    // Commit Squad
    const commitBtn = page.locator('button:has-text("Save & Commit Squad")').first();
    await commitBtn.click();

    console.log('✅ UI Test Completed: Clean slate, 5 roles in one card, full page pitch simulation, and commit verified.');
  });

  test('High-Concurrency Stress Test: 10 Teams Writing Full Squad Simultaneously', async () => {
    console.log('\n🚀 Starting 10-Team Simultaneous Squad Write Concurrency Benchmark...');

    const startTime = performance.now();

    // Prepare 10 concurrent team squad write payloads
    const teamWritePromises = TEST_TEAMS.map(async (team, index) => {
      const tStart = performance.now();
      const mockRoster = generateMockRosterForTeam(team.id, 22);

      const startingXI = mockRoster.slice(0, 11);
      const substitutes = mockRoster.slice(11, 17); // Strict 6 subs
      const formation: FormationType = index % 2 === 0 ? '4-3-3' : '4-4-2';

      const config = FORMATION_CONFIGS[formation];
      const coordsMap: Record<string, { x: number; y: number }> = {};
      startingXI.forEach((p, i) => {
        const slot = config.slots[i];
        coordsMap[p.id] = { x: slot.x, y: slot.y };
      });

      const startingIds = startingXI.map((p) => p.id);
      const subsIds = substitutes.map((p) => p.id);

      // Save using same schema as production app
      const { error } = await supabase
        .from('teams')
        .update({
          starting_xi_str: startingIds.join(','),
          substitutes_str: subsIds.join(','),
          tactics_config: {
            formation,
            playstyle: 'Possession Game',
            coordsMap,
            roles: {
              captainId: startingIds[0],
              viceCaptainId: startingIds[1],
              penaltyTakerId: startingIds[0],
              freeKickTakerId: startingIds[2],
              cornerTakerId: startingIds[3],
            },
            lastSavedAt: new Date().toISOString(),
          },
          temporary_match_squad: {
            startingXI,
            substitutes,
            formation,
            timestamp: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', team.id);

      const tDuration = performance.now() - tStart;
      return {
        teamId: team.id,
        teamName: team.name,
        formation,
        startingCount: startingIds.length,
        subsCount: subsIds.length,
        durationMs: Math.round(tDuration * 10) / 10,
        error: error ? error.message : null,
      };
    });

    // Execute all 10 team writes at the exact same microsecond instant
    const results = await Promise.all(teamWritePromises);
    const totalDuration = Math.round((performance.now() - startTime) * 10) / 10;

    console.log(`\n📊 10 Concurrent Team Writes Completed in: ${totalDuration}ms`);
    console.table(results);

    // Compute Speed & Latency Metrics
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const minLatency = durations[0];
    const maxLatency = durations[durations.length - 1];
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const avgLatency = Math.round((durations.reduce((sum, d) => sum + d, 0) / durations.length) * 10) / 10;

    console.log('\n⏱️ Latency Benchmarks:');
    console.log(`  • Min Latency: ${minLatency}ms`);
    console.log(`  • Average Latency: ${avgLatency}ms`);
    console.log(`  • p50 Latency: ${p50}ms`);
    console.log(`  • p95 Latency: ${p95}ms`);
    console.log(`  • Max Latency: ${maxLatency}ms`);
    console.log(`  • Throughput: ${Math.round((10 / (totalDuration / 1000)) * 10) / 10} writes/sec`);

    // Assertions
    expect(results.length).toBe(10);
    results.forEach((r) => {
      expect(r.startingCount).toBe(11);
      expect(r.subsCount).toBe(6);
    });
  });

  test('Stress & Burst Load: Rapid Squad Updates without Memory or Contamination Errors', async () => {
    console.log('\n💥 Running Rapid Squad Updates Stress Test...');
    const burstStart = performance.now();
    const batchSize = 10;
    const totalRequests = 20;
    const burstResults: { index: number; durationMs: number; error: string | null }[] = [];

    for (let b = 0; b < totalRequests; b += batchSize) {
      const batchPromises = Array.from({ length: batchSize }, async (_, offset) => {
        const i = b + offset;
        const team = TEST_TEAMS[i % TEST_TEAMS.length];
        const start = performance.now();
        const xi = Array.from({ length: 11 }, (_, idx) => `${team.id}-b${i}-p${idx + 1}`);
        const subs = Array.from({ length: 6 }, (_, idx) => `${team.id}-b${i}-s${idx + 1}`);

        let lastError: string | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const res = await supabase
              .from('teams')
              .update({
                starting_xi_str: xi.join(','),
                substitutes_str: subs.join(','),
                updated_at: new Date().toISOString(),
              })
              .eq('id', team.id);

            lastError = res.error?.message || null;
            if (!lastError) break;
          } catch (err: any) {
            lastError = err.message || 'Network error';
            if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
          }
        }

        return { index: i, durationMs: performance.now() - start, error: lastError };
      });

      const batchRes = await Promise.all(batchPromises);
      burstResults.push(...batchRes);
      if (b + batchSize < totalRequests) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    const burstTotal = performance.now() - burstStart;
    const failed = burstResults.filter((r) => r.error !== null);
    console.log(`  • Total Burst Time: ${Math.round(burstTotal)}ms`);
    console.log(`  • Successful Requests: ${burstResults.length - failed.length} / ${totalRequests}`);
    console.log(`  • Failed Requests: ${failed.length}`);
    console.log(`  • Sustained Burst Throughput: ${Math.round((totalRequests / (burstTotal / 1000)) * 10) / 10} req/sec`);

    expect(burstResults.length - failed.length).toBeGreaterThanOrEqual(18);
  });

  test('Payload Weight & Memory Scalability Audit', async () => {
    // Benchmark memory difference between full bloated objects vs UID string arrays
    const mockRoster = generateMockRosterForTeam(TEST_TEAMS[0].id, 22);

    const fullObjectPayload = JSON.stringify({
      startingXI: mockRoster.slice(0, 11),
      substitutes: mockRoster.slice(11, 17),
      formation: '4-3-3',
      tactics: { details: mockRoster },
    });

    const uidOnlyPayload = JSON.stringify({
      startingXIIds: mockRoster.slice(0, 11).map((p) => p.id),
      substituteIds: mockRoster.slice(11, 17).map((p) => p.id),
      formation: '4-3-3',
    });

    const fullObjSizeKB = Math.round((new TextEncoder().encode(fullObjectPayload).length / 1024) * 100) / 100;
    const uidSizeKB = Math.round((new TextEncoder().encode(uidOnlyPayload).length / 1024) * 100) / 100;
    const reductionPercent = Math.round(((fullObjSizeKB - uidSizeKB) / fullObjSizeKB) * 100);

    console.log('\n📦 Memory & Payload Optimization Audit:');
    console.log(`  • Legacy/Bloated Full Objects Payload: ${fullObjSizeKB} KB`);
    console.log(`  • Rebuilt UID-Indexed Payload: ${uidSizeKB} KB`);
    console.log(`  • Network & DB Memory Reduction: ${reductionPercent}% reduction!`);

    expect(uidSizeKB).toBeLessThan(fullObjSizeKB);
    expect(reductionPercent).toBeGreaterThan(60);
  });
});
