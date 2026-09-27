# NETWORK EGRESS FORENSIC REPORT

Audit date: 27 Sep 2026  
Scope: frontend network calls, React lifecycles, Supabase queries, storage buckets, and team-logo payloads in `src/`.  
Database size observed in production: **42 MB**. Authenticated MAUs: **18**. Recorded egress: **18.02 GB (361% of the free allowance)**.

The 42 MB figure is the size of the data *at rest*. Egress is every byte Supabase sends out again: PostgREST JSON, Realtime row payloads, Storage downloads, and Auth. A 42 MB database can emit many gigabytes if the same heavy rows are re-read in a loop.

---

## 1. Executive Summary & Root Cause Matrix

The infinite-500-retry hypothesis does **not** match the code. `executeWithRetry` stops after 3 attempts and waits with exponential backoff plus jitter (`src/lib/retryPolicy.ts`). The team API client stops after 3 tries as well (`src/components/Dashboards/Team/lib/apiClient.ts`).

What does match an ~1 GB-per-session bill is a **self-triggering write + full-row re-read loop**, multiplied by **crest bytes stored inside `teams.logo_url`** and by dashboards that `SELECT *` those rows on every Realtime event.

| File & Line Number | Issue Type | Frequency / Trigger | Estimated Data Egress Impact | Severity |
|---|---|---|---|---|
| `src/components/Dashboards/Team/hooks/useTeamDashboard.ts` 184–197 and 321–345 | Write-back loop. A placeholder crest is written back to `teams` (bumping `updated_at`). The same screen is subscribed to **every** `teams` change and reloads itself. | ~every 800 ms for as long as a coach/captain tab stays open and the stored crest is empty, Unsplash, or Dicebear | One open tab: on the order of **1 GB/hour** with URL crests, **tens of GB/hour** if `logo_url` is a base64 data URI. See §3. | **Critical** |
| `src/components/Dashboards/SuperAdmin/hooks/useCacheAnalysisData.ts` 253–331 | Full-table pull. `teams.select('*')` (crest + kits + tactics + squad JSON) plus every lineup and event, on a 12 s timer **and** on any change to teams, fixtures, lineups, events, or profiles. No tab-visibility pause. | Every 12 s while the cache view is enabled; every ~400 ms if the coach loop above is also running | **~2.4 GB/hour** if crests average 400 KB and ~20 teams are embedded in `logo_url`. One overnight admin session covers the whole 18 GB. | **Critical** |
| `src/components/Dashboards/SuperAdmin/hooks/useAdminOperationsData.ts` 288–303 and 885–916 | Fifteen parallel `SELECT *` calls (profiles, teams, players, fixtures, news **including `content`**, announcements, audit logs, match reports, …). Refires on any change to teams, match events, lineups, or fixtures, and again on `TOKEN_REFRESHED`. | Every ~500 ms while those tables are being written | Same crest-bearing `teams` rows, plus article HTML, on every live-match event or coach logo write | **Critical** |
| `src/services/guestSportsService.ts` 195–247 and `src/pages/public/HomePage.tsx` 264–321, 498–564 | Guest fixture fetch **never reads its own cache** before hitting the network. Homepage always loads both league tables, prefetches neighbour dates, preloads 90 days of fixtures, and keeps four Realtime subscriptions that re-fetch standings and the scorer bundle. Public GETs skip the rate limiter (`src/lib/rateLimiter.ts` 303–337). | Every homepage mount, every date change, every `fixtures` cache invalidation, and every `league_standings` / `player_stats` / `match_events` event | Hundreds of KB to several MB per guest session **before** logos. Becomes GB-scale when `updated_at` churn makes `teamLogoCache` re-download every crest. | **High** |
| `src/lib/teamLogoCache.ts` 182–193, `src/components/Dashboards/Team/lib/supabaseClient.ts` 85–122 and 965–1024, referee hook 153–156, `api.ts` `getTeams` 2238–2244 | Crest bytes travel inside JSON. `logo_url` is selected on hot paths. If Storage upload fails, the raw `data:` URI is written into the row. Each team crest is also a separate REST round-trip (`select logo_url, updated_at`). | Once per team on first paint; again whenever `updated_at` changes | 20 teams × 400 KB data URI ≈ **8 MB per sweep**. Storage GETs are extra egress on top of that JSON. | **High** |
| `src/components/Dashboards/Referee/hooks/useRefereeDashboard.ts` 116–314 and 774–778 | Loads **every** fixture plus **every** team crest, then reloads the whole set on any fixture, standings, or match-event change. Offline queue retries every 20 s with no cap and no visibility check. | 350 ms after each live event; queue every 20 s | Full fixture list + all `logo_url` values on every goal/card while a referee tab is open | **High** |
| `src/services/api.ts` 1577–1593 and `src/components/MainFeed/LeagueTable.tsx` 181–204 | `getPlayersOfTheWeek` nests every finished fixture with every `match_events` row. Realtime on `player_stats` and `league_standings` calls it again once that section has loaded. | On table-tab mount (when scrolled) and on each standings/stats write | One response can be a large fraction of the events table, repeated | **Medium** |
| `src/services/matchLiveEngineAdapter.ts` 1059–1064 | `publishRealtime` opens a new `supabase.channel(\`match:${id}\`)` per event and never removes it. | Once per match event | Socket and broadcast overhead that grows with events; not the 18 GB by itself | **Medium** |
| `src/lib/retryPolicy.ts` 12–17, 42–68 | Bounded retry. Max 3, backoff 500 ms → 5 s, jitter. 500 and 429 are retryable; 401/403/404/409/422 are not. | At most 4 attempts per call | Small. Rejected as the primary cause. | **Low** |
| `src/lib/guestCache.ts` 87–97 | 1-hour fixtures/standings invalidation, skipped when `document.visibilityState !== 'visible'`. | 1× / hour / visible tab | Negligible | **Low** |

