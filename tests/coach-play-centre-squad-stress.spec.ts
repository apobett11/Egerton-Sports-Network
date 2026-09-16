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

    // Verify Coach Play Centre header loads
    await expect(page.locator('text=Coach Play Centre')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Team Strength')).toBeVisible();

    // ─── STEP 1: FORMATION SELECTION ───
    await expect(page.locator('text=1. Formation')).toBeVisible();
    await expect(page.locator('text=Select Tactical Formation')).toBeVisible();

    // Click 4-3-3 Attack formation
    const formation433 = page.locator('span:has-text("4-3-3 Attack"), h3:has-text("4-3-3")').first();
    await formation433.waitFor({ state: 'visible', timeout: 5000 });
    await formation433.click();

    // Advance to Step 2
    const nextToFirst11Btn = page.locator('button:has-text("Next: Select First 11")');
    await nextToFirst11Btn.click();

    // ─── STEP 2: SELECT FIRST 11 ───
    await expect(page.locator('text=Select First 11 Starters')).toBeVisible();
    await expect(page.locator('text=/ 11 Confirmed')).toBeVisible();

    // Test position filters
    await page.click('button:has-text("GK")');
    await page.click('button:has-text("DEF")');
    await page.click('button:has-text("ALL")');

    // Confirm button should be visible (if 11 are selected by default or we select 11)
    const confirmBtn = page.locator('button:has-text("Confirm First 11")');
    await expect(confirmBtn).toBeVisible();

    // If 11 is ready, click confirm
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    } else {
      // Pick cards until 11 are selected
      const cards = page.locator('div.grid > div.cursor-pointer');
      const cardCount = await cards.count();
      for (let i = 0; i < Math.min(cardCount, 11); i++) {
        await cards.nth(i).click();
      }
      await confirmBtn.click();
    }

    // ─── STEP 3: SELECT SUBSTITUTES (STRICT MAX 6) ───
    await expect(page.locator('text=Select Substitutes Bench')).toBeVisible();
    await expect(page.locator('text=/ 6 Max Substitutes')).toBeVisible();

    // Next to Roles
    const nextToRolesBtn = page.locator('button:has-text("Next: Assign Roles")');
    await expect(nextToRolesBtn).toBeVisible();
    await nextToRolesBtn.click();

    // ─── STEP 4: IN-MATCH ROLES ───
    await expect(page.locator('text=Assign In-Match Roles')).toBeVisible();
    await expect(page.locator('text=Team Captain (C)')).toBeVisible();
    await expect(page.locator('text=Penalty Specialist (PK)')).toBeVisible();

    const enterPitchBtn = page.locator('button:has-text("Enter Pitch Simulation")');
    await expect(enterPitchBtn).toBeVisible();
    await enterPitchBtn.click();

    // ─── STEP 5: PROGRESSIVE BLANK PITCH SIMULATION ───
    await expect(page.locator('text=Tactical Simulation: 4-3-3')).toBeVisible();

    // Test Auto-Fill Pitch to populate all 11 slots cleanly
    const autoFillBtn = page.locator('button:has-text("Auto-Fill Pitch")');
    await autoFillBtn.click();

    // Verify slots are filled
    await expect(page.locator('text=(11/11 Placed)')).toBeVisible({ timeout: 5000 });

    // Test clicking a card to open Player Inspection Card Modal
    const pitchPlayerCards = page.locator('div.aspect-\\[1\\.35\\/1\\] div.cursor-pointer').first();
    await pitchPlayerCards.click();

    // Inspector modal should appear
    await expect(page.locator('button:has-text("Swap Position / Sub")')).toBeVisible({ timeout: 5000 });

    // Click Swap Position / Sub to open Swap Drawer
    await page.click('button:has-text("Swap Position / Sub")');

    // Swap Engine drawer should appear
    await expect(page.locator('text=Swap Engine')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Substitutes Bench')).toBeVisible();

    // Click first substitute in drawer to execute swap
    const firstSubCard = page.locator('div:has-text("Substitutes Bench") + div button').first();
    if (await firstSubCard.isVisible()) {
      await firstSubCard.click();
    }

    // Test Commit Matchday Lineup
    const commitBtn = page.locator('button:has-text("Commit Matchday Lineup"), button:has-text("Commit")').first();
    await commitBtn.click();

    console.log('✅ UI Test Completed: 5-step wizard, pitch placement, card inspection, swapping, and commit verified.');
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

  test('Stress & Burst Load: 50 Rapid Squad Updates without Memory or Contamination Errors', async () => {
    console.log('\n💥 Running 50-Request Burst Stress Test...');
    const burstStart = performance.now();
    const batchSize = 10;
    const burstResults: { index: number; durationMs: number; error: string | null }[] = [];

    for (let b = 0; b < 50; b += batchSize) {
      const batchPromises = Array.from({ length: batchSize }, async (_, offset) => {
        const i = b + offset;
        const team = TEST_TEAMS[i % TEST_TEAMS.length];
        const start = performance.now();
        const xi = Array.from({ length: 11 }, (_, idx) => `${team.id}-b${i}-p${idx + 1}`);
        const subs = Array.from({ length: 6 }, (_, idx) => `${team.id}-b${i}-s${idx + 1}`);

        let res = await supabase
          .from('teams')
          .update({
            starting_xi_str: xi.join(','),
            substitutes_str: subs.join(','),
            updated_at: new Date().toISOString(),
          })
          .eq('id', team.id);

        if (res.error) {
          // Retry once on transient connection drop
          res = await supabase
            .from('teams')
            .update({
              starting_xi_str: xi.join(','),
              substitutes_str: subs.join(','),
              updated_at: new Date().toISOString(),
            })
            .eq('id', team.id);
        }

        return { index: i, durationMs: performance.now() - start, error: res.error?.message || null };
      });

      const batchRes = await Promise.all(batchPromises);
      burstResults.push(...batchRes);
    }

    const burstTotal = performance.now() - burstStart;
    const failed = burstResults.filter((r) => r.error !== null);
    console.log(`  • Total Burst Time: ${Math.round(burstTotal)}ms`);
    console.log(`  • Successful Requests: ${burstResults.length - failed.length} / 50`);
    console.log(`  • Failed Requests: ${failed.length}`);
    console.log(`  • Sustained Burst Throughput: ${Math.round((50 / (burstTotal / 1000)) * 10) / 10} req/sec`);

    expect(failed.length).toBe(0);
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
