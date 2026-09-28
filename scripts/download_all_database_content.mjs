import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://hizfgvgbsguhduxortrx.supabase.co';
const ANON_KEY = 'sb_publishable_GQXQug1evzVkDsPxdYRobA_c7nCszDs';

// All known tables in the schema
const ALL_TABLES = [
  // Core Domain
  'competitions',
  'seasons',
  'clubs',
  'teams',
  'players',
  'pitches',
  'referees',
  'profiles',
  // Fixtures & Schedules
  'fixtures',
  'base_fixtures',
  'matchday_schedules',
  // Match Operations & Events
  'match_events',
  'match_lineups',
  'match_reports',
  'match_live_states',
  'match_live_events',
  'match_live_audit_logs',
  'referee_working_sets',
  'canonical_permanent_results',
  'finalization_commands',
  // League Standings & Stats
  'league_standings',
  'team_form',
  'player_stats',
  'historical_standings',
  // Editorial & Engagement
  'news_articles',
  'article_gallery',
  'announcements',
  'feature_feedback_polls',
  'man_of_the_match_nominations',
  'player_of_the_week_votes',
  'player_of_the_week_winners',
  // Team Management & Logistics
  'squad_requests',
  'squad_configurations',
  // SRE / Audit / System
  'anonymous_devices',
  'audit_logs',
  'agent0_logs',
  'admin_error_logs',
  'system_settings'
];

function sanitizeSqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return isFinite(val) ? val.toString() : 'NULL';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateSqlInserts(tableName, rows) {
  if (!rows || rows.length === 0) return `-- Table: ${tableName} (0 rows)\n`;

  const columns = Object.keys(rows[0]);
  const lines = [`-- ========================================================`,
                 `-- Table: ${tableName} (${rows.length} rows)`,
                 `-- ========================================================`];

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valueTuples = chunk.map(row => {
      const vals = columns.map(col => sanitizeSqlVal(row[col]));
      return `(${vals.join(', ')})`;
    });
    lines.push(`INSERT INTO public.${tableName} (${columns.map(c => `"${c}"`).join(', ')})`);
    lines.push(`VALUES\n  ${valueTuples.join(',\n  ')}`);
    lines.push(`ON CONFLICT DO NOTHING;\n`);
  }
  return lines.join('\n') + '\n';
}

async function fetchTableData(client, anonClient, tableName) {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  let activeClient = client;

  // Test read with client first
  let testRes = await activeClient.from(tableName).select('*').range(0, 0);
  if (testRes.error) {
    // Retry with anonClient
    testRes = await anonClient.from(tableName).select('*').range(0, 0);
    if (!testRes.error) {
      activeClient = anonClient;
    } else {
      return { success: false, error: testRes.error.message, rows: [] };
    }
  }

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await activeClient
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) {
      return { success: false, error: error.message, rows: allRows };
    }

    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);

    if (data.length < pageSize) break;
    page++;
  }

  return { success: true, rows: allRows };
}

async function downloadStorageFiles(client, backupDir) {
  console.log('\n--- Backing up Supabase Storage Buckets ---');
  const storageDir = path.join(backupDir, 'storage');
  fs.mkdirSync(storageDir, { recursive: true });

  const buckets = ['team-logos', 'news', 'media', 'avatars'];
  const storageManifest = {};

  for (const bucket of buckets) {
    const { data: rootItems, error } = await client.storage.from(bucket).list();
    if (error) {
      console.log(`[Storage] Bucket '${bucket}' list error:`, error.message);
      continue;
    }
    if (!rootItems || rootItems.length === 0) {
      console.log(`[Storage] Bucket '${bucket}' is empty.`);
      continue;
    }

    const bucketPath = path.join(storageDir, bucket);
    fs.mkdirSync(bucketPath, { recursive: true });
    storageManifest[bucket] = [];

    async function traverseFolder(folderPath = '') {
      const { data: items, error: listErr } = await client.storage.from(bucket).list(folderPath);
      if (listErr || !items) return;

      for (const item of items) {
        const itemRelPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        if (item.id === null && !item.metadata) {
          // Folder
          await traverseFolder(itemRelPath);
        } else {
          // File -> download
          const targetFilePath = path.join(bucketPath, itemRelPath);
          fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
          const { data: blob, error: dlErr } = await client.storage.from(bucket).download(itemRelPath);
          if (dlErr) {
            console.log(`  [Storage] Failed downloading ${bucket}/${itemRelPath}:`, dlErr.message);
          } else {
            const buffer = Buffer.from(await blob.arrayBuffer());
            fs.writeFileSync(targetFilePath, buffer);
            console.log(`  [Storage] Downloaded: ${bucket}/${itemRelPath} (${buffer.length} bytes)`);
            storageManifest[bucket].push({ path: itemRelPath, bytes: buffer.length });
          }
        }
      }
    }

    await traverseFolder('');
  }

  return storageManifest;
}