---

## 2. Forensic Code Deep-Dive

### 2.1 Critical — Coach crest write re-enters its own loader

**File:** `src/components/Dashboards/Team/hooks/useTeamDashboard.ts`  
**Lines:** 184–197 (write) and 321–345 (subscription that calls the writer again).

**Failure mechanism**

1. On mount, `refreshLiveDashboard` loads the coach's team with `fetchAuthenticatedUserTeam`, which is `teams.select('*')` (`supabaseClient.ts` 89–93). That row includes `logo_url`, `kits_config`, `tactics_config`, `temporary_match_squad`, `starting_xi_str`, `substitutes_str`, and `practice_schedule`.
2. If `localStorage` has `team_logo_<id>` **and** the database crest is empty or still contains `unsplash.com` or `dicebear`, the effect writes that cached value back and sets `updated_at` to now.
3. The guard does **not** check whether the cached value is itself an Unsplash/Dicebear URL. Writing the same placeholder still changes `updated_at`.
4. The dashboard is subscribed to `postgres_changes` on the **entire** `teams` table (no `filter` on this team's id).
5. The handler waits 800 ms, calls `invalidateTeamReadCaches()` (which drops the 30 s fixture/standings caches), then calls `refreshLiveDashboard` again.
6. Step 2 is still true, so it writes again. The loop runs until the tab closes or a non-placeholder URL actually sticks.
7. Each cycle also loads the squad, every fixture for the club, both leagues' finished fixtures (standings are recomputed in the client), **every team's `logo_url`** (`fetchTeamLinesmanMatches`, `supabaseClient.ts` 1291), five announcement rows via `select('*')`, and five news rows via `select('*')` including `content`.
8. The `teams` UPDATE is broadcast to every other open subscriber: the admin operations hook, the cache-analysis hook, and any other coach dashboard. Those subscribers start their own full re-reads.

`uploadTeamCrest` (`supabaseClient.ts` 1024) makes the row heavy when Storage is down: `const finalUrl = storageUrl || dataUrl` persists the browser's base64 data URI into `logo_url`. A single failed upload turns a ~50 KB file into a permanent column that every `SELECT *` and every Realtime `teams` payload repeats.

**Exact fix**

Before:

```ts
if (cachedLogo && team) {
  const isDbDefaultOrEmpty = !team.logo_url || team.logo_url.includes('unsplash.com') || team.logo_url.includes('dicebear');
  if (isDbDefaultOrEmpty) {
    team = { ...team, logo_url: cachedLogo };
    supabase
      .from('teams')
      .update({ logo_url: cachedLogo, updated_at: new Date().toISOString() })
      .eq('id', resolvedTeamId)
      .then();
  }
}
```

After:

```ts
const isPlaceholder = (url?: string | null) =>
  !url || url.startsWith('data:') || url.includes('unsplash.com') || url.includes('dicebear');

if (cachedLogo && team && !isPlaceholder(cachedLogo) && isPlaceholder(team.logo_url)) {
  team = { ...team, logo_url: cachedLogo };
  supabase
    .from('teams')
    .update({ logo_url: cachedLogo })
    .eq('id', resolvedTeamId)
    .then(({ error }) => {
      if (error) console.warn('[logo sync] skipped', error.message);
    });
}
```

And narrow the Realtime filter so a crest write cannot schedule another full reload of the same screen:

Before:

```ts
.on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, scheduleRefresh)
```

After:

```ts
.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${resolvedTeamId}` },
  scheduleRefresh,
)
```

Also stop selecting the crest (and the squad JSON) on the identity read. `fetchTeamById` already omits `logo_url` (`supabaseClient.ts` 1466–1470). `fetchAuthenticatedUserTeam` should use that same column list, not `select('*')`.

`uploadTeamCrest` must not fall back to a data URI:

```ts
if (!storageUrl) throw new Error('Logo storage upload failed');
const finalUrl = storageUrl;
```

---

### 2.2 Critical — Cache analysis re-downloads every team row, crest included

**File:** `src/components/Dashboards/SuperAdmin/hooks/useCacheAnalysisData.ts`  
**Lines:** 264–283 (query) and 307–344 (12 s poll + five-table Realtime).

**Failure mechanism**

1. `fetchAll` pages `teams` with `.select('*')` at 1,000 rows per request. `*` includes `logo_url`, `kits_config`, `tactics_config`, and `temporary_match_squad`. The UI only needs a boolean "does this team have a crest?" (`teamHasLogo`, lines 88–94).
2. The same load also pages every lineup (`starting_xi`, `substitutes`) and every match event.
3. A `setInterval` calls `load(false)` every **12 seconds** with no `document.hidden` check.
4. Realtime on `teams`, `fixtures`, `match_lineups`, `match_events`, and `profiles` schedules another full load 400 ms later.
5. `load` coalesces in-flight calls via `queuedRef`, then immediately runs the queued one. A stream of `teams` updates (section 2.1) therefore produces a full dump about once per coach write.
6. `window` `focus` fires yet another dump.

**Exact fix**

Before:

```ts
fetchAll((from, to) => supabase.from('teams').select('*').range(from, to)),
```

```ts
const poll = window.setInterval(() => {
  void load(false);
}, 12000);
```

After:

```ts
fetchAll((from, to) =>
  supabase
    .from('teams')
    .select('id, name, competition_id, coach_id, logo_url, kits_config, kits')
    .range(from, to),
),
```

Prefer a generated boolean over the URL itself: `logo_url` should be replaced by a narrow expression or a later `select('id, logo_url')` only for the one team the admin opens. Until that RPC exists, do not poll:

```ts
const poll = window.setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  void load(false);
}, 5 * 60 * 1000);
```

Drop `teams` from the Realtime list (the coach write loop would otherwise keep this view hot), or ignore events while `document.hidden`.

---

### 2.3 Critical — Admin operations dumps fifteen full tables per live event

**File:** `src/components/Dashboards/SuperAdmin/hooks/useAdminOperationsData.ts`  
**Lines:** 288–303 and 885–916.

**Failure mechanism**

On mount, on `SIGNED_IN` / `TOKEN_REFRESHED` / `USER_UPDATED`, and 500 ms after any insert/update/delete on `teams`, `match_events`, `match_lineups`, or `fixtures`, the hook runs:

| Query | Shape | Why it is heavy |
|---|---|---|
| `profiles` | `select('*')` limit 300 | Avatars and bios |
| `teams` | `select('*')` limit 100 | Crests, kits, tactics, squads |
| `players` | `select('*')` limit 500 | Full player rows |
| `fixtures` | `select('*')` limit 200 | Full fixture rows |
| `news_articles` | `select('*')` limit 100 | Full HTML `content` |
| `announcements` | `select('*')` limit 100 | Full body |
| `audit_logs` | `select('*')` limit 100 | |
| `match_reports` | `select('*')` limit 100 | |
| `admin_error_logs` | `select('*')` limit 30 | |
| `anonymous_devices` | narrow, limit 1000 | Acceptable |
| `match_events` | `id, team_id, fixture_id` limit 1000 | Acceptable |
| `match_lineups` | includes `starting_xi`, `substitutes` limit 200 | JSON blobs |

A live match that writes `match_events` (or the coach loop that writes `teams`) turns this into a repeating multi-megabyte read. Token refresh (Supabase `autoRefreshToken: true` in `src/lib/supabase.ts`) schedules another copy even when nothing on screen changed.

**Exact fix**

Split the overview into scalar counts (`select('id', { count: 'exact', head: true })`) and load a table's columns only when that admin tab is opened. Remove `TOKEN_REFRESHED` from the reload trigger. Gate the Realtime handler:

```ts
const debouncedReload = () => {
  if (document.visibilityState !== 'visible') return;
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => fetchOperationsData(true), 5000);
};
```

Replace `teams.select('*')` with `id, name, short_name, status, competition_id, updated_at`.

---

### 2.4 High — Guest homepage always networks, then stays subscribed

**Files:** `src/services/guestSportsService.ts` 195–247, `src/pages/public/HomePage.tsx` 264–321 and 498–564, `src/lib/rateLimiter.ts` 303–337.

**Failure mechanism**

1. `fetchGuestFixturesNetwork` writes a 60-second cache entry and never consults it. `getGuestFixturesFast` always awaits the network promise. `ApiService.getFixtures` also does not return `guestCache.get` before calling the network.
2. The cache key written inside the guest service is `${comp}_${date}_m${matchday}`. The homepage reads `${comp}_${date}_pall_sall`. Those keys do not match, so the in-memory paint path and the network path are different caches.
3. `useEffect(() => loadFixtures(), [loadFixtures])` plus `useCacheSubscription('fixtures', loadFixtures)` means every fixtures invalidation (including the hourly poll) is another full read.
4. A second effect, 600 ms later, fetches the previous and next play-day if those keys are missing.
5. `preloadPastFixtures` then selects up to 90 days of fixtures unless `all_all_pall_sall` is already cached.
6. Standings are **not** lazy. Lines 498–501 call `loadStandings()` on mount, which runs `getLeagueTable` for both competitions. Each one selects that competition's teams and every finished fixture, then computes the table in the browser. `league_standings` is only a fallback.
7. A Realtime channel (`public-homepage-fixtures-v7`) listens to `fixtures`, `player_stats`, `league_standings`, and `match_events`. Any fixtures change debounces into `getDualPlayerPerformance` (three scorer queries). Any standings change calls `invalidateStandingsCache()` and reloads both tables plus performance. Nothing checks `document.hidden`.
8. `isPublicGuestRead` returns true for every GET against `teams`, `fixtures`, `players`, `match_events`, `player_stats`, `league_standings`, `news_articles`, and any `/rpc/get_*`. Those calls never touch `rateLimiter.acquire`. A loop on the public site is uncapped.

`getTeamsMap` itself is in good shape: it selects `id, name, short_name, color_code, updated_at` and does **not** pull `logo_url` (lines 40–47). The crest cost on the guest home page is the follow-up in `teamLogoCache.fetchOne`, one REST call per team whose `updated_at` stamp changed.

**Exact fix**

Read the cache inside `getGuestFixturesFast` and return it when fresh:

```ts
const fresh = guestCache.get<GuestFixture[]>('fixtures', cacheKey);
if (fresh && fresh.length > 0) return fresh;
```

Use one key shape (`${comp}_${date}`) in both the writer and `HomePage.getCachedFixtures`.

Do not call `loadStandings()` unconditionally. The IntersectionObserver block above it (lines 450–496) is the right gate; delete the effect at lines 498–501.

In the Realtime effect, return early when the tab is hidden, and do not call `loadPerformance` on every fixture tick — the handler already patches `score_home` / `score_away` into local state (lines 533–551).

Remove the blanket GET exemption in `isPublicGuestRead`. Keep an exemption only for the single in-flight fixtures read, and let the limiter cover the rest. The limiter's own ceilings are loose (`global` allows 300 requests / 10 s, `maxBurstDelayMs: 0`), so lowering `maxRequests` on `global` to something like 30 / 10 s is part of the same fix.

---

### 2.5 High — What the crest and the buckets actually weigh

**Storage buckets touched by the client**

| Bucket | Writers | Cache-Control | Notes |
|---|---|---|---|
| `team-logos` | `uploadTeamCrest` | `31536000, immutable` | Preferred crest bucket. Object name is `logos/<teamId>_<Date.now()>.<ext>`. Old objects are never deleted. |
| `media` | crest fallback, journalist fallback, kit fallback | crest: 1 year; kits: `3600` | Shared with news images. |
| `news` | journalist uploads, **and kit photos** (`uploadKitImageToStorage`) | kits: 1 hour | A kit image is a Storage GET on every cache expiry, and it lives in the article bucket. |
| `avatars` | crest fallback only | 1 year if the crest upload lands here | |

`getPublicUrl` does not transfer bytes. Egress starts when an `<img src>` or a `download()` hits that URL. `TeamLogo` renders whatever `peekTeamLogo` / the row URL returns (`src/components/common/TeamLogo.tsx`).

**Two crest representations, very different bills**

| Form stored in `teams.logo_url` | Who pays | Approx size |
|---|---|---|
| `https://<project>.supabase.co/storage/v1/object/public/team-logos/logos/...` | Storage egress, once per browser cache fill. Upload path resizes to max 512 px, WebP/PNG quality 0.88 (`supabaseClient.ts` 909–938). Typical file **30–120 KB**. | 20 crests ≈ **0.6–2.4 MB** per cold visit |
| `data:image/...;base64,...` | **Database egress on every query that selects the column**, and again inside every Realtime `teams` payload. No browser cache. Produced by `uploadTeamCrest` when every bucket upload fails, and by any coach settings save that writes the data URI through `updateCoachCredentialsAndLogo`. | A phone photo that skipped the canvas step is often **0.5–3 MB per team**. 20 teams ≈ **10–60 MB per `select('*')`**. |

