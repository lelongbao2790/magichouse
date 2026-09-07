# Execution Plan — Supabase Backend Integration

## Detailed Analysis Summary

### Transformation Scope (Brownfield)
- **Transformation Type**: Architectural migration + full backend layer addition
- **Primary Changes**: Add Supabase database (5 tables), 13 Next.js API routes, email/password auth, replace localStorage-only state with API-backed persistence + offline cache
- **Related Components**: All frontend contexts (CoinContext → AuthContext + refactored), Welcome Screen (becomes login/register), Sticker Shop, Creative Room, Learning Zone (quiz history), plus 20+ new files

### Change Impact Assessment
- **User-facing changes**: Yes — Welcome Screen becomes login/register; Creative Room canvas persists; quiz history is recorded
- **Structural changes**: Yes — architectural shift from client-side-only to client + Next.js API + Supabase
- **Data model changes**: Yes — 5 new Supabase tables, localStorage migrated to DB, 22 stickers seeded to DB
- **API changes**: Yes — 13 new API routes created from scratch
- **NFR impact**: Yes — Security Baseline (all 15 rules), offline fallback, debounced canvas writes

### Component Relationships
- **Primary**: `contexts/coin-context.tsx` (refactored), `components/welcome-screen.tsx` (redesigned)
- **New Infrastructure**: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/database.types.ts`
- **New Services**: `lib/services/player.ts`, `lib/services/stickers.ts`, `lib/services/canvas.ts`, `lib/services/quiz.ts`
- **New API Routes**: 13 handlers under `app/api/`
- **New Context**: `contexts/auth-context.tsx`
- **Modified Components**: `sticker-shop.tsx`, `creative-room.tsx`, `dashboard.tsx`, `app/page.tsx`

### Risk Assessment
- **Risk Level**: High — system-wide architectural change, touches all features
- **Rollback Complexity**: Moderate — all API calls are additive; localStorage fallback means partial rollback possible
- **Testing Complexity**: Complex — requires DB running locally (supabase start), auth flow tests, API integration tests

---

## Workflow Visualization

```
INCEPTION PHASE
+------------------------------------------------------------------+
|  Workspace Detection       [COMPLETED]                           |
|  Reverse Engineering       [SKIP - artifacts loaded]             |
|  Requirements Analysis     [COMPLETED]                           |
|  User Stories              [SKIP - arch migration, no new UX]    |
|  Workflow Planning         [IN PROGRESS]                         |
|  Application Design        [EXECUTE]                             |
|  Units Generation          [EXECUTE - 4 units]                   |
+------------------------------------------------------------------+
                              |
                              v
CONSTRUCTION PHASE
+------------------------------------------------------------------+
|  Unit 1: SupabaseDBLayer                                         |
|    Functional Design       [EXECUTE]                             |
|    NFR Requirements        [EXECUTE]                             |
|    NFR Design              [EXECUTE]                             |
|    Infrastructure Design   [EXECUTE]                             |
|    Code Generation         [EXECUTE]                             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|  Unit 2: BackendAuthAPI                                          |
|    Functional Design       [EXECUTE]                             |
|    NFR Requirements        [EXECUTE]                             |
|    NFR Design              [EXECUTE]                             |
|    Infrastructure Design   [SKIP]                                |
|    Code Generation         [EXECUTE]                             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|  Unit 3: BackendDataAPI                                          |
|    Functional Design       [EXECUTE]                             |
|    NFR Requirements        [SKIP - patterns from Units 1+2]      |
|    NFR Design              [SKIP - patterns from Units 1+2]      |
|    Infrastructure Design   [SKIP]                                |
|    Code Generation         [EXECUTE]                             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|  Unit 4: FrontendIntegration                                     |
|    Functional Design       [EXECUTE]                             |
|    NFR Requirements        [SKIP]                                |
|    NFR Design              [SKIP]                                |
|    Infrastructure Design   [SKIP]                                |
|    Code Generation         [EXECUTE]                             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|  Build and Test            [EXECUTE]                             |
+------------------------------------------------------------------+
                              |
                              v
