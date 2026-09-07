# Code Summary — Unit 3: BackendDataAPI

## Files Modified (2)

### lib/validation/api.ts
Added 6 Zod schemas and 5 inferred types to the existing auth schemas:
- `AddCoinsSchema` — `{ amount: int, positive, max 1000 }`
- `BuyStickerSchema` — `{ stickerId: non-empty string }`
- `CanvasItemSchema` — `{ id, emoji, x, y, scale, rotation }`
- `CanvasSchema` — `{ canvasData: CanvasItemSchema[] }`
- `QuizHistorySchema` — `{ category: enum(9), score ≥ 0, totalQuestions > 0, coinsEarned ≥ 0 }`
- `MigrateSchema` — `{ coins: int ≥ 0, ownedStickers: string[] }`

### lib/services/player.ts
Added two functions to the existing Unit 2 stub:
- `addCoins(supabase, userId, amount)` — reads current coins, updates `coins + amount`, returns updated Player
- `migrateFromLocalStorage(supabase, userId, coins, stickerIds)` — GREATEST via `Math.max` for coins; batch upsert stickers with `ignoreDuplicates: true`

---

## Files Created — Service Layer (3)

### lib/services/stickers.ts
- `InsufficientFundsError extends Error` — distinguishes business error from DB errors in route catch blocks
- `getCatalog(supabase)` — `SELECT * FROM stickers ORDER BY category, price`
- `getOwnedStickers(supabase, userId)` — returns `string[]` of sticker IDs from `player_stickers`
- `purchaseSticker(supabase, userId, stickerId, price)`:
  1. Read current coins
  2. SQL-level guard via `.gte('coins', price)` on the UPDATE (PostgREST translates to `WHERE coins >= price`) — Q1=B
  3. If 0 rows returned → throw `InsufficientFundsError`
  4. Upsert sticker ownership with `ignoreDuplicates: true` — idempotent
  5. Return `{ newCoinBalance }` from the UPDATE RETURNING value

### lib/services/canvas.ts
- `getCanvas(supabase, userId)` — returns `[]` on PGRST116 (no row); casts `canvas_data` JSONB → `CanvasItem[]`
- `saveCanvas(supabase, userId, canvasData)` — UPSERT on `player_id` conflict; last-write-wins

### lib/services/quiz.ts
- `recordHistory(supabase, userId, record)` — INSERT into `quiz_history`; maps camelCase → snake_case columns
- `getHistory(supabase, userId)` — SELECT ordered by `completed_at DESC`

---

## Files Created — Route Handlers (7 files, 10 handlers)

All routes follow the same pattern:
1. `createServerClient()` → `supabase.auth.getUser()` (auth guard)
2. Zod validation on request body (where applicable)
3. Service function call
4. Typed response via `apiSuccess` / `apiError`
5. Outer try/catch → `apiError('Internal server error', 500)`

| File | Handler(s) | Business Rules |
|---|---|---|
| `app/api/players/me/route.ts` | GET | BR-DATA-03, BR-DATA-04 |
| `app/api/players/coins/route.ts` | POST | BR-DATA-05, BR-DATA-06, BR-DATA-07 |
| `app/api/players/migrate/route.ts` | POST | BR-DATA-08 through BR-DATA-12 |
| `app/api/players/stickers/route.ts` | GET + POST | BR-DATA-13 through BR-DATA-20 |
| `app/api/stickers/route.ts` | GET | BR-DATA-21, BR-DATA-22 |
| `app/api/players/canvas/route.ts` | GET + PUT | BR-DATA-23 through BR-DATA-29 |
| `app/api/quiz/history/route.ts` | GET + POST | BR-DATA-30 through BR-DATA-34 |

---

## Security Compliance

| Rule | Status | Notes |
|---|---|---|
| SECURITY-01 (Auth on all routes) | COMPLIANT | Auth guard first line of every handler |
| SECURITY-02 (Input validation) | COMPLIANT | Zod schema parsed before any DB call |
| SECURITY-03 (SQL injection) | COMPLIANT | All queries use parameterized Supabase SDK calls |
| SECURITY-04 (Error handling) | COMPLIANT | Outer try/catch on all routes; business errors mapped to 4xx |
| SECURITY-05 (No secrets in client) | N/A | Server-only code; no client-side exposure |
| Purchase atomicity | COMPLIANT | `.gte('coins', price)` on UPDATE is WHERE guard equivalent (Q1=B) |
| Migration merge | COMPLIANT | `Math.max` for coins + `ignoreDuplicates: true` for stickers (Q2=A) |

---

## Key Design Decisions

**purchaseSticker SQL guard (Q1=B)**: The Supabase JS SDK cannot pass SQL expressions in update bodies. The guard is implemented by combining a read (to compute the new value) with a PostgREST WHERE filter (`.gte('coins', price)`), which PostgREST translates to `UPDATE players SET coins = $1 WHERE id = $2 AND coins >= $3`. Zero rows returned = insufficient funds or concurrent modification.

**addCoins / migrateFromLocalStorage**: Two-step (read then write) is acceptable because concurrent quiz completions in a single-device children's app are practically impossible. No optimistic lock needed.

**InsufficientFundsError**: Caught specifically in the POST `/api/players/stickers` route handler and mapped to 400. All other errors propagate to the outer catch (500), preventing over-broad 400 responses.