Hot queries that still select `logo_url` (or `*`):

- `fetchAuthenticatedUserTeam` — `select('*')` (`supabaseClient.ts` 91, 109, 122)
- `useCacheAnalysisData` — `teams.select('*')`
- `useAdminOperationsData` — `teams.select('*')`
- Referee dashboard — `teams.select('id, name, short_name, logo_url, color_code')` for **all** teams, on every reload (`useRefereeDashboard.ts` 153–156)
- `fetchTeamLinesmanMatches` — `teams.select('id, name, short_name, logo_url')` (`supabaseClient.ts` 1291)
- `ApiService.getTeams` / `getPendingTeams` — explicit `logo_url` (`api.ts` 2244, 2622)
- `teamLogoCache.fetchOne` — `select('logo_url, updated_at')` per team (`teamLogoCache.ts` 183–187)
- Joins that embed `logo_url` on fixture rows: `fixturesService` (president), `MatchEventsDetailView`, `PlayerRatings`, team fixtures fallback at `supabaseClient.ts` 1400–1401

`fetchTeamById` and guest `getTeamsMap` already omit the crest. That is the pattern the other reads should follow: ship `id` + `updated_at`, and let `TeamLogo` resolve one crest from IndexedDB.

`reconcileLogoStamps` (`teamLogoCache.ts` 232–238) re-queues a team whenever `updated_at` differs from the IndexedDB stamp. The coach loop bumps `updated_at` on every write, so every open guest tab re-downloads that crest the next time `getTeamsMap` refreshes (5-minute TTL).

