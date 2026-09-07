# Units of Work — Supabase Backend Integration

## Unit 1: SupabaseDBLayer

**Type**: Infrastructure Module
**Scope**: Database foundation — all other units depend on this being complete first.

### Responsibilities
- Write SQL migration creating all 5 tables: `players`, `stickers`, `player_stickers`, `creative_canvas`, `quiz_history`
- Define Row-Level Security (RLS) policies on each table
- Write `supabase/seed.sql` seeding all 22 stickers from `data/stickers.ts`
- Generate TypeScript database types: `lib/database.types.ts` (via `supabase gen types typescript`)
- Configure `next.config.ts` with HTTP security headers (SECURITY-04)

### Deliverables
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/seed.sql`
- `lib/database.types.ts`
- `next.config.ts` (security headers added)

### Entry Criteria
- Supabase CLI linked to project (already done)
- No existing migrations

### Exit Criteria
- `supabase db push` runs without error
- `supabase db seed` inserts 22 sticker rows
- TypeScript types generated and compilable

---

## Unit 2: BackendAuthAPI

**Type**: Application Module — Auth system
**Scope**: Authentication routes, session management, auth UI components.

### Responsibilities
- Create Supabase utility clients: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Create API response helper: `lib/api-response.ts`
- Create Zod validation schemas: `lib/validation/api.ts` (signup + login schemas)
- Implement auth service calls directly in route handlers (no separate service module for auth)
- Implement 4 API route handlers: signup, login, logout, session
- Create `contexts/auth-context.tsx` with signUp, signIn, signOut, session restoration
- Create `components/login-view.tsx` (email + password form)
- Create `components/register-view.tsx` (email + password + child name form)
- Refactor `components/welcome-screen.tsx` into auth view switcher
- Call `player.upsertPlayer()` from signup route to create `players` row (uses Unit 1 schema)

### Deliverables
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/api-response.ts`
- `lib/validation/api.ts` (auth schemas)
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/session/route.ts`
- `lib/services/player.ts` (upsertPlayer + getPlayer only — remaining methods added in Unit 3)
- `contexts/auth-context.tsx`
- `components/login-view.tsx`
- `components/register-view.tsx`
- `components/welcome-screen.tsx` (refactored)

### Entry Criteria
- Unit 1 complete (tables exist, types generated)

### Exit Criteria
- Signup creates `auth.users` row + `players` row
- Login sets session cookie, returns player profile
- Logout clears cookie
- Session route returns player for valid cookie, null for no cookie

---

## Unit 3: BackendDataAPI

**Type**: Application Module — Data API
**Scope**: All non-auth API routes and service layer. Can be scaffolded in parallel with Unit 2 finishing; auth middleware is the last step wired in.

### Responsibilities
- Complete `lib/services/player.ts` (addCoins, migrateFromLocalStorage)
- Create `lib/services/stickers.ts` (getCatalog, getOwnedStickers, purchaseSticker)
- Create `lib/services/canvas.ts` (getCanvas, saveCanvas)
- Create `lib/services/quiz.ts` (recordHistory, getHistory)
- Add remaining Zod schemas to `lib/validation/api.ts` (coins, sticker buy, canvas, quiz history, migrate)
- Implement all remaining API route handlers (7 routes + 4 sub-routes)
- Wire `supabase.auth.getUser()` session check into all authenticated routes (final auth integration step)

### Deliverables
- `lib/services/player.ts` (completed)
- `lib/services/stickers.ts`
- `lib/services/canvas.ts`
- `lib/services/quiz.ts`
- `lib/validation/api.ts` (all schemas complete)
- `app/api/players/me/route.ts`
- `app/api/players/coins/route.ts`
- `app/api/players/migrate/route.ts`
- `app/api/players/stickers/route.ts`
- `app/api/players/canvas/route.ts`
- `app/api/stickers/route.ts`
- `app/api/quiz/history/route.ts`

### Entry Criteria
- Unit 1 complete (tables + types)
- Unit 2 substantially complete (auth context + server client available to import)

### Exit Criteria
- All 7 route files respond correctly (tested with curl or REST client)
- Coin deduction + sticker purchase is atomic (transaction verified)
- Canvas UPSERT works for new and existing players
- Quiz history records insert without error

---

## Unit 4: FrontendIntegration

**Type**: Application Module — Frontend wiring
**Scope**: Refactor all frontend contexts and components to call the backend API. Implement offline cache and migration.

### Responsibilities
- Refactor `contexts/coin-context.tsx`:
  - Replace all localStorage reads with API calls (`/api/players/me`, `/api/players/stickers`)
  - Implement write-through localStorage cache after each successful API response
  - Implement silent localStorage fallback on API failure (`isCacheFallback` flag)
  - Trigger migration: call `/api/players/migrate` on first login if localStorage data found
  - `addCoins()` → POST `/api/players/coins`
  - `buySticker()` → POST `/api/players/stickers`
- Wrap `app/page.tsx` with `AuthProvider`; route unauthenticated users to WelcomeScreen
- Refactor `components/dashboard.tsx` to read child name from `AuthContext.player.name`
- Refactor `components/sticker-shop.tsx` to fetch catalog from `/api/stickers` (in-memory cache)
- Refactor `components/creative-room.tsx`: load canvas on mount, debounced save on change
- Modify `components/learning-zone.tsx`: fire-and-forget POST `/api/quiz/history` after quiz completion
- Install `@supabase/supabase-js` and `@supabase/ssr` npm packages
- Create `.env.local` template (with placeholder values; actual secrets set by user)

### Deliverables
- `contexts/coin-context.tsx` (fully refactored)
- `contexts/auth-context.tsx` (consumed via Provider in page.tsx)
- `app/page.tsx` (AuthProvider wrapper, session-gated routing)
- `components/dashboard.tsx` (reads name from auth)
- `components/sticker-shop.tsx` (API catalog + CoinContext buy)
- `components/creative-room.tsx` (canvas load/save)
- `components/learning-zone.tsx` (quiz history post)
- `.env.local.example` (template for required env vars)
- Updated `package.json` (with `@supabase/supabase-js`, `@supabase/ssr`)

### Entry Criteria
- Units 1, 2, 3 complete (all API routes functional)

### Exit Criteria
- Full user journey works end-to-end: register → login → do quiz → earn coins → buy sticker → decorate canvas
- Stale localStorage data migrates to DB on first login
- API failure falls back to localStorage cache (verified by disabling API temporarily)
- No direct Supabase calls from frontend components (only via API routes)
