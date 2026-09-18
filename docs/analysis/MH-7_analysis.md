# MH-7 - Bug Analysis Report

## 1. Jira ticket summary

- **Key:** MH-7
- **Summary:** Your Coins number incorrect
- **Issue Type:** Bug
- **Status:** Reopened (v2 — prior fix incomplete)
- **Priority:** Medium

---

## 2. Customer report meaning

The user reports that every time they log in or navigate back to the My House page, the "Your Coins" balance shows a different (seemingly random) number. It does not match what was displayed in a previous session, and does not persist across logins or page refreshes.

The user expects to always see the coin balance that is saved in the database. If no balance exists, it should default to zero.

---

## 3. Screenshot reference

No screenshots available. Analysis is based on ticket text, commit history, and source code.

---

## 4. Simplified explanation

> Every time the user logs in, the coin balance on the screen shows a different number instead of the real saved number. It should always show the same correct number that is stored in the database. There are three separate problems causing this: coins earned from quizzes were calculated using random numbers (now partially fixed), coin updates can silently fail without telling the user, and coin totals can be lost when two updates happen at the same time.

---

## 5. Step to reproduce

1. Create an account and log in.
2. Complete a quiz in the Learning Zone.
3. Note the displayed coin balance.
4. Navigate to the My House page and check the "Your Coins" section.
5. Press Back, then navigate to My House again, or log out and log back in.
6. Observe that the coin balance may differ from the one seen in step 3.

**Expected:** Same coin balance on every visit, matching the database.

**Actual:** Balance changes to a different (sometimes random, sometimes stale) value.

---

## 6. Primary area

`lib/services/player.ts` — the server-side service owns both the `upsertPlayer` (destructive on conflict) and `addCoins` (non-atomic) functions that directly control the persisted coin value.

---

## 7. Related areas

| Area | File | Reason |
|------|------|--------|
| Coin context | `contexts/coin-context.tsx` | `addCoins` swallows API errors silently; optimistic state diverges from DB on failure |
| Quiz reward calculation | `lib/coin-rewards.ts` | Root cause of v1 (randomness) — **already fixed** in commit 4dceb6b |
| Question generators | `components/learning-zone.tsx` | Used `randomDifficulty()` per question — **already fixed** in commit 4dceb6b |
| Coins API route | `app/api/players/coins/route.ts` | Delegates to the non-atomic `addCoins` service |
| Player upsert | `lib/services/player.ts` | `upsertPlayer` includes `coins: 0` in upsert payload; resets balance on conflict |

---

## 8. Likely technical flow

```
QuizModal.handleFinish()
  → onComplete(score, totalQuestions, difficulties)        [quiz-modal.tsx:79]
  → LearningZone.handleQuizCompleteInternal()              [learning-zone.tsx:244]
      coinsEarned = calculateSessionCoins(difficulties)    ← now deterministic (5/15/25)
  → onQuizComplete(category, score, totalQuestions, coinsEarned)
  → Dashboard.handleQuizComplete()                         [dashboard.tsx:32-33]
  → CoinContext.addCoins(coinsEarned)                      [coin-context.tsx:91-104]
      setCoins(coins + coinsEarned)  ← optimistic update
      POST /api/players/coins { amount: coinsEarned }
        → addCoins(supabase, userId, amount)               [lib/services/player.ts:54]
            READ  current = getPlayer(...)                 ← non-atomic step 1
            WRITE coins = current.coins + amount           ← non-atomic step 2
      .catch(() => {})               ← SILENT FAILURE: no state rollback
      setCoins(data.coins)           ← updates from server only if call succeeds

On next login:
  AuthContext → setPlayer(data)
  CoinContext useEffect([player]) fires
    → GET /api/players/me           ← reads DB value (may differ from optimistic)
    → setCoins(meData.coins)        ← overwrites optimistic state with DB value
```

---

## 9. Relevant files / classes / modules

| File | Role |
|------|------|
| `lib/services/player.ts` | `upsertPlayer` (coins reset on conflict), `addCoins` (non-atomic read-modify-write) |
| `contexts/coin-context.tsx` | `addCoins` client function — silent error swallowing |
| `lib/coin-rewards.ts` | `calculateSessionCoins` — was the randomness source, now deterministic (v1 fixed) |
| `components/learning-zone.tsx` | Question generators — used `randomDifficulty()`, now uses deterministic functions (v1 fixed) |
| `app/api/players/coins/route.ts` | Delegates to non-atomic `addCoins` |
| `app/api/auth/signup/route.ts` | Calls `upsertPlayer` — only call site |

---

## 10. Likely root cause

### Root cause 1 (v1 — FIXED): Random coin reward generation

