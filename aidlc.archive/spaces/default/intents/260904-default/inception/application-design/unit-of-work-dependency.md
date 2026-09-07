# Unit of Work Dependencies — Supabase Backend Integration

## Dependency Matrix

| Unit | Depends On | Type |
|---|---|---|
| 1. SupabaseDBLayer | None | Foundation |
| 2. BackendAuthAPI | Unit 1 (tables + types must exist) | Hard |
| 3. BackendDataAPI | Unit 1 (hard), Unit 2 (soft — scaffold first, wire auth last) | Hard + Soft |
| 4. FrontendIntegration | Units 1, 2, 3 all complete | Hard |

## Execution Sequence

```
Unit 1: SupabaseDBLayer
    [MUST COMPLETE FULLY]
           |
           v
Unit 2: BackendAuthAPI ─────────────────────────────┐
    [Start + run in parallel with Unit 3 scaffolding] |
           |                                          |
           v                                          |
Unit 3: BackendDataAPI                               |
    [Scaffold service files + routes early]          |
    [Wire auth.getUser() check LAST,                 |
     once Unit 2 is complete] <─────────────────────┘
           |
           v
Unit 4: FrontendIntegration
    [MUST COMPLETE AFTER ALL THREE ABOVE]
           |
           v
      Build and Test
```

## Critical Path

```
1 → 2 → 3 (auth wire-in) → 4 → Build and Test
```

Unit 2 and Unit 3 (scaffolding) can overlap — Unit 3 service files and route skeletons
can be written before Unit 2 is finished. However, auth session validation cannot be
wired into Unit 3 routes until Unit 2's server client and auth context are functional.

## Shared Resources

| Resource | Created By | Consumed By |
|---|---|---|
| `lib/database.types.ts` | Unit 1 | Units 2, 3, 4 |
| `supabase/migrations/0001_initial_schema.sql` | Unit 1 | Supabase DB (runtime) |
| `lib/supabase/server.ts` | Unit 2 | Unit 3 (all API routes) |
| `lib/supabase/client.ts` | Unit 2 | Unit 4 (AuthContext) |
| `lib/api-response.ts` | Unit 2 | Unit 3 (all API routes) |
| `lib/validation/api.ts` (auth schemas) | Unit 2 | Unit 2 routes |
| `lib/validation/api.ts` (data schemas) | Unit 3 | Unit 3 routes |
| `lib/services/player.ts` (partial) | Unit 2 | Unit 3 (completed) |
| `contexts/auth-context.tsx` | Unit 2 | Unit 4 (page.tsx, CoinContext) |
| All API routes under `/api/` | Units 2 + 3 | Unit 4 (fetch calls) |

## Risk Points

| Risk | Mitigation |
|---|---|
| Unit 3 starts before Unit 2 auth is ready | Scaffold routes with `TODO: add auth check` comment; wire in last |
| Sticker purchase transaction fails mid-way | Use Supabase RPC or raw SQL transaction in `purchaseSticker()` |
| LocalStorage migration runs twice | Set `localStorage.setItem("migrationDone", "true")` after successful migrate call |
| Canvas debounce loses last save on unmount | Flush debounce on `useEffect` cleanup |
