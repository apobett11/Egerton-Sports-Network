import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, type Route } from '@playwright/test';
import { showVotesForConsensus } from '../src/lib/predictions/voteDisplay.mjs';

function supabaseEnv(): { url: string; key: string } {
  const raw = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  const value = (name: string) => (raw.match(new RegExp(`^${name}=(.+)$`, 'm')) || [])[1]?.trim();
  const url = value('VITE_SUPABASE_URL');
  const key = value('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase URL and anon key are required in .env.local');
  return { url, key };
}

test.describe('Admin 2 votes and predictions', () => {
  test('reads the weekend slate and stored tallies from the database, and refresh reloads only that table', async ({ page }) => {
    test.setTimeout(90000);
    const { url: supabaseUrl, key: anonKey } = supabaseEnv();

    const adminId = 'b6e63390-3116-4dbc-a7a8-65fc13b86a8e';
    const adminEmail = 'apobett11@gmail.com';
    const headerBase64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadBase64 = Buffer.from(JSON.stringify({
      sub: adminId,
      aud: 'authenticated',
      role: 'authenticated',
      email: adminEmail,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin' },
      exp: Math.floor(Date.now() / 1000) + 86400,
    })).toString('base64url');
    const validJwt = `${headerBase64}.${payloadBase64}.mockedsignature`;
    const adminUser = {
      id: adminId,
      aud: 'authenticated',
      role: 'authenticated',
      email: adminEmail,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin' },
      created_at: '2026-08-01T00:00:00.000Z',
    };

    let deviceReads = 0;
    let consensusReads = 0;
    const liveResponses: Array<{ url: string; status: number; body: unknown }> = [];

    page.on('response', async (response) => {
      const responseUrl = response.url();
      if (!responseUrl.startsWith(supabaseUrl)) return;
      const voteFixture = responseUrl.includes('/fixtures') && responseUrl.includes('11111111-1111-1111-1111-111111111111');
      if (!responseUrl.includes('match_consensus_cache') && !voteFixture) return;
      try {
        liveResponses.push({
          url: responseUrl,
          status: response.status(),
          body: await response.json(),
        });
      } catch {
        liveResponses.push({ url: responseUrl, status: response.status(), body: null });
      }
    });

    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const requestUrl = route.request().url();
      if (requestUrl.includes('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: validJwt,
          token_type: 'bearer',
          expires_in: 86400,
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          refresh_token: 'mock-refresh-token',
          user: adminUser,
        }),
      });
    });

    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const requestUrl = route.request().url();
      const liveVoteRead = requestUrl.includes('/rpc/get_next_epl_weekend')
        || requestUrl.includes('/match_consensus_cache')
        || (requestUrl.includes('/fixtures') && requestUrl.includes('11111111-1111-1111-1111-111111111111'));

      if (liveVoteRead) {
        if (requestUrl.includes('/match_consensus_cache')) consensusReads += 1;
        const headers = { ...route.request().headers(), apikey: anonKey, authorization: `Bearer ${anonKey}` };
        return route.continue({ headers });
      }

      if (requestUrl.includes('/anonymous_devices')) deviceReads += 1;

      const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object');
      if (requestUrl.includes('/profiles')) {
        const profile = { id: adminId, email: adminEmail, role: 'admin', first_name: 'System', last_name: 'Admin' };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? profile : [profile]),
        });
      }
      if (requestUrl.includes('/system_settings') && requestUrl.includes('admin_2_security')) {
        const setting = { key: 'admin_2_security', value: { password: 'TestAdmin2Pass!', updated_at: new Date().toISOString() } };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? setting : [setting]),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/0' },
        body: JSON.stringify(isSingle ? {} : []),
      });
    });

    await page.addInitScript(({ id, email, user, token }) => {
      const now = Date.now().toString();
      localStorage.setItem('egerscore_auth_token', JSON.stringify({
        access_token: token,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user,
      }));
      localStorage.setItem('esn_cached_role', 'admin');
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({ id, email, role: 'admin', first_name: 'System', last_name: 'Admin' }));
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('esn_session_start_timestamp', now);
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      localStorage.setItem('esn_admin_2fa_cleared_until', String(Date.now() + 86400000));
      sessionStorage.setItem('esn_admin_2_unlocked', 'true');
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    await page.goto('/#admin');
    await expect(page.locator('text=Operations Center')).toBeVisible({ timeout: 20000 });
    await page.locator('aside button:has-text("Admin 2 Telemetry")').click();
    await expect(page.locator('text=Deep Telemetry & Flow')).toBeVisible({ timeout: 15000 });

    await page.locator('button:has-text("Votes & Predictions")').click();
    const table = page.getByTestId('votes-predictions-table');
    await expect(table).toHaveAttribute('data-state', 'ready', { timeout: 20000 });

    const fixturePayload = [...liveResponses].reverse().find((entry) => entry.url.includes('/fixtures') && entry.status === 200);
    const cachePayload = [...liveResponses].reverse().find((entry) => entry.url.includes('match_consensus_cache') && entry.status === 200);
    expect(fixturePayload, 'fixtures response from the database').toBeTruthy();
    expect(cachePayload, 'consensus response from the database').toBeTruthy();
    expect(fixturePayload!.url.startsWith(supabaseUrl)).toBe(true);
    expect(cachePayload!.url.startsWith(supabaseUrl)).toBe(true);

    const teamName = (team: { name?: string } | { name?: string }[] | null) => {
      const row = Array.isArray(team) ? team[0] : team;
      return row?.name || '';
    };
    const fixtures = fixturePayload!.body as Array<{ id: string; home_team: { name?: string } | { name?: string }[] | null; away_team: { name?: string } | { name?: string }[] | null }>;
    const cacheRows = cachePayload!.body as Array<{
      match_id: string;
      votes_home: number;
      votes_draw: number;
      votes_away: number;
      total_votes: number;
      home_pct: number;
      draw_pct: number;
      away_pct: number;
    }>;
    expect(fixtures.length).toBe(12);
    await expect(page.getByTestId('weekend-vote-match')).toHaveCount(12);

    const cacheById = new Map(cacheRows.map((row) => [row.match_id, row]));
    for (const fixture of fixtures) {
      const cache = cacheById.get(fixture.id);
      const shown = showVotesForConsensus({
        matchId: fixture.id,
        homePct: Number(cache?.home_pct) || 0,
        drawPct: Number(cache?.draw_pct) || 0,
        awayPct: Number(cache?.away_pct) || 0,
        totalVotes: Number(cache?.total_votes) || 0,
        pulseLabel: '',
      }, fixture.id);
      const card = page.locator(`[data-match-id="${fixture.id}"]`);
      const homeName = teamName(fixture.home_team);
      const awayName = teamName(fixture.away_team);
      expect(homeName.length).toBeGreaterThan(0);
      expect(awayName.length).toBeGreaterThan(0);
      await expect(card).toContainText(homeName);
      await expect(card).toContainText(awayName);
      await expect(card.getByTestId(`shown-${fixture.id}-1`)).toHaveText(String(shown.homeVotes));
      await expect(card.getByTestId(`shown-${fixture.id}-X`)).toHaveText(String(shown.drawVotes));
      await expect(card.getByTestId(`shown-${fixture.id}-2`)).toHaveText(String(shown.awayVotes));
      await expect(card.getByTestId(`actual-${fixture.id}-1`)).toHaveText(String(Number(cache?.votes_home) || 0));
      await expect(card.getByTestId(`actual-${fixture.id}-X`)).toHaveText(String(Number(cache?.votes_draw) || 0));
      await expect(card.getByTestId(`actual-${fixture.id}-2`)).toHaveText(String(Number(cache?.votes_away) || 0));
    }

    const devicesBefore = deviceReads;
    const consensusBefore = consensusReads;
    const syncedBefore = await page.locator('text=/Synced:/').first().innerText();

    await page.getByTestId('votes-predictions-refresh').click();
    await expect.poll(() => consensusReads, { timeout: 20000 }).toBeGreaterThan(consensusBefore);
    await expect(table).toHaveAttribute('data-state', 'ready');
    expect(deviceReads).toBe(devicesBefore);
    await expect(page.locator('text=/Synced:/').first()).toHaveText(syncedBefore);

    const refreshedCache = [...liveResponses].reverse().find((entry) => entry.url.includes('match_consensus_cache') && entry.status === 200);
    expect(refreshedCache).toBeTruthy();
    const refreshedRows = refreshedCache!.body as typeof cacheRows;
    const sample = refreshedRows[0];
    const sampleShown = showVotesForConsensus({
      matchId: sample.match_id,
      homePct: Number(sample.home_pct) || 0,
      drawPct: Number(sample.draw_pct) || 0,
      awayPct: Number(sample.away_pct) || 0,
      totalVotes: Number(sample.total_votes) || 0,
      pulseLabel: '',
    }, sample.match_id);
    const sampleCard = page.locator(`[data-match-id="${sample.match_id}"]`);
    await expect(sampleCard.getByTestId(`shown-${sample.match_id}-1`)).toHaveText(String(sampleShown.homeVotes));
    await expect(sampleCard.getByTestId(`actual-${sample.match_id}-1`)).toHaveText(String(Number(sample.votes_home) || 0));
  });
});
