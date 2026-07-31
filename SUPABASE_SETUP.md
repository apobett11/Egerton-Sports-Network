# Supabase Production Setup & Integration Guide

This guide describes how the application is integrated with the live production Supabase environment (`https://hizfgvgbsguhduxortrx.supabase.co`).

---

## 1. Supabase Environment Configuration

The application communicates exclusively with the live production Supabase project.

```env
# URL for live Supabase production API Gateway
VITE_SUPABASE_URL=https://hizfgvgbsguhduxortrx.supabase.co

# Public anonymous key (safe to include in browser JS compilation)
VITE_SUPABASE_ANON_KEY=your_production_anon_key_here
```

---

## 2. Database Connection Helpers (`src/lib/supabase.ts`)

The project uses `@supabase/supabase-js` to handle all DB operations via the canonical Supabase client:
- **`saveSquadConfiguration`**: Performs an upsert operation. Saves active formation layout (coordinates array) for a team and updates the localStorage Cache-Aside copy.
- **`loadSquadConfiguration`**: Loads the most recent starting XI layout. Integrates with the cache-aside strategy (reads local cache if the DB is offline).
- **`fetchPlayersPaginated`**: Fetches roster list records from the DB using query pagination markers.

### Running testing operations
To debug database connectivity, you can import and trigger `diagnosticQueries` from `@/components/Dashboards/Team/lib/supabaseClient` anywhere in your pages:
```typescript
import { diagnosticQueries } from '@/components/Dashboards/Team/lib/supabaseClient';

// Executing manual check
async function runChecks() {
   await diagnosticQueries.fetchTeamSquad('t-egerton-fc');
   await diagnosticQueries.testRoleBasedAccessRight();
}
```

---

## 3. End-to-End Verification Flow

To test page state updates, lineup changes, and coordinates persistence against the live database:

1. **Boot App**: Start the Vite web server:
   ```bash
   npm run dev
   ```
2. **Login**: Go to the login page and authenticate with valid user credentials.
3. **Field Canvas Test**: 
   - Navigate to the **Tactical Design** tab.
   - Choose a field player node and drag them to edit coordinates.
   - Click **Save Draft Plan** or **Submit Selection**.
   - Review your toast notification messages ensuring they report: `"Lineup and pitch layout successfully submitted and stored in Supabase."`
4. **Data Persistence**: Refresh your web browser page. The player node coordinates should remain exactly in the custom spots you dragged them to, showing they fetch correctly from `squad_configurations` table on load.
5. **Verify RLS Policies Behavior (Role Gating)**:
   - Log out, then log in under public **Guest Mode** (or as `PLAYER` role).
   - Try changing coordinates or saving a draft lineup.
   - Drag/drop changes will be rejected by the UI and policies return error codes if attempted without authorization.
