# local Supabase Development Setup Guide & Testing Flow

This guide describes how to spin up a local Supabase environment, configure environment variables, apply the team dashboard database schema, seed development data, and verify frontend integration on `localhost`.

---

## 1. Supabase Local CLI Setup Instructions

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) installed and running on your system, as local Supabase emulation relies on Docker containers.

### Step 1: Initialize Supabase inside the project
Open your terminal in the project root directory and run the initialization command if it hasn't been initialized already:
```bash
npx supabase init
```
This command creates a `supabase` configuration folder in your directory.

### Step 2: Boot local Supabase services
Start the containers using Supabase CLI:
```bash
npx supabase start
```
*Note: This might take a few minutes on the first startup as Docker images are downloaded.*

Once success is reported, your terminal will print out local credentials:
```text
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
       Inbucket: http://127.0.0.1:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Environment Variables Configuration

Create a file named `.env.local` in your root workspace (or edit the existing one created for you) and copy the local keys output from `npx supabase start`:

```env
# URL for local Supabase Docker container API Gateway
VITE_SUPABASE_URL=http://127.0.0.1:54321

# public anonymous key (safe to include in browser JS compilation)
VITE_SUPABASE_ANON_KEY=your_local_anon_key_here

# service role key (must remain server-only, never prefix with VITE_)
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key_here
```

---

## 3. Database Schema & Seeding Data

After starting Supabase locally, apply the schema and seed data to the PostgreSQL database.

### Step 1: Run the schema migration script
Deploy table structures, B-tree indexes, helper functions, and secure Row Level Security (RLS) policies by applying `schema.sql`:
```bash
npx supabase db execute --file "team dashboard/schema.sql"
```

### Step 2: Seed sample Egerton FC data
Apply seed scripts containing 1 default team (Egerton FC), 1 coach, 1 captain, 18 players with positioning vectors and stats, and 1 default starting lineup:
```bash
npx supabase db execute --file "team dashboard/seed.sql"
```

*Alternatively*, you can paste the SQL of `schema.sql` first and then `seed.sql` inside the local **Supabase Studio SQL Editor** at `http://127.0.0.1:54323`.

---

## 4. Database Connection Helpers (`lib/supabaseClient.ts`)

The project uses `@supabase/supabase-js` to handle DB operations. Client mapping details:
- **`saveSquadConfiguration`**: Performs an upsert operation. Saves active formation layout (coordinates array) for a team and updates the localStorage Cache-Aside copy.
- **`loadSquadConfiguration`**: Loads the most recent starting XI layout. Integrates with the cache-aside strategy (reads local cache if the DB is offline).
- **`fetchPlayersPaginated`**: Fetches roster list records from the DB using query pagination markers.

### Running testing operations
To debug database connectivity, you can import and trigger `diagnosticQueries` from `@/lib/supabaseClient` anywhere in your pages:
```typescript
import { diagnosticQueries } from '../lib/supabaseClient';

// Executing manual check
async function runChecks() {
   await diagnosticQueries.fetchTeamSquad('t-egerton-fc');
   await diagnosticQueries.testRoleBasedAccessRight();
}
```

---

## 5. End-to-End Testing Flow

To test page state updates, lineup changes, and coordinates persistence:

1. **Verify Services**: Ensure local Supabase is running (`npx supabase status`) and docker is healthy.
2. **Boot App**: Start the Vite web server:
   ```bash
   npm run dev
   ```
3. **Login**: Go to the login page on localhost and authenticate with Coach credentials (`coach@egerton.fc`).
4. **Field Canvas Test**: 
   - Navigate to the **Tactical Design** tab.
   - Choose a field player node and drag them to edit coordinates.
   - Click **Save Draft Plan** or **Submit Selection**.
   - Review your toast notification messages ensuring they report: `"Lineup and pitch layout successfully submitted and stored in Supabase."`
5. **Data Persistence**: Refresh your web browser page. The player node coordinates should remain exactly in the custom spots you dragged them to, showing they fetch correctly from `squad_configurations` table on load.
6. **Verify RLS Policies Behavior (Role Gating)**:
   - Log out, then log in under public **Guest Mode** (or as `PLAYER` role).
   - Try changing coordinates or saving a draft lineup.
   - Drag/drop changes will be rejected by the UI and policies return error codes if attempted without authorization.
