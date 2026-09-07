# Requirements Document — Supabase Backend Integration

## Intent Analysis

| Field | Value |
|---|---|
| **User Request** | Use the already-linked Supabase CLI project to create a database and build a backend API so that all features call via backend API routes |
| **Request Type** | Architecture Migration + New Feature (Backend API layer) |
| **Scope Estimate** | System-wide — all features affected (auth, coins, stickers, creative room, quiz history) |
| **Complexity Estimate** | Complex — database schema design, auth system, API routes, offline fallback, localStorage migration |

---

## Functional Requirements

### FR-01 — Supabase Email/Password Authentication
- Parents register a player account with **email + password** via Supabase Auth
- Login / logout supported
- Player's display name (child's name) is stored in the `players` table, not in localStorage
- Supabase manages credential hashing and session tokens

### FR-02 — Player Profile Persisted in Database
- Each authenticated user has a row in the `players` table: `id` (= auth.users.id), `name`, `coins`, `created_at`, `updated_at`
- The Welcome Screen (name entry) becomes a login/register flow
- After login, player profile is loaded from API, not from localStorage

### FR-03 — All Coin Operations via Backend API
- Adding coins (quiz completion) → `POST /api/players/coins`
- Spending coins (sticker purchase) is handled server-side within `POST /api/players/stickers`
- No coin mutation happens client-side only; all changes go through API routes

### FR-04 — Database-Driven Sticker Catalog
- All 22 stickers from `data/stickers.ts` are seeded into a Supabase `stickers` table
- API: `GET /api/stickers` — returns full catalog
- Frontend fetches catalog from API on app load

### FR-05 — Sticker Ownership via API
- Player's owned stickers stored in `player_stickers` table
- API: `GET /api/players/stickers` — returns owned sticker IDs
- API: `POST /api/players/stickers` — purchase a sticker (validates coins, deducts, records ownership)

### FR-06 — Creative Room Canvas Persisted to Database
- Placed sticker positions/sizes stored as JSONB in `creative_canvas` table per player
- API: `GET /api/players/canvas` — load saved canvas
- API: `PUT /api/players/canvas` — save current canvas (debounced to avoid excessive writes)
- Canvas is loaded on Creative Room mount and saved on change

### FR-07 — Full Quiz History Tracking
- Every quiz completion is recorded in the `quiz_history` table
- Recorded fields: `player_id`, `category` (e.g., "addition", "shapes"), `score`, `total_questions`, `coins_earned`, `completed_at`
- API: `POST /api/quiz/history` — called after each quiz completion (alongside coin award)
- API: `GET /api/quiz/history` — retrieve history (for future features)

### FR-08 — localStorage Migration on First Login
- After a player logs in for the first time (or when old localStorage data is detected), the app calls `POST /api/players/migrate`
- Migration reads: `localStorage.kidName`, `localStorage.kidCoins`, `localStorage.kidStickers`
- If found, imports coins and sticker ownership into the player's DB profile
- Clears migration data from localStorage after successful import
- Migration is idempotent — running it twice does not double-count coins

### FR-09 — localStorage as Offline Cache / Fallback
- After every successful API response, the app writes player state (coins, owned sticker IDs) to localStorage as a cache
- If any API call fails (network error, timeout), the app silently uses cached localStorage values
- Sync is attempted automatically on the next successful API call
- No explicit "offline mode" UI needed — errors are swallowed silently when cache is available

### FR-10 — All Features Call Via Backend API
- Frontend React components **never call Supabase directly**
- All data operations go through Next.js API routes under `/api/`
- API routes use the Supabase **server-side client** (service role key or authenticated session cookie)

### FR-11 — Authentication-Gated Feature Access
- All features (Learning Zone, Sticker Shop, Creative Room) require a logged-in session
- Unauthenticated users see the login/register screen only
- API routes return 401 for unauthenticated requests

---

## Non-Functional Requirements

### NFR-01 — Security (SECURITY BASELINE ENABLED — All Rules Blocking)