OPERATIONS PHASE (PLACEHOLDER)
```

---

## Phases to Execute

### INCEPTION PHASE
- [x] Workspace Detection — COMPLETED
- [x] Reverse Engineering — SKIP (artifacts loaded, Grade2MathFeature read in-session)
- [x] Requirements Analysis — COMPLETED
- [ ] User Stories — SKIP (architectural migration; no new user personas; requirements sufficient)
- [x] Workflow Planning — IN PROGRESS
- [ ] Application Design — **EXECUTE** (service layer design required; 13 new API routes + 4 service modules + new AuthContext)
- [ ] Units Generation — **EXECUTE** (4 logical units with clear dependencies)

### CONSTRUCTION PHASE

#### Unit 1: SupabaseDBLayer
- [ ] Functional Design — **EXECUTE** (5 table schemas, RLS policy definitions, seed data)
- [ ] NFR Requirements — **EXECUTE** (SECURITY-01, 06, 08 — RLS, encryption, access control)
- [ ] NFR Design — **EXECUTE** (RLS policy SQL patterns, migration structure)
- [ ] Infrastructure Design — **EXECUTE** (migration files, seed.sql, supabase type generation)
- [ ] Code Generation — **EXECUTE**

#### Unit 2: BackendAuthAPI
- [ ] Functional Design — **EXECUTE** (signup/login/logout/session API routes, AuthContext, Welcome Screen redesign)
- [ ] NFR Requirements — **EXECUTE** (SECURITY-12 — auth hardening, SECURITY-08 — session validation)
- [ ] NFR Design — **EXECUTE** (cookie strategy, JWT validation middleware, Zod auth schemas)
- [ ] Infrastructure Design — **SKIP** (Supabase Auth is existing infrastructure, no custom deploy)
- [ ] Code Generation — **EXECUTE**

#### Unit 3: BackendDataAPI
- [ ] Functional Design — **EXECUTE** (player, coins, stickers, canvas, quiz history routes + service layer)
- [ ] NFR Requirements — **SKIP** (SECURITY-05, 08, 15 patterns already established in Units 1+2)
- [ ] NFR Design — **SKIP** (Zod validation + try/catch patterns carry over from Units 1+2)
- [ ] Infrastructure Design — **SKIP** (no new infra; uses same Supabase project)
- [ ] Code Generation — **EXECUTE**

#### Unit 4: FrontendIntegration
- [ ] Functional Design — **EXECUTE** (CoinContext refactor, component API wiring, localStorage cache strategy, migration trigger)
- [ ] NFR Requirements — **SKIP**
- [ ] NFR Design — **SKIP**
- [ ] Infrastructure Design — **SKIP**
- [ ] Code Generation — **EXECUTE**

#### Build and Test
- [ ] Build and Test — **EXECUTE** (build instructions, unit tests, integration tests with local Supabase)

### OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

---

## Unit Dependencies

```
SupabaseDBLayer
     |
     v
BackendAuthAPI
     |
     v
BackendDataAPI
     |
     v
FrontendIntegration
     |
     v
Build and Test
```

Units must be completed **sequentially** — each unit depends on the previous.

---

## Estimated Timeline
- **Total Stages to Execute**: 16
- **Total Stages to Skip**: 8
- **Units**: 4 (sequential)

## Success Criteria
- **Primary Goal**: All features (Learning Zone, Sticker Shop, Creative Room) read/write data through Next.js API routes backed by Supabase PostgreSQL
- **Key Deliverables**: DB migration SQL, 13 API routes, AuthContext, refactored CoinContext, refactored components, seed data, localStorage migration utility
- **Quality Gates**: Security Baseline (all 15 rules), PBT coverage on pure functions, local Supabase integration tests passing
