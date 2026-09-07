# Service Layer Design — Supabase Backend Integration

## Overview

The service layer (`lib/services/`) contains all Supabase database operations.
It is called exclusively from API route handlers — never from frontend components directly.

**Pattern**: API Route Handler → Service Function → Supabase Client → PostgreSQL

All service functions:
- Accept a `SupabaseClient` instance (injected by the API route, already session-aware)
- Are async and throw errors on unexpected failures (API routes catch via try/catch)
- Never return raw Supabase errors to callers — throw typed `Error` with safe messages

---

## player.ts — Player Profile and Coins

**Orchestration**: Used by `/api/auth/signup`, `/api/players/me`, `/api/players/coins`, `/api/players/migrate`

```
API: POST /api/auth/signup
  → auth.signUp(email, password)     [Supabase Auth]
  → player.upsertPlayer(id, name)    [insert row into players table]
  → return Player

API: GET /api/players/me
  → player.getPlayer(userId)         [select from players]
  → return Player

API: POST /api/players/coins
  → player.addCoins(userId, amount)  [update players.coins += amount]
  → return updated Player

API: POST /api/players/migrate
  → player.migrateFromLocalStorage(userId, coins, stickerIds)
    → UPDATE players SET coins = coins + $coins
    → INSERT INTO player_stickers (skip duplicates via ON CONFLICT DO NOTHING)
  → return void
```

---

## stickers.ts — Catalog and Ownership

**Orchestration**: Used by `/api/stickers`, `/api/players/stickers`

```
API: GET /api/stickers
  → stickers.getCatalog()            [select * from stickers order by category, price]
  → return StickerCatalogItem[]

API: GET /api/players/stickers
  → stickers.getOwnedStickers(userId) [select sticker_id from player_stickers where player_id = $id]
  → return string[]

API: POST /api/players/stickers
  1. Validate stickerId exists in catalog   [stickers.getCatalog() or direct query]
  2. Check player has enough coins          [player.getPlayer()]
  3. Deduct coins + insert ownership atomically:
     → stickers.purchaseSticker(userId, stickerId, price)
       → BEGIN TRANSACTION
         UPDATE players SET coins = coins - $price WHERE id = $id AND coins >= $price
         INSERT INTO player_stickers (player_id, sticker_id)
       → COMMIT
  4. return { newCoinBalance: number }
```

---

## canvas.ts — Creative Room Persistence

**Orchestration**: Used by `/api/players/canvas`

```
API: GET /api/players/canvas
  → canvas.getCanvas(userId)
    → SELECT canvas_data FROM creative_canvas WHERE player_id = $id
    → If no row: return [] (empty canvas)
  → return PlacedSticker[]

API: PUT /api/players/canvas
  → canvas.saveCanvas(userId, canvasData)
    → UPSERT INTO creative_canvas (player_id, canvas_data, updated_at)
       ON CONFLICT (player_id) DO UPDATE SET canvas_data = $data, updated_at = now()
  → return void
```

---

## quiz.ts — Quiz History

**Orchestration**: Used by `/api/quiz/history`

```
API: POST /api/quiz/history
  → quiz.recordHistory(userId, { category, score, totalQuestions, coinsEarned })
    → INSERT INTO quiz_history (...) VALUES (...)
  → return void

API: GET /api/quiz/history
  → quiz.getHistory(userId)
    → SELECT * FROM quiz_history WHERE player_id = $id ORDER BY completed_at DESC
  → return QuizHistoryRow[]
```

---

## Authentication Flow (Supabase Auth — not a service module)

Supabase Auth is called directly in API route handlers (not wrapped in a service module, as it has its own SDK):

```
POST /api/auth/signup
  1. supabase.auth.signUp({ email, password })    [creates auth.users row]
  2. player.upsertPlayer(user.id, name)           [creates players row]
  3. Set session cookie via @supabase/ssr
  4. Return { data: Player, error: null }

POST /api/auth/login
  1. supabase.auth.signInWithPassword({ email, password })
  2. Set session cookie
  3. player.getPlayer(user.id)
  4. Return { data: Player, error: null }

POST /api/auth/logout
  1. supabase.auth.signOut()
  2. Clear session cookie
  3. Return { data: null, error: null }

GET /api/auth/session
  1. supabase.auth.getUser()           [verifies JWT from cookie]
  2. If valid: player.getPlayer(user.id)
  3. Return { data: Player | null, error: null }
```

---

## Cross-Cutting Service Patterns

**Session Verification** (applied in every authenticated route):
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) return apiError("Unauthorized", 401)
```

**Error Handling** (applied in every route handler):
```typescript
try {
  // service call
  return apiSuccess(result)
} catch (err) {
  console.error("[route-name]", err)        // server-side log only
  return apiError("Internal server error", 500)
}
```

**Transaction Safety** (coin deduction + sticker insert):
- Use Supabase RPC (PostgreSQL function) or raw SQL transaction for `purchaseSticker`
- Prevents race condition where coins are deducted but sticker insert fails