---

### 2.6 High — Referee dashboard re-reads the whole season on every event

**File:** `src/components/Dashboards/Referee/hooks/useRefereeDashboard.ts`  
**Lines:** 130–159, 300–314, 774–778.

**Failure mechanism**

`loadDashboardData` selects every fixture in the competition (no `.eq('referee_id', …)`), plus every team including `logo_url`. It then subscribes to all `fixtures`, `league_standings`, and `match_events` changes and calls `loadDashboardData` again after 350 ms. A goal recorded by any referee reloads every referee's screen.

The offline drain (`setInterval(drainOfflineQueue, 20000)`) retries failed submissions forever. Each failed `verifyOfficialMatchResult` stays in `esn_referee_pending_submissions` and is attempted again. There is no max-attempt counter and no `document.hidden` check. The 1-second countdown interval (lines 591–615) is local state only; it is cleared on unmount and is not a network leak.

**Exact fix**

Filter fixtures with `.or(`referee_id.eq.${uid},assistant_referee_1_id.eq.${uid},...`)`. Select teams as `id, name, short_name, color_code, updated_at` and resolve crests through `publicTeamLogo`. Pause both the Realtime reload and the offline interval when `document.hidden` is true. Cap the offline queue at 3 attempts per item.

---

### 2.7 Medium — Player-of-the-week join and channel leak

