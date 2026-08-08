# President's Season Mode (Phase 1)
**Module Architecture & Integration Boundary Documentation**

---

## 1. Overview
The **President's Season Mode** is an isolated, production-grade operational module within the Egerton Sports Ecosystem (`livescore`). 

Phase 1 establishes the **Pre-Season Foundation**, **Registration Intake Pipeline**, **Team Name Normalization Engine**, **Referee Pool Foundation**, **Pitch Foundation**, and **UI Foundation**.

---

## 2. Directory Architecture
```
President's Season Mode/
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # Season Mode header & theme controls
│   │   └── Navigation.tsx          # Tab bar navigation
│   ├── overview/
│   │   └── OverviewView.tsx        # Overview metrics & setup checklist
│   ├── teams/
│   │   └── TeamsView.tsx           # Concurrent EPL & Championship rosters
│   ├── referees/
│   │   └── RefereesView.tsx        # Verified referee pool manager
│   ├── pitches/
│   │   └── PitchesView.tsx         # 3 Official Egerton grounds foundation
│   ├── registration/
│   │   ├── CoachIntakeModal.tsx    # Minimal coach & team registration intake
│   │   └── RefereeIntakeModal.tsx  # Center referee registration intake
│   └── shared/
│       └── StateDisplays.tsx       # Loading, Empty, Error & Toast displays
├── pages/
│   └── PresidentSeasonModeApp.tsx  # Root module page container
├── hooks/
│   └── useSeasonMode.ts            # State orchestration hook
├── services/
│   ├── teamsService.ts             # Database contract queries for teams & intake
│   ├── refereesService.ts          # Database contract queries for referees
│   └── pitchesService.ts           # Database contract queries for pitches
├── lib/
│   └── normalization.ts            # Team name normalization & duplicate checker
├── constants/
│   └── seasonConstants.ts          # Operational constants, competition UUIDs & pitch specs
├── types/
│   └── seasonMode.ts               # Database-backed TypeScript contracts
└── README.md                       # Architecture & Integration documentation
```

---

## 3. Database Contracts & Schema Alignment

### Tables Used:
1. `public.teams`
   - `id` (UUID Primary Key)
   - `name` (Normalized string ending in single `FC`)
   - `short_name` (3-4 char abbreviation)
   - `competition_id` (UUID Foreign Key to `public.competitions`)
   - `coach_id` (UUID Foreign Key to `public.profiles`)
   - `captain_id` (UUID Foreign Key to `public.profiles`)
   - `status` ('pending' | 'approved' | 'rejected')

2. `public.competitions`
   - `id`: Premier League (`11111111-1111-1111-1111-111111111111`), Championship (`22222222-2222-2222-2222-222222222222`)
   - `name`, `slug`, `country`, `season`, `is_active`

3. `public.referees`
   - `id` (UUID Primary Key)
   - `name`, `email`, `phone`, `status` ('Active' | 'Suspended' | 'Deactivated' | 'Inactive'), `badge_level`

4. `public.pitches` (Migration 16)
   - `id`:
     - Egerton Main Stadium Pitch: `p1111111-1111-1111-1111-111111111111`
     - Pavilion Grounds Pitch A: `p2222222-2222-2222-2222-222222222222`
     - Tatton Complex Ground: `p3333333-3333-3333-3333-333333333333`
   - `name`, `short_code`, `location`, `capacity`, `surface_type`, `has_lighting`, `status`

---

## 4. Integration Boundary
- **Isolation Rule**: Zero modifications to existing dashboards (`Admin`, `PresidentDashboard.tsx`, `TeamDashboard.tsx`, `RefereeDashboard.tsx`, `DoctorDashboard.tsx`, `PlayerDashboard.tsx`, `JournalistDashboard.tsx`), guest views, auth rules, or global algorithms.
- **Entry Point**: Mounted lazily in `src/App.tsx` under hash route `#season-mode` (and optional tab navigation link in President view).

---

## 5. Team Normalization Pipeline (`lib/normalization.ts`)
1. **Trim & Collapse**: Strips whitespace and collapses internal multiple spaces (`\s+` -> ` `).
2. **Strip Duplicate FC**: Removes existing FC / F.C. / Football Club / Fc suffixes.
3. **Display Casing**: Formats title casing for standard words while preserving brand acronyms (e.g. FOA, FOS).
4. **Append FC**: Appends exactly one `FC` suffix (e.g. `eagles` -> `Eagles FC`).
5. **Comparison Key**: Generates a lowercase alphanumeric key (e.g. `eaglesfc`) for database duplicate checking.

---

## 6. Phase 1 Scope Boundary
- **Included**: Pre-season Intake + Team/Referee Foundation + Pitch Foundation + Database Contract + UI Shell.
- **Excluded (Phase 2+)**: Fixture generation algorithm, Double round-robin, Match creation, Calendar progression, Referee fixture allocation.
