# MH-7 — Your Coins Number Incorrect: Analysis & Fix (v2)

## Ticket

- **Key:** MH-7
- **Summary:** Your Coins number incorrect
- **Issue Type:** Bug
- **Status:** Resolved (v2)
- **Priority:** Medium

---

## Screenshot Reference

Screenshots were not available. Analysis is based on ticket text, commit history, and source code.

---

## Customer Report

Every login or page refresh shows a different coin balance. The user expects the My House page to always display the coin balance stored in the database. If no balance is found, it should default to zero.

---

## Steps to Reproduce

1. Create an account and log in.
2. Complete a quiz in the Learning Zone.
3. Note the displayed coin balance in "Your Coins."
4. Navigate back to the My House page (or refresh, or log out and back in).
5. Observe that the displayed coin balance may differ from what was shown in step 3.

**Expected:** The same coin balance on every visit, matching the database.  
**Actual:** The balance changes or shows a stale/incorrect value.

---

## Primary Area

`lib/services/player.ts` — server-side service controlling coin persistence.

---

## Related Areas

| Area | File | Reason |
|------|------|--------|
| Coin context | `contexts/coin-context.tsx` | RC-4: silent error swallowing in `addCoins` causes optimistic/DB divergence |
| Coins API | `app/api/players/coins/route.ts` | Delegates to the non-atomic `addCoins` service |
| Migration | `supabase/migrations/0005_increment_coins_rpc.sql` | New atomic RPC function |
| Types | `lib/database.types.ts` | New `increment_player_coins` function type registration |

---

## Likely Flow (pre-fix)

```
QuizModal → LearningZone.handleQuizCompleteInternal
  → calculateSessionCoins(difficulties)       ← deterministic (v1 fixed)
  → CoinContext.addCoins(coinsEarned)
      setCoins(newCoins)                       ← optimistic update
      POST /api/players/coins
        → addCoins(supabase, userId, amount)
            READ current.coins                 ← non-atomic step 1
            WRITE coins = current.coins + amt  ← non-atomic step 2 (RC-3)
      .catch(() => {})                         ← RC-4: silent failure, no rollback

On next login:
  CoinContext useEffect([player])
    GET /api/players/me → setCoins(dbValue)    ← overwrites stale optimistic state
```

---

## Root Causes

### RC-1 (v1 — FIXED): Random coin reward calculation
`lib/coin-rewards.ts` used `Math.random()`. Fixed in commit `4dceb6b`.

### RC-2 (v2 — FIXED in this PR): `upsertPlayer` resets coins to 0 on conflict
`lib/services/player.ts:42` had `coins: 0` in the upsert payload. Any signup retry or code reuse would silently zero out a player's balance. Fixed by removing `coins` from the upsert — the column has `DEFAULT 0` in the migration schema.

### RC-3 (v2 — FIXED in this PR): Non-atomic `addCoins` (race-condition coin loss)
`addCoins` in `lib/services/player.ts` did a separate `getPlayer()` READ then an `UPDATE` WRITE. Two concurrent requests both read the same stale `current.coins` and both write `current.coins + amount`, causing one reward to be lost. Fixed with a new `increment_player_coins` Postgres RPC that evaluates `coins = coins + p_amount` as a single atomic SQL operation.

### RC-4 (v2 — FIXED in this PR): Silent failure in `CoinContext.addCoins`
`.catch(() => {})` in `contexts/coin-context.tsx:103` swallowed API errors without rolling back the optimistic state. If the POST to `/api/players/coins` failed, the displayed balance stayed at the inflated optimistic value while the DB retained the pre-quiz value. On the next login, the `useEffect` re-fetched from DB and overwrote with the lower value — the "coins change on login" symptom. Fixed by capturing `previousCoins` before the optimistic update and restoring it (including `localStorage`) in the catch handler.

---

## Fan-Out Findings

- **UI / Component:** No change needed. The `Your Coins` display consumes `CoinContext.coins` correctly.
- **State / Context:** `contexts/coin-context.tsx` — `addCoins` needed a rollback on API failure.
- **API Route:** `app/api/players/coins/route.ts` — no change needed; correctly delegates to the service.
- **Data (Supabase):** New migration `0005_increment_coins_rpc.sql` adds `increment_player_coins` for atomic coin increment.
- **Bug memory:** RC-2/RC-3/RC-4 newly identified in v2 analysis.

---

## Fix Proposal (implemented)

### Fix 1 — Remove `coins: 0` from `upsertPlayer`
File: `lib/services/player.ts`  
Change: `.upsert({ id: userId, name, coins: 0 }, { onConflict: 'id' })` → `.upsert({ id: userId, name }, { onConflict: 'id' })`

### Fix 2 — Atomic `addCoins` via RPC
New migration `0005_increment_coins_rpc.sql` defines `increment_player_coins(p_player_id, p_amount)` — a `SECURITY DEFINER` function that performs `UPDATE players SET coins = coins + p_amount WHERE id = p_player_id` in a single SQL statement. `lib/services/player.ts:addCoins` now calls this RPC instead of doing a separate read then write.

### Fix 3 — Rollback optimistic state on failure
File: `contexts/coin-context.tsx`  
Captures `previousCoins` before the optimistic update, then restores both `coins` state and `localStorage` in the `.catch()` handler.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| `SECURITY DEFINER` function bypasses RLS | Function explicitly checks `auth.uid() = p_player_id` before any mutation |
| Migration is forward-only | Uses `CREATE OR REPLACE FUNCTION` — idempotent |
| `buySticker` and `buyHouseItem` also swallow errors | Out of scope for this fix; noted for future work |

---

## Confidence

**High** — all three root causes are directly observable in code with clear one-to-one mappings to the acceptance criteria.

---

## Fix Implementation

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/0005_increment_coins_rpc.sql` | New: atomic `increment_player_coins` RPC |
| `lib/database.types.ts` | Added `increment_player_coins` to `Functions` |
| `lib/services/player.ts` | Fix 1: removed `coins: 0` from upsert; Fix 2: `addCoins` uses RPC |
| `contexts/coin-context.tsx` | Fix 3: rollback optimistic state on API failure |
| `automation_tests/unit/player-service.test.ts` | New: 10 regression tests (TC-U-MH7-1 through TC-U-MH7-10) |
| `automation_tests/unit/coin-context.test.tsx` | New: 4 regression tests (TC-U-MH7-11 through TC-U-MH7-14) |

---

## Verification

- `pnpm test`: **263 tests pass** (all 24 test files)
- 14 new regression tests all pass
- No pre-existing test failures

---

## Final Status

**RESOLVED** — All three v2 root causes fixed. 14 regression tests cover each fix path.