`ApiService.getPlayersOfTheWeek` (`api.ts` 1578–1593) selects every `status = FT` fixture with a nested `match_events → players → teams` join and no `.limit()`. `LeagueTable` (`LeagueTable.tsx` 196–203) calls that loader again whenever `league_standings` or `player_stats` changes, once the section has been scrolled into view.

`SupabaseMatchPublisher.publishRealtime` (`matchLiveEngineAdapter.ts` 1059–1064) constructs `supabase.channel(\`match:${update.match_uid}\`)` on every event and never calls `removeChannel`. Reuse one channel per match id.

---

### 2.8 What was checked and is not the leak

- `executeWithRetry` (`retryPolicy.ts` 42–68): hard stop after `maxRetries` (default 3). Delay is `min(500 * 2^(attempt-1) + random(0..200), 5000)`.
- Team `apiClient` (`apiClient.ts` 48–89): 3 retries, only for HTTP ≥ 500 or a thrown network error, then localStorage fallback.
- Guest poll (`guestCache.ts` 87–97): 60 minutes, and it returns immediately when the tab is hidden.
- Auth heartbeat (`AuthContext.tsx` 301–315): one session-uptime write every 5 minutes, and only for a signed-in non-guest.
- Referee countdown `setInterval` at 1 s: UI only, cleared on unmount.
- No `useEffect` was found that fetches and then lists its own fetched state in the dependency array in a tight synchronous loop. The runaway pattern in this repo is **Realtime → setState/write → Realtime**, not a missing dependency array.
- `useLiveMatchRealtime` is called with `autoFetchAll: false` (`App.tsx` 715–718), so the shell does not issue a second full fixture scan beside `HomePage`.