| Rule | Applicability | Approach |
|---|---|---|
| SECURITY-01 | Applicable | Supabase cloud uses TLS in transit and AES-256 at rest by default |
| SECURITY-02 | N/A | No custom load balancer/API gateway; Vercel + Supabase handle this |
| SECURITY-03 | Applicable | Structured logging in all API route handlers; no PII in logs |
| SECURITY-04 | Applicable | HTTP security headers via `next.config` middleware |
| SECURITY-05 | Applicable | All API endpoints validated with Zod schemas before processing |
| SECURITY-06 | Applicable | Supabase RLS policies; service role key only used server-side |
| SECURITY-07 | N/A | Vercel + Supabase manage network; no custom VPC/security groups |
| SECURITY-08 | Applicable | All API routes verify JWT session; player can only access own data (IDOR prevention via RLS) |
| SECURITY-09 | Applicable | Generic error messages to client; internal errors logged server-side only |
| SECURITY-10 | Applicable | `package-lock.json` committed; no unused deps; npm audit in CI |
| SECURITY-11 | Applicable | Auth logic isolated in `lib/auth.ts`; rate limiting on auth endpoints |
| SECURITY-12 | Applicable | Supabase Auth handles password hashing (bcrypt); sessions invalidated on logout |
| SECURITY-13 | Applicable | Zod validates all deserialized payloads; DB changes logged in quiz_history |
| SECURITY-14 | Applicable | Supabase dashboard alerting for auth failures; logs retained per Supabase defaults |
| SECURITY-15 | Applicable | All API handlers wrapped in try/catch; error paths return safe 500 responses |

### NFR-02 — Performance
- Canvas save is debounced (300ms minimum between writes)
- Sticker catalog is cached in memory after first fetch (no repeat calls per session)
- Supabase server-side client used in API routes (avoids client-side auth overhead)

### NFR-03 — Reliability / Offline Fallback
- localStorage cache updated on every successful API response
- API failures fall back to cache silently; user experience not blocked

### NFR-04 — Property-Based Testing (PBT ENABLED — Full)
- Pure generator functions (`generateAdditionQuestion`, `generateSubtractionQuestion`, `generateTimesTableQuestion`) retain existing PBT coverage
- New pure utility functions (coin math, migration logic) also covered by PBT
- API input validators tested with PBT-generated edge cases where applicable

### NFR-05 — Maintainability
- All Supabase database types generated via `supabase gen types` and checked in as `lib/database.types.ts`
- API route handlers are thin — business logic lives in service modules (`lib/services/`)

---

## Database Schema

### Table: `players`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, references auth.users(id) |
| name | text | NOT NULL |
| coins | integer | NOT NULL DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### Table: `stickers` (catalog)
| Column | Type | Constraints |
|---|---|---|
| id | text | PK (e.g., "hat-crown") |
| name | text | NOT NULL |
| category | text | NOT NULL (hat/glasses/bow/toy) |
| emoji | text | NOT NULL |
| price | integer | NOT NULL |

### Table: `player_stickers` (ownership)
| Column | Type | Constraints |
|---|---|---|
| player_id | uuid | FK → players(id), NOT NULL |
| sticker_id | text | FK → stickers(id), NOT NULL |
| purchased_at | timestamptz | DEFAULT now() |
| PRIMARY KEY | (player_id, sticker_id) | — |

### Table: `creative_canvas`
| Column | Type | Constraints |
|---|---|---|
| player_id | uuid | PK, FK → players(id) |
| canvas_data | jsonb | NOT NULL DEFAULT '[]' |
| updated_at | timestamptz | DEFAULT now() |

### Table: `quiz_history`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK DEFAULT gen_random_uuid() |
| player_id | uuid | FK → players(id), NOT NULL |
| category | text | NOT NULL |
| score | integer | NOT NULL |
| total_questions | integer | NOT NULL |
| coins_earned | integer | NOT NULL |
| completed_at | timestamptz | DEFAULT now() |

