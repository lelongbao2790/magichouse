# Functional Design Plan — Unit 3: BackendDataAPI

## Unit Context
- **Unit**: BackendDataAPI
- **Depends on**: Unit 1 (schema), Unit 2 (auth session validation pattern, apiSuccess/apiError, player service stub)
- **NFR stages**: All SKIP (patterns from Units 1+2 carry over)
- **Produces**: 7 API routes, 3 new service modules, completed player service, all remaining Zod schemas

## Artifacts to Generate
- [x] domain-entities.md — API contracts for all 7 routes, service return types
- [x] business-rules.md — per-route rules, purchase transaction rules, migration rules
- [x] business-logic-model.md — logic flows for each route and service function

---

## Questions

### Question 1
The `purchaseSticker` operation must atomically deduct coins AND record ownership.
If two requests arrive simultaneously (e.g., double-tap), a non-atomic approach
could deduct coins twice.

A) Supabase RPC (database function) — write a PostgreSQL function
   `purchase_sticker(player_id, sticker_id, price)` that checks balance, deducts,
   and inserts ownership in a single transaction. Called via `supabase.rpc()`.

B) Two sequential queries with application-level guard — read coins, check sufficiency,
   deduct via UPDATE ... WHERE coins >= price (atomic deduction via SQL WHERE clause),
   then INSERT sticker ownership. The WHERE clause prevents over-deduction even under
   concurrent requests. No separate DB function needed.

[Answer]: B

---

### Question 2
When `POST /api/players/migrate` runs (first login with existing localStorage data),
how should it handle conflicts if the player already has DB data?

Scenario: a player signed up, played a few sessions (earned DB coins/stickers), then
the migration runs and finds old localStorage coins/stickers too.

A) Merge — set coins to `MAX(existing DB coins, migrated coins)`; insert stickers
   `ON CONFLICT DO NOTHING` (preserves whichever is higher without losing DB progress)

B) Skip entirely — if player already has any coins > 0 or any owned stickers in DB,
   treat migration as already done and return success without writing anything

[Answer]: A