---

## 3. Estimated Egress Calculation

Supabase counts the response body of every REST call, every Realtime payload (the new row), and every Storage object download. It does not count Unsplash URLs (those bytes leave Unsplash, not Supabase) and it does not count `getPublicUrl` (that only builds a string).

### 3.1 Payload sizes used below

| Payload | Measured from the query shape | Planning size |
|---|---|---|
| One team row via `select('*')` with a Storage URL crest | scalars + tactics JSON + kits JSON + squad JSON | **40 KB** |
| Same row when `logo_url` is a base64 data URI | add the image | **40 KB + image (use 400 KB)** |
| All-teams `select('id, name, short_name, logo_url')` | 20 teams | **~20 KB** with URLs, **~8 MB** with 400 KB data URIs |
| Guest fixtures for one date + team map + competitions | narrow columns, no crest | **~15–40 KB** |
| Both standings (finished fixtures × 2 competitions) | narrow columns | **~30–80 KB** |
| 90-day fixture preload | same columns, all rows in window | **~50–200 KB** |
| News `select` including `content`, 5–6 articles | HTML body | **~50–200 KB** |
| Admin 15-query burst | dominated by `teams.*` and `news_articles.*` | **~0.3 MB** with URL crests, **~8–15 MB** with data-URI crests |
| Realtime `teams` UPDATE payload | full new row | same as the team row |

These are code-derived estimates. Confirm the live `logo_url` shape with:

```sql
select
  count(*) as teams,
  count(*) filter (where logo_url like 'data:%') as data_uri_crests,
  pg_size_pretty(sum(octet_length(logo_url))) as logo_url_bytes,
  pg_size_pretty(sum(octet_length(kits_config::text))) as kits_bytes,
  pg_size_pretty(sum(octet_length(tactics_config::text))) as tactics_bytes,
  pg_size_pretty(sum(octet_length(temporary_match_squad::text))) as squad_bytes
from public.teams;
```

If `data_uri_crests > 0`, that column — not the 42 MB headline — is the unit being multiplied.

### 3.2 The loop that reaches 18 GB

Coach tab left open, placeholder crest still in the database, so section 2.1 fires:

```
cycles per hour = 3600 / 0.8 = 4,500
```

**Case A — crests are Storage URLs (lean rows, ~250 KB of JSON per cycle: team row + squad + fixtures + standings scan + news/announcements)**

