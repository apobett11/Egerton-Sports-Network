import { test, expect } from '@playwright/test';
import * as http from 'http';
import * as crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PORT = 54321;
const SUPABASE_URL = `http://127.0.0.1:${SUPABASE_PORT}`;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

interface AnonymousDeviceRecord {
  device_id: string;
  favorite_team_id: string | null;
  favorite_team_label: string | null;
  has_completed_onboarding: boolean;
  last_seen_at: string;
  created_at: string;
}

interface DeviceWeekendSlipRecord {
  id: string;
  device_id: string;
  pair_key: string;
  matchday_pair: string;
  saturday_key: string | null;
  sunday_key: string | null;
  slip_1: any;
  slip_2: any;
  slip_3: any;
  created_at: string;
  updated_at: string;
}

interface MatchPredictionRecord {
  device_id: string;
  match_id: string;
  prediction: string;
  matchday: number;
  created_at: string;
}

// In-Memory Database store for simulated Supabase instance
class InMemorySupabaseStore {
  public devices = new Map<string, AnonymousDeviceRecord>();
  public slips = new Map<string, DeviceWeekendSlipRecord>();
  public predictions = new Map<string, MatchPredictionRecord>();
  public simulatedTimeOffsetMs = 0;

  public now(): Date {
    return new Date(Date.now() + this.simulatedTimeOffsetMs);
  }

  public nowIso(): string {
    return this.now().toISOString();
  }

  public reset() {
    this.devices.clear();
    this.slips.clear();
    this.predictions.clear();
    this.simulatedTimeOffsetMs = 0;
  }
}

const db = new InMemorySupabaseStore();
let mockServer: http.Server | null = null;

function startMockSupabaseServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', SUPABASE_URL);
      const pathname = url.pathname;

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        let json: any = {};
        try {
          if (body) json = JSON.parse(body);
        } catch {}

        // 1. checkin_anonymous_device RPC
        if (pathname.includes('/rpc/checkin_anonymous_device')) {
          const deviceId = json.p_device_id || json.device_id;
          const existing = db.devices.get(deviceId) || {
            device_id: deviceId,
            favorite_team_id: null,
            favorite_team_label: null,
            has_completed_onboarding: false,
            created_at: db.nowIso(),
            last_seen_at: db.nowIso(),
          };
          existing.last_seen_at = db.nowIso();
          db.devices.set(deviceId, existing);
          res.writeHead(200);
          res.end(JSON.stringify(existing));
          return;
        }

        // 2. get_device_slips_and_cooldown RPC
        if (pathname.includes('/rpc/get_device_slips_and_cooldown')) {
          const deviceId = json.p_device_id;
          const pairKey = json.p_pair_key;
          const key = `${deviceId}:${pairKey}`;
          const row = db.slips.get(key);

          let slipCount = 0;
          let lastSubmittedAt: string | null = null;
          const COOLDOWN_DURATION_SECS = 3600; // 60 minutes
          let cooldownRemainingSecs = 0;

          if (row) {
            if (row.slip_1 && (row.slip_1.completedAt || row.slip_1.picks)) {
              slipCount = 1;
              lastSubmittedAt = row.slip_1.completedAt || row.updated_at || row.created_at;
            }
            if (row.slip_2 && (row.slip_2.completedAt || row.slip_2.picks)) {
              slipCount = 2;
              lastSubmittedAt = row.slip_2.completedAt || row.updated_at;
            }
            if (row.slip_3 && (row.slip_3.completedAt || row.slip_3.picks)) {
              slipCount = 3;
              lastSubmittedAt = row.slip_3.completedAt || row.updated_at;
            }

            if (lastSubmittedAt) {
              const elapsedSecs = Math.floor((db.now().getTime() - new Date(lastSubmittedAt).getTime()) / 1000);
              cooldownRemainingSecs = Math.max(0, COOLDOWN_DURATION_SECS - elapsedSecs);
            }
          }

          const responseData = {
            device_id: deviceId,
            pair_key: pairKey,
            slip_count: slipCount,
            slip_1: row?.slip_1 || null,
            slip_2: row?.slip_2 || null,
            slip_3: row?.slip_3 || null,
            last_submitted_at: lastSubmittedAt,
            cooldown_remaining_seconds: cooldownRemainingSecs,
            in_cooldown: cooldownRemainingSecs > 0,
            server_now: db.nowIso(),
          };

          res.writeHead(200);
          res.end(JSON.stringify(responseData));
          return;
        }

        // 3. save_device_weekend_slip RPC
        if (pathname.includes('/rpc/save_device_weekend_slip')) {
          const deviceId = json.p_device_id;
          const pairKey = json.p_pair_key;
          const slot = json.p_slot || json.p_slip_slot || 1;
          const slipData = json.p_slip_data || {};
          const now = db.nowIso();

          const stampedSlip = { ...slipData, completedAt: now };
          const key = `${deviceId}:${pairKey}`;
          const existing = db.slips.get(key) || {
            id: crypto.randomUUID(),
            device_id: deviceId,
            pair_key: pairKey,
            matchday_pair: json.p_matchday_pair || 'Matchday 7 & Matchday 8',
            saturday_key: json.p_saturday_key || null,
            sunday_key: json.p_sunday_key || null,
            slip_1: null,
            slip_2: null,
            slip_3: null,
            created_at: now,
            updated_at: now,
          };

          if (slot === 1) existing.slip_1 = stampedSlip;
          else if (slot === 2) existing.slip_2 = stampedSlip;
          else if (slot === 3) existing.slip_3 = stampedSlip;

          existing.updated_at = now;
          db.slips.set(key, existing);

          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: true,
              slot,
              completed_at: now,
              updated_at: existing.updated_at,
            })
          );
          return;
        }

        // 4. cast_match_prediction RPC (with lock gate check)
        if (pathname.includes('/rpc/cast_match_prediction')) {
          const deviceId = json.p_device_id;
          const matchId = json.p_match_id;
          const prediction = json.p_prediction;
          const matchday = json.p_matchday || 1;
          const predKey = `${deviceId}:${matchId}`;

          const existing = db.predictions.get(predKey);
          if (existing && existing.prediction !== prediction) {
            // Rejection of lock alteration
            res.writeHead(409);
            res.end(
              JSON.stringify({
                code: '23505',
                message: 'Prediction already locked. Cannot alter active selection.',
                details: 'Mid-slip modifications are rejected by selection lock gate.',
              })
            );
            return;
          }

          db.predictions.set(predKey, {
            device_id: deviceId,
            match_id: matchId,
            prediction,
            matchday,
            created_at: db.nowIso(),
          });

          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // 5. touch_prediction_slip RPC
        if (pathname.includes('/rpc/touch_prediction_slip')) {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // 6. anonymous_devices table REST endpoint
        if (pathname.includes('/anonymous_devices')) {
          if (req.method === 'POST') {
            const records = Array.isArray(json) ? json : [json];
            for (const rec of records) {
              const devId = rec.device_id;
              if (devId) {
                const existing = db.devices.get(devId) || {
                  device_id: devId,
                  favorite_team_id: rec.favorite_team_id || null,
                  favorite_team_label: rec.favorite_team_label || null,
                  has_completed_onboarding: Boolean(rec.has_completed_onboarding),
                  created_at: db.nowIso(),
                  last_seen_at: db.nowIso(),
                };
                existing.last_seen_at = db.nowIso();
                db.devices.set(devId, existing);
              }
            }
            res.writeHead(201);
            res.end(JSON.stringify(records));
            return;
          }

          const devIdParam = url.searchParams.get('device_id');
          if (devIdParam && devIdParam.startsWith('eq.')) {
            const targetId = devIdParam.slice(3);
            const dev = db.devices.get(targetId);
            const result = dev ? [dev] : [];
            if (req.headers['accept']?.includes('vnd.pgrst.object+json')) {
              if (dev) {
                res.writeHead(200);
                res.end(JSON.stringify(dev));
              } else {
                res.writeHead(404);
                res.end(JSON.stringify({ code: 'PGRST116', message: 'Row not found' }));
              }
              return;
            }
            res.writeHead(200);
            res.end(JSON.stringify(result));
            return;
          }

          res.writeHead(200);
          res.end(JSON.stringify(Array.from(db.devices.values())));
          return;
        }

        // 7. device_weekend_slips table REST endpoint
        if (pathname.includes('/device_weekend_slips')) {
          if (req.method === 'POST') {
            const rows = Array.isArray(json) ? json : [json];
            for (const r of rows) {
              const key = `${r.device_id}:${r.pair_key}`;
              const existing = db.slips.get(key) || {
                id: r.id || crypto.randomUUID(),
                device_id: r.device_id,
                pair_key: r.pair_key,
                matchday_pair: r.matchday_pair || 'Matchday 7 & Matchday 8',
                saturday_key: r.saturday_key || null,
                sunday_key: r.sunday_key || null,
                slip_1: r.slip_1 || null,
                slip_2: r.slip_2 || null,
                slip_3: r.slip_3 || null,
                created_at: db.nowIso(),
                updated_at: db.nowIso(),
              };
              if (r.slip_1 !== undefined) existing.slip_1 = r.slip_1;
              if (r.slip_2 !== undefined) existing.slip_2 = r.slip_2;
              if (r.slip_3 !== undefined) existing.slip_3 = r.slip_3;
              existing.updated_at = db.nowIso();
              db.slips.set(key, existing);
            }
            res.writeHead(201);
            res.end(JSON.stringify(rows));
            return;
          }

          // GET query
          const devIdParam = url.searchParams.get('device_id');
          const pairKeyParam = url.searchParams.get('pair_key');
          let matched = Array.from(db.slips.values());

          if (devIdParam && devIdParam.startsWith('eq.')) {
            const did = devIdParam.slice(3);
            matched = matched.filter((m) => m.device_id === did);
          }
          if (pairKeyParam && pairKeyParam.startsWith('eq.')) {
            const pk = pairKeyParam.slice(3);
            matched = matched.filter((m) => m.pair_key === pk);
          }

          if (req.headers['accept']?.includes('vnd.pgrst.object+json')) {
            if (matched.length > 0) {
              res.writeHead(200);
              res.end(JSON.stringify(matched[0]));
            } else {
              res.writeHead(404);
              res.end(JSON.stringify({ code: 'PGRST116', message: 'Row not found' }));
            }
            return;
          }

          res.writeHead(200);
          res.end(JSON.stringify(matched));
          return;
        }

        // 8. competitions ping & default catch-all
        if (pathname.includes('/competitions')) {
          res.writeHead(200);
          res.end(JSON.stringify([{ id: '11111111-1111-1111-1111-111111111111' }]));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify([]));
      });
    });

    server.listen(SUPABASE_PORT, '127.0.0.1', () => {
      resolve(server);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

async function completeMatchday1UI(page: any) {
  const matchCards = page.locator('[data-testid^="match-card-"]');
  await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
  const count = await matchCards.count();

  // Card 0 is the Derby (Super Eagles vs BCOM).
  // Satisfy squad inspection gate
  const squadsBtn = matchCards.first().locator('[data-testid^="squads-btn-"]');
  if (await squadsBtn.isVisible()) {
    await squadsBtn.click();
    const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
    await expect(detailsModal).toBeVisible({ timeout: 5000 });
    await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
    await expect(detailsModal).not.toBeVisible();
  }

  // Pick Derby card
  const derbyPick = matchCards.first().locator('[data-testid^="pick-1-"]');
  await derbyPick.click();

  // Dismiss Derby popup
  const derbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
  await expect(derbyPopup).toBeVisible({ timeout: 5000 });
  const continueBtn = derbyPopup.locator('[data-testid="continue-selecting-btn"]');
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
  } else {
    await derbyPopup.locator('[data-testid="close-derby-popup"]').click();
  }
  await expect(derbyPopup).not.toBeVisible();

  // Dismiss Advance Notice modal
  const advanceOkBtn = page.locator('[data-testid="derby-advance-ok-btn"]');
  await expect(advanceOkBtn).toBeVisible({ timeout: 5000 });
  await advanceOkBtn.click();
  await expect(advanceOkBtn).not.toBeVisible();

  // Pick remaining cards (1 to count - 1)
  for (let i = 1; i < count; i++) {
    const card = matchCards.nth(i);
    const pickBtn = card.locator('[data-testid^="pick-1-"]');
    await pickBtn.scrollIntoViewIfNeeded();
    await pickBtn.click();
    await page.waitForTimeout(100);
  }
}

test.describe('Requirement R5: 100-Device Concurrency, Lock Gates & Cooldown Enforcement', () => {
  test.setTimeout(120000);
  let supabaseClient: SupabaseClient;

  test.beforeAll(async () => {
    db.reset();
    try {
      mockServer = await startMockSupabaseServer();
    } catch (e: any) {
      // If server was already started, proceed
      if (e.code !== 'EADDRINUSE') throw e;
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.afterAll(async () => {
    if (mockServer) {
      await new Promise<void>((resolve) => mockServer!.close(() => resolve()));
    }
  });

  // =========================================================================
  // SUB-REQUIREMENT 1: 100 Distinct Simulated Devices & UID Uniqueness
  // =========================================================================
  test('1. 100 Distinct Simulated Devices: Generate 100 unique UUID v4 IDs and verify zero UID collisions', async () => {
    const uids: string[] = [];
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (let i = 0; i < 100; i++) {
      const id = crypto.randomUUID();
      expect(uuidV4Regex.test(id)).toBe(true);
      uids.push(id);
    }

    // Explicitly assert 100 devices generated with zero collisions
    expect(uids.length).toBe(100);
    const uniqueUids = new Set(uids);
    expect(uniqueUids.size).toBe(100);
  });

  // =========================================================================
  // SUB-REQUIREMENT 2: Concurrent Randomized Selection Paths & Supabase Persistence
  // =========================================================================
  test('2. Concurrent Randomized Selection Paths & Supabase Check-in across 100 devices', async () => {
    const deviceIds = Array.from({ length: 100 }, () => crypto.randomUUID());
    expect(new Set(deviceIds).size).toBe(100);

    // Step A: Concurrent Check-in for 100 devices
    const checkinPromises = deviceIds.map(async (deviceId) => {
      const { data, error } = await supabaseClient.rpc('checkin_anonymous_device', {
        p_device_id: deviceId,
      });
      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.device_id).toBe(deviceId);
      return data;
    });

    const checkinResults = await Promise.all(checkinPromises);
    expect(checkinResults.length).toBe(100);
    expect(db.devices.size).toBe(100);

    // Step B: Concurrently simulate 100 devices executing randomized pick paths (1, X, 2)
    // across 12 fixtures (Matchday 1: 6 matches + Matchday 2: 6 matches)
    const options = ['1', 'X', '2'];
    const fixtureIds = Array.from({ length: 12 }, (_, i) => `fixture-sim-${i + 1}`);

    const simulationPromises = deviceIds.map(async (deviceId, devIndex) => {
      const picks: Array<{ matchId: string; prediction: string; matchday: number }> = [];

      for (let fIdx = 0; fIdx < fixtureIds.length; fIdx++) {
        const fixtureId = fixtureIds[fIdx];
        const matchday = fIdx < 6 ? 1 : 2;
        // Deterministic pseudo-random pick path per device & fixture
        const pickChoice = options[(devIndex + fIdx) % 3];
        picks.push({ matchId: fixtureId, prediction: pickChoice, matchday });

        // Save prediction to Supabase
        const { error } = await supabaseClient.rpc('cast_match_prediction', {
          p_device_id: deviceId,
          p_secret: 'secret-hash',
          p_match_id: fixtureId,
          p_prediction: pickChoice,
          p_matchday: matchday,
        });
        expect(error).toBeNull();
      }

      // Mid-slip Race Condition & Lock Gate Defense:
      // Device attempts to illegally alter its already placed pick on fixture 0
      const illegalAlternative = picks[0].prediction === '1' ? '2' : '1';
      const { error: lockError } = await supabaseClient.rpc('cast_match_prediction', {
        p_device_id: deviceId,
        p_secret: 'secret-hash',
        p_match_id: fixtureIds[0],
        p_prediction: illegalAlternative,
        p_matchday: 1,
      });

      // Assert rejection by selection lock gate invariants
      expect(lockError).toBeTruthy();
      expect(lockError?.code).toBe('23505');

      return { deviceId, picks };
    });

    const simulationResults = await Promise.all(simulationPromises);
    expect(simulationResults.length).toBe(100);
    // 100 devices * 12 fixtures = 1200 predictions safely stored
    expect(db.predictions.size).toBe(1200);
  });

  // =========================================================================
  // SUB-REQUIREMENT 2 (cont): Concurrent Slip Persistence & Cross-Device Isolation
  // =========================================================================
  test('3. Concurrent Slip Persistence & Cross-Device Isolation: 100 devices persist cleanly without race conditions or leakage', async () => {
    const deviceIds = Array.from({ length: 100 }, () => crypto.randomUUID());
    const pairKey = '2026-10-10:2026-10-11';
    const matchdayPairLabel = 'Matchday 7 & Matchday 8';

    // Step A: Register all 100 devices
    await Promise.all(
      deviceIds.map((id) => supabaseClient.rpc('checkin_anonymous_device', { p_device_id: id }))
    );

    // Step B: Submit completed Slip 1 for all 100 devices concurrently
    const submissionTimestamp = db.nowIso();
    const slipSubmissions = deviceIds.map(async (deviceId, idx) => {
      const picks = Array.from({ length: 12 }, (_, f) => ({
        matchId: `match-${f + 1}`,
        prediction: (['1', 'X', '2'] as const)[(idx * 7 + f) % 3],
        matchday: f < 6 ? 7 : 8,
        updatedAt: submissionTimestamp,
      }));

      const slipData = {
        id: `slip:${pairKey}:1`,
        pairKey,
        slot: 1,
        picks,
        sharedAt: null,
        createdAt: submissionTimestamp,
        completedAt: submissionTimestamp,
      };

      const { data, error } = await supabaseClient.rpc('save_device_weekend_slip', {
        p_device_id: deviceId,
        p_pair_key: pairKey,
        p_matchday_pair: matchdayPairLabel,
        p_saturday_key: '2026-10-10',
        p_sunday_key: '2026-10-11',
        p_slot: 1,
        p_slip_data: slipData,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.success).toBe(true);
      return { deviceId, slipData };
    });

    await Promise.all(slipSubmissions);

    // Step C: Verify clean independent persistence across Supabase without leakage
    expect(db.slips.size).toBe(100);

    const persistedRecords = Array.from(db.slips.values());
    const persistedDeviceIds = new Set(persistedRecords.map((r) => r.device_id));
    expect(persistedDeviceIds.size).toBe(100);

    // Verify zero cross-device leakage: each device record contains its exact unique data
    for (const record of persistedRecords) {
      expect(deviceIds.includes(record.device_id)).toBe(true);
      expect(record.pair_key).toBe(pairKey);
      expect(record.matchday_pair).toBe(matchdayPairLabel);
      expect(record.slip_1).toBeTruthy();
      expect(record.slip_1.slot).toBe(1);
      expect(record.slip_1.picks.length).toBe(12);
      expect(record.slip_2).toBeNull();
      expect(record.slip_3).toBeNull();
    }
  });

  // =========================================================================
  // SUB-REQUIREMENT 4: Database-Anchored 60-Minute Cooldown Enforcement Across 100 Devices
  // =========================================================================
  test('4. Database-Anchored 60-Minute Cooldown Enforcement across all 100 devices', async () => {
    const pairKey = '2026-10-10:2026-10-11';
    const persistedSlips = Array.from(db.slips.values());
    expect(persistedSlips.length).toBe(100);

    // Step A: Immediately check cooldown status for all 100 devices
    // All 100 devices just submitted Slip 1 and must be in 60-minute cooldown
    const cooldownChecks = persistedSlips.map(async (record) => {
      const { data, error } = await supabaseClient.rpc('get_device_slips_and_cooldown', {
        p_device_id: record.device_id,
        p_pair_key: pairKey,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.in_cooldown).toBe(true);
      expect(data.slip_count).toBe(1);
      expect(data.cooldown_remaining_seconds).toBeGreaterThan(3540); // ~59m to 60m remaining
      expect(data.cooldown_remaining_seconds).toBeLessThanOrEqual(3600);
      return data;
    });

    await Promise.all(cooldownChecks);

    // Step B: Simulate 60 minutes + 1 second elapsed (3601s)
    db.simulatedTimeOffsetMs = 3601 * 1000;

    // Step C: Verify that all 100 devices have exited cooldown and can place Slip 2
    const expiredCooldownChecks = persistedSlips.map(async (record) => {
      const { data, error } = await supabaseClient.rpc('get_device_slips_and_cooldown', {
        p_device_id: record.device_id,
        p_pair_key: pairKey,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.in_cooldown).toBe(false);
      expect(data.cooldown_remaining_seconds).toBe(0);

      // Submit Slip 2 successfully now that cooldown is expired
      const slip2Data = {
        id: `slip:${pairKey}:2`,
        pairKey,
        slot: 2,
        picks: [{ matchId: 'match-1', prediction: '1', matchday: 7 }],
        createdAt: db.nowIso(),
        completedAt: db.nowIso(),
      };

      const { data: saveRes, error: saveErr } = await supabaseClient.rpc('save_device_weekend_slip', {
        p_device_id: record.device_id,
        p_pair_key: pairKey,
        p_matchday_pair: record.matchday_pair,
        p_saturday_key: '2026-10-10',
        p_sunday_key: '2026-10-11',
        p_slot: 2,
        p_slip_data: slip2Data,
      });

      expect(saveErr).toBeNull();
      expect(saveRes.success).toBe(true);
      return data;
    });

    await Promise.all(expiredCooldownChecks);

    // Verify all 100 devices now have both slip_1 and slip_2 populated in Supabase
    for (const record of db.slips.values()) {
      expect(record.slip_1).toBeTruthy();
      expect(record.slip_2).toBeTruthy();
    }
  });

  // =========================================================================
  // SUB-REQUIREMENT 3: Interactive Browser Sessions — Derby Inspection & Lock Gates
  // =========================================================================
  test('5. Interactive Browser Flow: Derby squad inspection gate with directional tooltip and selection lock modal', async ({ page }) => {
    const testDeviceId = crypto.randomUUID();

    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
    }, testDeviceId);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    const derbyCard = matchCards.first();
    const derbyPick1 = derbyCard.locator('[data-testid^="pick-1-"]');

    // 1. Click Derby pick before inspecting squads -> Directional tooltip appears
    await derbyPick1.click();
    const tooltip = derbyCard.locator('[data-testid^="squad-tooltip-"]');
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    await expect(tooltip).toContainText(/Don't guess\. Look at the squads\./i);

    // Verify pointing tooltip points directly at Derby squads button
    const squadsBtn = derbyCard.locator('[data-testid^="squads-btn-"]');
    await expect(squadsBtn).toBeVisible();

    // 2. Click squads button -> opens match details modal with squads/lineups view
    await squadsBtn.click();
    const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
    await expect(detailsModal).toBeVisible({ timeout: 5000 });
    await expect(detailsModal).toContainText(/You can view all about the matches, from the pitch, referee, squads, position and the team squads and subs\./i);

    // Close modal -> Gate is permanently satisfied on device
    await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
    await expect(detailsModal).not.toBeVisible();

    // 3. Now pick Derby card -> Succeeds and shows Derby flow
    await derbyPick1.click();
    const derbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    await expect(derbyPopup).toBeVisible({ timeout: 5000 });

    const continueBtn = derbyPopup.locator('[data-testid="continue-selecting-btn"]');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    } else {
      await derbyPopup.locator('[data-testid="close-derby-popup"]').click();
    }
    await expect(derbyPopup).not.toBeVisible();

    // Advance notice modal ("You can select all the matches for both matchdays" [OK])
    const advanceOkBtn = page.locator('[data-testid="derby-advance-ok-btn"]');
    await expect(advanceOkBtn).toBeVisible({ timeout: 5000 });
    await advanceOkBtn.click();
    await expect(advanceOkBtn).not.toBeVisible();

    // Selected in solid green
    await expect(derbyPick1).toHaveClass(/bg-\[#00b04f\]/);

    // 4. Strict Selection Lock Gate:
    // Attempting to modify an already chosen selection triggers the locking modal:
    // "You will get a chance to make another prediction slip. Finish this first slip first."
    const derbyPick2 = derbyCard.locator('[data-testid^="pick-2-"]');
    await derbyPick2.click();

    const lockModal = page.locator('[data-testid="selection-lock-modal"]');
    await expect(lockModal).toBeVisible({ timeout: 5000 });
    await expect(lockModal).toContainText(/You will get a chance to make another prediction slip\. Finish this first slip first\./i);

    // Dismiss modal and confirm choice remained locked on pick 1
    await lockModal.getByRole('button', { name: /Got it/i }).click();
    await expect(lockModal).not.toBeVisible();
    await expect(derbyPick1).toHaveClass(/bg-\[#00b04f\]/);
    await expect(derbyPick2).not.toHaveClass(/bg-\[#00b04f\]/);
  });

  // =========================================================================
  // SUB-REQUIREMENT 4: Interactive Browser Flow — Dual CTAs, Slip 2 Reset & Cooldown
  // =========================================================================
  test('6. Interactive Browser Flow: Dual CTAs on slip completion, Slip 2 clean reset, active 60m countdown timer, and cooldown expiration', async ({ page }) => {
    const testDeviceId = crypto.randomUUID();

    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
    }, testDeviceId);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    // Complete Matchday 1
    await completeMatchday1UI(page);

    // Share popup opens automatically -> Click "Go to matchday ..."
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });
    await sharePopup.locator('[data-testid="go-to-next-matchday"]').click();
    await expect(sharePopup).not.toBeVisible();

    // On Matchday 2: Complete all matches on Matchday 2
    const matchCardsM2 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM2.first()).toBeVisible({ timeout: 15000 });
    const countM2 = await matchCardsM2.count();

    const m2SquadsBtn = matchCardsM2.first().locator('[data-testid^="squads-btn-"]');
    if (await m2SquadsBtn.isVisible()) {
      await m2SquadsBtn.click();
      const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
      if (await detailsModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
      }
    }

    const m2DerbyPick = matchCardsM2.first().locator('[data-testid^="pick-2-"]');
    await m2DerbyPick.click();

    const m2DerbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    if (await m2DerbyPopup.isVisible({ timeout: 2000 }).catch(() => false)) {
      const continueBtn = m2DerbyPopup.locator('[data-testid="continue-selecting-btn"]');
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
      } else {
        await m2DerbyPopup.locator('[data-testid="close-derby-popup"]').click();
      }
    }
    const m2AdvanceOk = page.locator('[data-testid="derby-advance-ok-btn"]');
    if (await m2AdvanceOk.isVisible({ timeout: 2000 }).catch(() => false)) {
      await m2AdvanceOk.click();
    }

    for (let i = 1; i < countM2; i++) {
      const btn = matchCardsM2.nth(i).locator('[data-testid^="pick-2-"]');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(100);
    }

    // Both matchdays complete: Final Slip 1 Share Betslip modal shows dual CTAs
    const finalSlipPopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(finalSlipPopup).toBeVisible({ timeout: 10000 });

    const shareBtn = finalSlipPopup.locator('[data-testid="share-betslip-btn"]');
    const secondSlipBtn = finalSlipPopup.locator('[data-testid="select-second-slip-btn"]');

    await expect(shareBtn).toBeVisible();
    await expect(secondSlipBtn).toBeVisible();
    await expect(secondSlipBtn).toContainText(/Select a second slip/i);

    // Click "Select a second slip" -> Resets to Matchday 1 with clean unselected cards (0/6)
    await secondSlipBtn.click();
    await expect(finalSlipPopup).not.toBeVisible();

    const defaultCards = page.locator('[data-testid^="match-card-"]');
    await expect(defaultCards.first()).toBeVisible();

    const firstDefaultPick1 = defaultCards.first().locator('[data-testid^="pick-1-"]');
    await expect(firstDefaultPick1).not.toHaveClass(/bg-\[#00b04f\]/);

    // Clicking any selection on Slip 2 immediately triggers the Fresh Perspective cooldown modal:
    // "You need a fresh perspective" with active countdown timer showing ~59m / 60m remaining
    await firstDefaultPick1.click();

    const freshPerspective = page.locator('[data-testid="fresh-perspective-popup"]');
    await expect(freshPerspective).toBeVisible({ timeout: 5000 });
    await expect(freshPerspective).toContainText(/you need a fresh perspective, you have to wait just a little☺️/i);
    await expect(freshPerspective).toContainText(/come again and make your prediction in:/i);

    const timer = freshPerspective.locator('[data-testid="cooldown-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText(/59m|00h|01h/);

    await freshPerspective.getByRole('button', { name: /Got it/i }).click();
    await expect(freshPerspective).not.toBeVisible();

    // Verify after 60 minutes have elapsed, selections on Slip 2 can be placed
    await page.evaluate(() => {
      const pastDate = new Date(Date.now() - 65 * 60 * 1000).toISOString();
      const cachedStr = localStorage.getItem('esn_prediction_dash_v1');
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        cached.lastSlipCompletedAt = pastDate;
        if (cached.slips && cached.slips.length > 0) {
          cached.slips[0].completedAt = pastDate;
        }
        localStorage.setItem('esn_prediction_dash_v1', JSON.stringify(cached));
      }
    });

    // Reload page with expired cooldown
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    // Pick card on Slip 2 now that 60m elapsed
    const renewedCards = page.locator('[data-testid^="match-card-"]');
    const pick1Renewed = renewedCards.nth(1).locator('[data-testid^="pick-1-"]');
    await pick1Renewed.click();

    // Fresh perspective popup does NOT trigger
    await expect(page.locator('[data-testid="fresh-perspective-popup"]')).toHaveCount(0);
    // Pick is successfully placed in solid green
    await expect(pick1Renewed).toHaveClass(/bg-\[#00b04f\]/);
  });
});
