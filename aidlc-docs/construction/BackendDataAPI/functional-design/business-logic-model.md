# Business Logic Model — Unit 3: BackendDataAPI

## Auth Guard Pattern (Every Route)

```typescript
const supabase = await createServerClient()
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) return apiError('Not authenticated', 401)
// proceed with user.id
```

---

## Service: lib/services/player.ts (additions)

### addCoins(supabase, userId, amount): Promise<Player>
```
UPDATE players SET coins = coins + amount WHERE id = userId RETURNING *
→ Map row → Player
→ Throw if no row returned
```

### migrateFromLocalStorage(supabase, userId, coins, stickerIds): Promise<void>
```
Q2=A (Merge):

1. UPDATE players
   SET coins = GREATEST(coins, :coins)
   WHERE id = :userId

2. For each stickerId in stickerIds:
   INSERT INTO player_stickers (player_id, sticker_id)
   VALUES (:userId, :stickerId)
   ON CONFLICT DO NOTHING
   (batch insert if possible, else sequential)
```

---

## Service: lib/services/stickers.ts

### getCatalog(supabase): Promise<StickerRow[]>
```
SELECT * FROM stickers ORDER BY category, price
→ Return rows
```

### getOwnedStickers(supabase, userId): Promise<string[]>
```
SELECT sticker_id FROM player_stickers WHERE player_id = userId
→ Return array of sticker_id strings
```

### purchaseSticker(supabase, userId, stickerId, price): Promise<{ newCoinBalance: number }>
```
Q1=B (SQL guard):

1. Look up sticker price from stickers table (or accept price from route after server-side lookup)

2. UPDATE players
   SET coins = coins - :price
   WHERE id = :userId AND coins >= :price
   RETURNING coins
   → If 0 rows: throw InsufficientFundsError

3. INSERT INTO player_stickers (player_id, sticker_id, purchased_at)
   VALUES (:userId, :stickerId, now())
   ON CONFLICT DO NOTHING
   (sticker already owned = idempotent success)

4. Return { newCoinBalance: updated coins value }
```

---

## Service: lib/services/canvas.ts

### getCanvas(supabase, userId): Promise<CanvasItem[]>
```
SELECT canvas_data FROM creative_canvas WHERE player_id = userId
→ If no row: return []
→ Return canvas_data as CanvasItem[]
```

### saveCanvas(supabase, userId, canvasData): Promise<void>
```
INSERT INTO creative_canvas (player_id, canvas_data, updated_at)
VALUES (:userId, :canvasData, now())
ON CONFLICT (player_id) DO UPDATE
  SET canvas_data = EXCLUDED.canvas_data,
      updated_at = now()
```

---

## Service: lib/services/quiz.ts

### recordHistory(supabase, userId, record): Promise<void>
```
INSERT INTO quiz_history (player_id, category, score, total_questions, coins_earned)
VALUES (:userId, :category, :score, :totalQuestions, :coinsEarned)
```

### getHistory(supabase, userId): Promise<QuizHistoryRow[]>
```
SELECT * FROM quiz_history
WHERE player_id = userId
ORDER BY completed_at DESC
```

---

## Route Logic Flows

### GET /api/players/me
```
Auth guard → getPlayer(supabase, user.id) → apiSuccess(player)
```

### POST /api/players/coins
```
Auth guard
→ Parse + validate AddCoinsSchema
→ addCoins(supabase, user.id, amount)
→ apiSuccess(updatedPlayer)
```

### POST /api/players/migrate
```
Auth guard
→ Parse + validate MigrateSchema
→ migrateFromLocalStorage(supabase, user.id, coins, ownedStickers)
→ apiSuccess({ migrated: true })
```

### GET /api/players/stickers
```
Auth guard → getOwnedStickers(supabase, user.id) → apiSuccess(stickerIds)
```

### POST /api/players/stickers
```
Auth guard
→ Parse + validate BuyStickerSchema
→ Fetch sticker from catalog: SELECT price FROM stickers WHERE id = stickerId
  → If not found: apiError('Sticker not found', 404)
→ purchaseSticker(supabase, user.id, stickerId, price)
  → If InsufficientFunds: apiError('Not enough coins', 400)
→ apiSuccess({ newCoinBalance })
```

### GET /api/stickers
```
Auth guard → getCatalog(supabase) → apiSuccess(stickers)
```

### GET /api/players/canvas
```
Auth guard → getCanvas(supabase, user.id) → apiSuccess(canvasData)
```

### PUT /api/players/canvas
```
Auth guard
→ Parse + validate CanvasSchema
→ saveCanvas(supabase, user.id, canvasData)
→ apiSuccess(null)
```

### GET /api/quiz/history
```
Auth guard → getHistory(supabase, user.id) → apiSuccess(rows)
```

### POST /api/quiz/history
```
Auth guard
→ Parse + validate QuizHistorySchema
→ recordHistory(supabase, user.id, { category, score, totalQuestions, coinsEarned })
→ apiSuccess(null)  [HTTP 200 — fire-and-forget; frontend swallows errors]
```

---

## Custom Error Type

```typescript
class InsufficientFundsError extends Error {
  constructor() { super('Not enough coins') }
}
```

Used in `purchaseSticker` to signal a catchable business error distinct from
unexpected DB errors. Route handler catches this specifically and returns 400;
all other errors propagate to the outer try/catch (500).