```
250 KB × 4,500 / hour = 1.125 GB / hour
1.125 GB/hour × 16 hours ≈ 18 GB
```

Sixteen hours is one coach laptop left on the dashboard overnight plus the next morning. Each of those writes also fans out a Realtime payload to every other open admin or coach tab, which then runs its own dump (cases B and C).

**Case B — crests are data URIs (~8 MB just for the all-teams `logo_url` select inside `fetchTeamLinesmanMatches`, every cycle)**

```
8 MB × 4,500 / hour ≈ 36 GB / hour
```

Half an hour of one such tab exceeds 18 GB by itself.

**Case C — cache-analysis view left enabled (12 s poll, `teams.select('*')`)**

```
8 MB × (3600 / 12) = 8 MB × 300 = 2.4 GB / hour
2.4 GB/hour × 7.5 hours ≈ 18 GB
```

If the coach loop is also running, the 400 ms Realtime debounce replaces the 12 s poll and this view tracks case B.

**Case D — quiet guest, no loop (what 18 MAUs should have cost)**

```
~0.4 MB per homepage mount (fixtures + both tables + news + 90-day preload, URL crests)
+ ~1.5 MB cold Storage download of 20 crests (then cached for a year)
× 18 users × 30 visits
≈ 18 × 30 × 1.9 MB ≈ 1.0 GB
```

That is the entire honest guest bill for a month of normal use. The gap between ~1 GB and 18.02 GB is the repeating reads in cases A–C, not an extra population of users.

### 3.3 Worked identity

```
18.02 GB  /  42 MB database  ≈  440 full copies of the database
18.02 GB  /  18 MAUs         ≈  1.00 GB egress per authenticated user
```

440 full copies is what you get from a few hours of `select('*')` on the heaviest table, not from 18 people opening the homepage once.

---

## 4. Hardening & Prevention Checklist

### 4.1 Circuit breaker (hard stop after N failures)

`executeWithRetry` already stops at 3. Two callers still loop with no budget: the coach crest write (section 2.1) and the referee offline drain (every 20 s, forever). Put a shared breaker in front of any reload that was itself triggered by a failed or repeated write:

```ts
const breakers = new Map<string, { failures: number; openUntil: number }>();

export function allowCall(key: string, maxFailures = 3, coolOffMs = 60_000): boolean {
  const now = Date.now();
  const row = breakers.get(key) ?? { failures: 0, openUntil: 0 };
  if (now < row.openUntil) return false;
  breakers.set(key, row);
  return true;
}

export function recordFailure(key: string, maxFailures = 3, coolOffMs = 60_000): void {
  const row = breakers.get(key) ?? { failures: 0, openUntil: 0 };
  row.failures += 1;
  if (row.failures >= maxFailures) {
    row.openUntil = Date.now() + coolOffMs;
    row.failures = 0;
  }
  breakers.set(key, row);
}

export function recordSuccess(key: string): void {
  breakers.delete(key);
}
```

Use `allowCall('coach-logo-sync')` around the `teams.update`, and `allowCall('referee-offline:' + item.id)` inside `drainOfflineQueue`. When the breaker is open, do not write and do not resubscribe.

Also delete the public-GET bypass in `isPublicGuestRead` so a stuck guest loop hits `rateLimiter` (tighten `global.maxRequests` from 300/10 s to 30/10 s).

### 4.2 Stop background work when the tab is hidden

Only `guestCache.startGuestPolling` checks visibility today. Add one listener at app startup and consult it from every poll and every Realtime reload (admin operations, cache analysis, referee, coach, homepage performance reload):

```ts
let tabVisible = typeof document === 'undefined' || document.visibilityState === 'visible';

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    tabVisible = document.visibilityState === 'visible';
  });
}

export function isTabVisible(): boolean {
  return tabVisible;
}
```

```ts
const schedule = () => {
  if (!isTabVisible()) return;
  // existing debounce
};
```

On `visibilitychange` → hidden, `supabase.removeChannel(channel)`. On visible, subscribe again and do a single reload. An open laptop with a backgrounded admin tab should cost zero database egress.

### 4.3 Cache reads so a refresh is not a network read

The guest cache is written and then ignored by `getGuestFixturesFast`. Wire the read path:

