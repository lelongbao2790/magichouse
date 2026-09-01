# Application Design — Supabase Backend Integration

## Summary

Magic House is being extended from a fully client-side app (localStorage only) to a three-tier architecture:
- **Frontend**: React components + AuthContext + CoinContext (API-backed with localStorage fallback cache)
- **API Layer**: Next.js App Router route handlers (`/api/...`) — the only layer that touches Supabase directly
- **Database**: Supabase PostgreSQL (5 tables + RLS policies)

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth UI | Two separate views (Login + Register) | Cleaner UX; login is default, register is navigated to |
| Email verification | Disabled (auto-confirm) | Family app — parent creates account, no friction needed |
| Child name | Fixed at registration | Name is part of account, not a session prompt |
| API response format | `{ data, error }` envelope | Consistent client-side error handling regardless of HTTP status |
| Frontend → Supabase | Never direct | All access via Next.js API routes; service role key stays server-side |
| Offline fallback | localStorage write-through cache | Silent degradation; sync on reconnect |

---

## Architecture

See `component-dependency.md` for full architecture diagram and data flow diagrams.

### Three-Tier Summary

```
Browser (React) → Next.js API Routes → Supabase PostgreSQL
                  (lib/services/*)
```

---

## Components

See `components.md` for full component list with responsibilities.

### New Components
- `contexts/auth-context.tsx` — session + player identity
- `components/login-view.tsx` — email/password login form
- `components/register-view.tsx` — registration form (email + password + child name)
- `lib/supabase/server.ts` — server-side Supabase client
- `lib/supabase/client.ts` — browser Supabase client (auth only)
- `lib/api-response.ts` — `{ data, error }` envelope helpers
- `lib/validation/api.ts` — Zod schemas for all request bodies
- `lib/services/player.ts`, `stickers.ts`, `canvas.ts`, `quiz.ts` — DB service functions
- 11 API route handlers under `app/api/`

### Modified Components
- `contexts/coin-context.tsx` — API-backed, localStorage cache, migration trigger
- `components/welcome-screen.tsx` — now a view switcher for Login/Register
- `components/sticker-shop.tsx` — fetches catalog from API, delegates buy to CoinContext
- `components/creative-room.tsx` — loads/saves canvas via API (debounced)
- `components/dashboard.tsx` — reads child name from AuthContext.player
- `components/learning-zone.tsx` — posts quiz history after completion

---

## Service Layer

See `services.md` for full orchestration patterns.

### Services Summary
- `player.ts` — getPlayer, upsertPlayer, addCoins, migrateFromLocalStorage
- `stickers.ts` — getCatalog, getOwnedStickers, purchaseSticker (transactional)
- `canvas.ts` — getCanvas, saveCanvas (UPSERT)
- `quiz.ts` — recordHistory, getHistory

---

## Method Signatures

See `component-methods.md` for full TypeScript method signatures.

---

## Database Schema (for reference)

| Table | Key Columns |
|---|---|
| `players` | id (uuid, = auth.users.id), name, coins |
| `stickers` | id (text), name, category, emoji, price |
| `player_stickers` | player_id, sticker_id (composite PK) |
| `creative_canvas` | player_id (PK), canvas_data (jsonb) |
| `quiz_history` | id (uuid), player_id, category, score, total_questions, coins_earned |

---

## Security Design (Security Baseline)

| SECURITY Rule | Design Implementation |
|---|---|
| SECURITY-04 | HTTP headers set in `next.config.ts` middleware |
| SECURITY-05 | Zod schemas in `lib/validation/api.ts` validate all inputs |
| SECURITY-06 | Supabase RLS: each player can only access their own rows |
| SECURITY-08 | `supabase.auth.getUser()` called in every authenticated route |
| SECURITY-09 | `apiError()` returns generic messages; detail logged server-side only |
| SECURITY-11 | Auth logic isolated in `AuthContext` + `/api/auth/*`; rate limiting via Supabase Auth |
| SECURITY-12 | Supabase Auth handles password hashing (bcrypt); `enable_confirmations = false` per design |
| SECURITY-15 | All route handlers wrapped in try/catch; `apiError("Internal server error")` on failure |

---

## Units of Work (Construction Phase)

| Unit | Scope |
|---|---|
| 1. SupabaseDBLayer | SQL migration (5 tables + RLS), seed.sql (22 stickers), type generation |
| 2. BackendAuthAPI | Auth route handlers, AuthContext, LoginView, RegisterView, WelcomeScreen refactor |
| 3. BackendDataAPI | All other route handlers (player, stickers, canvas, quiz history), all service modules |
| 4. FrontendIntegration | CoinContext refactor, StickerShop/CreativeRoom/LearningZone/Dashboard wiring, migration |

Sequential dependency: 1 → 2 → 3 → 4
