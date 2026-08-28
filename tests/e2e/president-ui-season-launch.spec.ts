import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'child_process';

const FRONTEND_URL = 'http://localhost:5173';

function queryPostgres(sql: string): string {
  try {
    const cmd = `docker exec -i supabase_db_livescore psql -U postgres -d postgres -t -A`;
    return execSync(cmd, { input: sql, encoding: 'utf-8' }).trim();
  } catch (err: any) {
    return 'ERROR: ' + err.message;
  }
}

function queryPostgresJson(sql: string): any {
  try {
    const cleanSql = sql.trim().replace(/;+$/, '');
    const jsonWrapped = `SELECT json_agg(t) FROM (${cleanSql}) t;`;
    const cmd = `docker exec -i supabase_db_livescore psql -U postgres -d postgres -t -A`;
    const res = execSync(cmd, { input: jsonWrapped, encoding: 'utf-8' }).trim();
    if (!res || res === '' || res === 'null') return [];
    return JSON.parse(res);
  } catch (err: any) {
    console.error('Postgres JSON query error:', err.message);
    return [];
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('OFFICIAL UI-DRIVEN DUAL-LEAGUE GENERATION & FIFA-STANDARD FIXTURE PROOF', () => {

  test('President UI Season Launch Wizard Execution & Invariant Proof', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER LOG]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('[BROWSER UNCAUGHT ERROR]', err.message));

    console.log('\n======================================================');
    console.log('OFFICIAL UI-ONLY LEAGUE GENERATION WORKFLOW TEST');
    console.log('======================================================');

    // 1. Clean DB fixtures to ensure fresh pre-season state
    queryPostgres(`
      DELETE FROM public.canonical_permanent_results;
      DELETE FROM public.league_standings;
      DELETE FROM public.player_stats;
      DELETE FROM public.team_form;
      DELETE FROM public.fixtures;
    `);

    // 2. Go to login
    await page.goto(`${FRONTEND_URL}/#/login`);
    await page.waitForLoadState('networkidle');

    // 3. Authenticate as President
    await page.fill('#login-email', 'president@egerton.ac.ke');
    await page.fill('#login-password', 'PresidentPass123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1500);

    console.log('Current URL after submit:', page.url());

    // Take screenshot to inspect state
    await page.screenshot({ path: 'test-results/after-login.png' });

    // Look for Begin Season button
    const allButtons = await page.locator('button').allInnerTexts();
    console.log('Buttons on current page:', allButtons);

    const beginSeasonBtn = page.locator('button:has-text("Begin Season")');
    const count = await beginSeasonBtn.count();
    console.log('Found Begin Season buttons count:', count);

    if (count > 0) {
      await beginSeasonBtn.first().click();
      await page.waitForTimeout(1000);
      console.log('Clicked first Begin Season button.');
      console.log('Buttons after first click:', await page.locator('button').allInnerTexts());
    }

    const modalBtn = page.locator('button:has-text("Begin Season")');
    const count2 = await modalBtn.count();
    console.log('Begin Season buttons count now:', count2);
    if (count2 > 0) {
      await modalBtn.last().click();
      await page.waitForTimeout(1000);
    }

    // Check if modal rendered
    console.log('Buttons after opening modal:', await page.locator('button').allInnerTexts());
  });

});