---

## API Routes (Next.js App Router)

### Authentication
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new player (email, password, name) |
| POST | `/api/auth/login` | Login (email, password) |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/session` | Get current session/player info |

### Player
| Method | Route | Description |
|---|---|---|
| GET | `/api/players/me` | Get player profile (name, coins) |
| POST | `/api/players/coins` | Add coins (quiz reward) |
| POST | `/api/players/migrate` | One-time localStorage import |

### Stickers
| Method | Route | Description |
|---|---|---|
| GET | `/api/stickers` | Get full sticker catalog |
| GET | `/api/players/stickers` | Get player's owned stickers |
| POST | `/api/players/stickers` | Buy a sticker |

### Creative Room
| Method | Route | Description |
|---|---|---|
| GET | `/api/players/canvas` | Get saved canvas state |
| PUT | `/api/players/canvas` | Save canvas state |

### Quiz
| Method | Route | Description |
|---|---|---|
| POST | `/api/quiz/history` | Record quiz completion |
| GET | `/api/quiz/history` | Get player's quiz history |

---

## Frontend Changes Required

| Component / File | Change |
|---|---|
| `app/page.tsx` | Replace localStorage session detection with API session check |
| `components/welcome-screen.tsx` | Become login/register UI (email, password, name) |
| `contexts/coin-context.tsx` | Replace localStorage ops with API calls; keep localStorage as write-through cache |
| `contexts/auth-context.tsx` | New — manages Supabase session |
| `components/sticker-shop.tsx` | Call `/api/stickers` for catalog; call `/api/players/stickers` for owned/buy |
| `components/creative-room.tsx` | Load/save canvas via API |
| `components/dashboard.tsx` | Call `/api/players/me` on mount |

---

## New Files Required

| File | Purpose |
|---|---|
| `lib/supabase/server.ts` | Supabase server-side client (used in API routes) |
| `lib/supabase/client.ts` | Supabase browser client (for auth session management only) |
| `lib/database.types.ts` | Generated Supabase TypeScript types |
| `lib/services/player.ts` | Player CRUD service functions |
| `lib/services/stickers.ts` | Sticker catalog + ownership service |
| `lib/services/canvas.ts` | Canvas persistence service |
| `lib/services/quiz.ts` | Quiz history service |
| `lib/validation/api.ts` | Zod schemas for all API inputs |
| `supabase/migrations/0001_initial_schema.sql` | DB migration: all 5 tables + RLS policies |
| `supabase/seed.sql` | Seed 22 stickers into stickers table |
| `.env.local` (user-managed) | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY |
| `app/api/auth/signup/route.ts` | Auth API |
| `app/api/auth/login/route.ts` | Auth API |
| `app/api/auth/logout/route.ts` | Auth API |
| `app/api/auth/session/route.ts` | Auth API |
| `app/api/players/me/route.ts` | Player API |
| `app/api/players/coins/route.ts` | Coins API |
| `app/api/players/migrate/route.ts` | Migration API |
| `app/api/players/stickers/route.ts` | Sticker ownership API |
| `app/api/players/canvas/route.ts` | Canvas API |
| `app/api/stickers/route.ts` | Sticker catalog API |
| `app/api/quiz/history/route.ts` | Quiz history API |

---

## Extension Configuration

| Extension | Status | Decided At |
|---|---|---|
| Security Baseline | **Enabled (All 15 rules, blocking)** | Requirements Analysis |
| Resiliency Baseline | **Disabled** | Previous workflow |
| Property-Based Testing | **Enabled (Full)** | Previous workflow |

---

## Out of Scope

- No admin dashboard or parent analytics UI (quiz history API is built but UI is future work)
- No real-time multiplayer or leaderboards
- No social login (Google, Facebook) — email/password only
- No MFA for child accounts (MFA optional for admin/parent per SECURITY-12)
- No changes to quiz question generation logic
- No changes to theme or language switching behavior (these remain purely client-side)
