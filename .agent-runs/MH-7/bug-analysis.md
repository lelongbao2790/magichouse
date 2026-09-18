---

## Final Technical Analysis: MH-7 — Your Coins Number Incorrect (v2)

---

## Jira ticket summary

- **Key:** MH-7
- **Summary:** Your Coins number incorrect
- **Issue Type:** Bug
- **Status:** Reopened (v2 — previous fix incomplete)
- **Priority:** Medium

---

## Customer report meaning

Every login or page refresh shows a different coin balance. The user expects the My House page to always display the actual balance from the database, defaulting to zero if absent.

---

## Screenshot reference

No screenshots available.

---

## Primary area

`lib/services/player.ts` — owns both `upsertPlayer` (which destructively resets coins on conflict) and `addCoins` (which uses a non-atomic read-modify-write).

---

## Related areas

| File | Reason |
|------|--------|
| `lib/services/player.ts` | **v2 root causes**: coins reset on upsert conflict; non-atomic increment |
| `contexts/coin-context.tsx` | **v2 root cause**: silent error swallowing in `addCoins` causes optimistic/DB divergence visible on next login |
| `lib/coin-rewards.ts` | **v1 root cause** — already fixed: `calculateSessionCoins` used `Math.random()` |
| `components/learning-zone.tsx` | **v1 root cause** — already fixed: question generators used `randomDifficulty()` |

---

## Likely flow

```
QuizModal → LearningZone.handleQuizCompleteInternal
  → calculateSessionCoins(difficulties)       ← deterministic now (v1 fixed)
  → Dashboard.handleQuizComplete
  → CoinContext.addCoins(coinsEarned)
      optimistic setCoins(newCoins)
      POST /api/players/coins
        → player.addCoins (READ coins, WRITE coins+amount)  ← non-atomic
      .catch(() => {})                         ← silent failure; no rollback
      setCoins(data.coins)                     ← only if successful

On next login:
  CoinContext useEffect([player]) fires
  → GET /api/players/me → setCoins(dbValue)   ← overwrites stale optimistic state
```

---

## Likely root cause (3 remaining issues after v1 fix)

### RC-1: `upsertPlayer` resets coins to 0 on conflict — `lib/services/player.ts:42`

```ts
.upsert({ id: userId, name, coins: 0 }, { onConflict: 'id' })
```

Including `coins: 0` in the upsert payload means Supabase generates `ON CONFLICT (id) DO UPDATE SET name=..., coins=0`. Any existing player's coin balance is reset to zero if this function is called for them. The intended design (BR-AUTH-20) says only `name` should be updated on conflict. Currently only called during signup with new users (latent risk), but the function violates its own idempotency contract.

### RC-2: Non-atomic `addCoins` — `lib/services/player.ts:54-64`

```ts
const current = await getPlayer(...)           // READ
.update({ coins: current.coins + amount })     // WRITE
```

Two concurrent requests both read the same balance, both write `balance + amount`, and one award is silently lost. The DB ends up with a lower value than the displayed balance, which then "corrects" on next login.

### RC-3: Silent failure in `CoinContext.addCoins` — `contexts/coin-context.tsx:103`

```ts
.catch(() => {})
```

If the POST to `/api/players/coins` fails, the optimistic state and localStorage hold an inflated value. The DB retains the pre-quiz balance. On the next login, `coin-context` fetches from `/api/players/me` and overwrites the display with the lower DB value — the exact "coin number changes on login" symptom from the Jira ticket.

---

## Recommended fix direction (no code written)

**Fix 1** (`lib/services/player.ts:42`): Remove `coins: 0` from the upsert payload. Change `{ id, name, coins: 0 }` to `{ id, name }`. The DB column has `DEFAULT 0`, so new rows start at zero; existing rows are only updated for `name`.

**Fix 2** (`lib/services/player.ts:54-64`): Replace the read-then-write pattern with an atomic SQL increment: `UPDATE players SET coins = coins + $amount WHERE id = $userId RETURNING *`. This eliminates the race condition.

**Fix 3** (`contexts/coin-context.tsx:103`): Replace `.catch(() => {})` with a state rollback: capture the previous coin value before the optimistic update and restore it if the API call fails. This ensures the display matches the DB on next login.

---

## Missing / uncertain information

- No screenshot to confirm exact UI labels.
- RC-2 race condition is theoretical based on code analysis; not confirmed from production logs.
- Exact Supabase client API for atomic SQL increment needs verification.
- `buySticker`/`buyHouseItem` in `coin-context.tsx` have the same silent-failure pattern but are out of scope unless AC5 is interpreted broadly.

---

Report exported to `docs/analysis/MH-7_analysis.md`.

## Analysis Complete