`lib/coin-rewards.ts` used `randomDifficulty()` and `randomInt()` to pick both question difficulty and coin reward amount. This was fixed in commit `4dceb6b` by replacing `randomDifficulty()` with deterministic `scoreDifficulty()` / `timesTableDifficulty()`, and replacing `randomInt(5,10)` / `randomInt(10,30)` with fixed values `5` / `15` / `25`.

### Root cause 2 (v2 — REMAINING): `upsertPlayer` resets `coins` to 0 on conflict

`lib/services/player.ts:42`:
```ts
.upsert({ id: userId, name, coins: 0 }, { onConflict: 'id' })
```

Supabase translates this to:
```sql
INSERT INTO players (id, name, coins) VALUES (...)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, coins = EXCLUDED.coins
```

Because `coins: 0` is present in the upsert payload, **any conflict (existing player) resets the balance to zero**. The intended design (documented in `aidlc.archive/.../business-rules.md` BR-AUTH-20) states the upsert should only update `name` on conflict, never `coins`. Currently `upsertPlayer` is only called from the signup route with a freshly created user ID, so this does not fire in normal flows — but it is a latent correctness bug that violates the stated invariant and would silently destroy balances if the code is ever extended (e.g., if signup is retried or the function reused).

### Root cause 3 (v2 — REMAINING): Non-atomic `addCoins` causes race-condition coin loss

`lib/services/player.ts:54-64`:
```ts
const current = await getPlayer(supabase, userId)          // READ
.update({ coins: current.coins + amount })                 // WRITE
```

Two simultaneous POST requests to `/api/players/coins` would both read the same `current.coins`, both compute `current.coins + amount`, and both write the same result — causing one award to be silently lost. This produces an incorrect (lower than expected) balance that is visible on the next login.

### Root cause 4 (v2 — REMAINING): Silent failure in `CoinContext.addCoins`

`contexts/coin-context.tsx:103`:
```ts
.catch(() => {})
```

If the POST to `/api/players/coins` fails (network error, 5xx), the optimistic state update (`setCoins(newCoins)`) is NOT rolled back, and localStorage is already written with the inflated value. The DB retains the pre-quiz balance. On next login, `coin-context` re-fetches from `/api/players/me` and overwrites the display with the (lower) DB value — exactly the "coin number changes on login" symptom in AC3.

---

## 11. Risks / regression areas

| Risk | Area |
|------|------|
| Silent coin loss under concurrent quiz completions | `lib/services/player.ts:addCoins` — race condition |
| Coins reset to 0 if `upsertPlayer` called for existing user | `lib/services/player.ts:upsertPlayer` — latent |
| Stale optimistic display after API failure | `contexts/coin-context.tsx:addCoins` |
| `buySticker` and `buyHouseItem` also silently swallow errors | `contexts/coin-context.tsx` lines 108-128, 132-152 |
| Server trusts client-supplied coin amount (no server-side verification of quiz result) | `app/api/players/coins/route.ts` + `AddCoinsSchema` |

---

## 12. Recommended fix direction

### Fix 1 — Remove `coins` from `upsertPlayer` upsert payload (`lib/services/player.ts:42`)

Change:
```ts
.upsert({ id: userId, name, coins: 0 }, { onConflict: 'id' })
```
To:
```ts
.upsert({ id: userId, name }, { onConflict: 'id' })
```

The `players.coins` column already has `DEFAULT 0` in the migration schema, so new rows will correctly start at 0. On conflict, only `name` will be updated — coins are never touched. This matches the intended BR-AUTH-20 invariant.

### Fix 2 — Make `addCoins` atomic (`lib/services/player.ts:54-64`)

Replace the read-then-write pattern with an atomic SQL increment. Instead of reading `current.coins` and writing `current.coins + amount`, use Supabase's RPC or raw SQL to perform a single atomic `UPDATE players SET coins = coins + $amount WHERE id = $userId RETURNING *`. This eliminates the race condition entirely.

### Fix 3 — Roll back optimistic state on `addCoins` failure (`contexts/coin-context.tsx:103`)

Replace the empty `.catch(() => {})` with a rollback to the previous coin value:
```ts
const previousCoins = coins
setCoins(newCoins)
// ... fetch ...
.catch(() => { setCoins(previousCoins) })
```

This ensures that if the API call fails, the displayed balance returns to the last confirmed server value instead of staying at the inflated optimistic value. On the next login, the display will match the DB and no visible "change" occurs.

---

## 13. Missing / uncertain information

- No screenshot available to confirm exact UI element names or exact reproduction steps.
- Cannot confirm whether the race-condition (Fix 2) has been observed in production or only in theory.
- The exact Supabase RPC/SQL approach for atomic increment needs to be verified against the Supabase client API version in use.
- `buySticker` and `buyHouseItem` in `coin-context.tsx` also swallow errors but are not mentioned in the Jira ticket — fixing them is outside scope unless AC5 ("existing coin-related functionality") is interpreted broadly.