async function main() {
  console.log('==========================================================');
  console.log('EGERSCORE SUPABASE COMPREHENSIVE DATABASE EXPORT TOOL');
  console.log('==========================================================\n');

  const baseDir = process.cwd();
  const backupDir = path.join(baseDir, 'database_backup');
  const dataDir = path.join(backupDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const authClient = createClient(SUPABASE_URL, ANON_KEY);

  console.log('[Auth] Authenticating as privileged referee role...');
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: 'referee1@gmail.com',
    password: 'referee1'
  });

  if (authError) {
    console.warn('[Auth Warning] Could not authenticate:', authError.message, '- falling back to anon client.');
  } else {
    console.log('[Auth] Authenticated successfully as referee1@gmail.com (ID: ' + authData.user.id + ')');
  }

  const manifest = {
    exported_at: new Date().toISOString(),
    source_url: SUPABASE_URL,
    tables: {},
    total_records: 0
  };

  let sqlDump = `-- ========================================================\n`;
  sqlDump += `-- EGERSCORE DATABASE BACKUP DUMP\n`;
  sqlDump += `-- Exported At: ${manifest.exported_at}\n`;
  sqlDump += `-- Source: ${SUPABASE_URL}\n`;
  sqlDump += `-- ========================================================\n\n`;
  sqlDump += `SET statement_timeout = 0;\n`;
  sqlDump += `SET lock_timeout = 0;\n`;
  sqlDump += `SET client_encoding = 'UTF8';\n`;
  sqlDump += `SET standard_conforming_strings = on;\n\n`;

  console.log('\n--- Exporting Relational Tables ---');
  for (const tableName of ALL_TABLES) {
    process.stdout.write(`Fetching table: ${tableName.padEnd(30)} `);
    const result = await fetchTableData(authClient, anonClient, tableName);

    if (result.success) {
      const count = result.rows.length;
      manifest.tables[tableName] = { status: 'success', count: count };
      manifest.total_records += count;

      // Save JSON
      fs.writeFileSync(path.join(dataDir, `${tableName}.json`), JSON.stringify(result.rows, null, 2), 'utf-8');

      // Append to SQL dump
      sqlDump += generateSqlInserts(tableName, result.rows);
      console.log(`[OK] (${count} rows)`);
    } else {
      manifest.tables[tableName] = { status: 'error', error: result.error, count: 0 };
      console.log(`[FAIL] -> ${result.error}`);
    }
  }

  // Save full SQL dump
  const sqlDumpPath = path.join(backupDir, 'data_dump.sql');
  fs.writeFileSync(sqlDumpPath, sqlDump, 'utf-8');
  console.log(`\n[Dump] Generated SQL restore file: ${sqlDumpPath}`);

  // Download storage objects
  const storageManifest = await downloadStorageFiles(anonClient, backupDir);
  manifest.storage = storageManifest;

  // Save manifest
  const manifestPath = path.join(backupDir, 'backup_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('\n==========================================================');
  console.log('DATABASE BACKUP SUMMARY');
  console.log('==========================================================');
  console.log(`Total Tables Processed: ${ALL_TABLES.length}`);
  console.log(`Total Records Saved:    ${manifest.total_records}`);
  console.log(`Manifest Location:      ${manifestPath}`);
  console.log('==========================================================\n');
}

main().catch(err => {
  console.error('Fatal export error:', err);
  process.exit(1);
});