1. `guestCache.get(category, key)` before any `supabase.from`.
2. One key format for fixtures: `${competitionId || 'all'}_${YYYY-MM-DD}`.
3. Raise the fixtures TTL from 60 seconds to at least 5 minutes for scheduled matches, and invalidate that one fixture id from the Realtime payload instead of refetching the day.
4. Crests stay in IndexedDB (`esn_team_logos_v1`, already implemented). Do not copy them into `esn_guest_cache_v3_*` and do not select them in list queries.
5. `localStorage` logo keys (`team_logo_<id>`) must store only `https://` Storage URLs. Drop any `data:` value on read so it cannot be written back into Postgres.

### 4.4 Query and bucket rules

- List screens select scalars only. `select('*')` on `teams`, `players`, `news_articles`, `announcements`, `match_reports`, and `audit_logs` is removed from mount paths.
- `logo_url` is selected for at most one team, and only on the profile screen.
- Standings and top scorers come from `league_standings` and `player_stats` (already the narrow tables). Delete the client-side replay of every finished fixture on the homepage mount, and add `.limit()` to `getPlayersOfTheWeek`.
- Crest uploads go to `team-logos` only. Kit photos go to a `kits` bucket, not `news`. Use a stable object path `logos/<teamId>.webp` with `upsert: true` so a re-upload replaces the file instead of orphaning another object.
- Refuse to persist a `data:` URI. If the bucket upload fails, show an error and keep the previous URL.
- Realtime filters are row-scoped (`id=eq.<team id>`, `fixture_id=eq.<id>`). A goal must not reload every referee, every coach, and the admin overview.

---

## 5. Mount-time request inventory

Counts are distinct Supabase REST calls on first paint, assuming cold caches. Realtime is a socket, listed separately. Logo follow-ups assume ~20 teams missing from IndexedDB.

| Surface | REST calls on mount | What they are | Keeps running after paint |
|---|---|---|---|
| **Guest homepage** | **~14–18**, plus up to **20** crest lookups | competitions warmup; fixtures count; play-day index; today's fixtures + teams + competitions; previous/next day; 90-day preload; EPL standings; Championship standings; device check-in; announcements; odds-opened check; news `content`; dual scorer bundle if those sections intersect | Realtime on `fixtures`, `player_stats`, `league_standings`, `match_events`. Each standings event reloads both tables and the scorer bundle. |
| **Referee** | **6**, plus crest bytes inside the teams query | all fixtures (unfiltered); all teams with `logo_url`; competitions; all referees `*`; match events for every fixture id; announcements `*` | Realtime reload of that whole set 350 ms after any fixture, standings, or event write. Offline queue every 20 s. |
| **President** | **8** | `getTeams` (includes `logo_url`), pending teams (includes `logo_url`), leagues, referees `*`, announcements `*`, seasons, pitches `*`, fixtures | No background poll on the dashboard hook. Season-mode operations hook still subscribes to all `fixtures` and `matchday_schedules` changes and refreshes. |
| **Coach / club** | **7+**, and the crest write | `teams.select('*')` for this coach; squad join; fixtures join; standings recomputed from every finished fixture; all teams' `logo_url`; announcements `*`; news `*` | Realtime on **all** `teams`, `fixtures`, `league_standings`, `players`. Placeholder-crest write makes this self-trigger every ~800 ms. |
| **Admin / match controller** | **15** on mount | See the table in §2.3. Dominated by `teams.*`, `players.*`, `news_articles.*` | Same 15 calls again 500 ms after any teams/fixtures/events/lineups change, and on every auth token refresh. Cache-analysis view, when enabled, adds a paged `teams.*` + all lineups + all events every 12 s. |

---

## 6. Verdict

The quota was not burned by 18 people each downloading a 42 MB database once. It was burned by screens that **write a team row and then re-read every heavy column of every team**, with crest bytes sitting in `logo_url`, while the tab stays open.

Fix order:

1. Stop the crest write-back unless the cached URL is a real Storage URL and the database value is still a placeholder. Do not bump `updated_at` as a side effect.
2. Remove `select('*')` / `logo_url` from every list and poll (`useCacheAnalysisData`, `useAdminOperationsData`, referee load, `fetchAuthenticatedUserTeam`, `getTeams`).
3. Filter Realtime subscriptions to the one row the screen is showing, and skip them when `document.hidden`.
4. Make `getGuestFixtures` return the cache it already writes, and stop the homepage from loading both league tables and the 90-day history on every visit.
