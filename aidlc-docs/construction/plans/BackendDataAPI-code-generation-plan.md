# Code Generation Plan — Unit 3: BackendDataAPI

## Unit Context
- **Unit**: BackendDataAPI
- **Workspace Root**: D:\WebPractice_Data\magichouse-main
- **Depends on**: Unit 1 (5 tables + RLS), Unit 2 (createServerClient, apiSuccess/apiError, player service stub, lib/validation/api.ts)
- **Produces**: 7 route files (10 handlers), 3 new service modules, completed player service, 6 new Zod schemas, 1 doc

## Files Modified vs Created

### Modified (2)
- `lib/validation/api.ts` — add 6 Zod schemas + inferred types
- `lib/services/player.ts` — add `addCoins` + `migrateFromLocalStorage`

### Created — Service Layer (3)
- `lib/services/stickers.ts` — `InsufficientFundsError`, `getCatalog`, `getOwnedStickers`, `purchaseSticker`
- `lib/services/canvas.ts` — `getCanvas`, `saveCanvas`
- `lib/services/quiz.ts` — `recordHistory`, `getHistory`

### Created — Route Handlers (7 files, 10 handlers)
- `app/api/players/me/route.ts` — GET
- `app/api/players/coins/route.ts` — POST
- `app/api/players/migrate/route.ts` — POST
- `app/api/players/stickers/route.ts` — GET + POST
- `app/api/stickers/route.ts` — GET
- `app/api/players/canvas/route.ts` — GET + PUT
- `app/api/quiz/history/route.ts` — GET + POST

### Created — Documentation (1)
- `aidlc-docs/construction/BackendDataAPI/code/code-summary.md`

**Total: 13 files**

---

## Execution Steps

### Step 1 — lib/validation/api.ts (modify)
- [x] Append 6 new Zod schemas after existing auth schemas:
  - `AddCoinsSchema`: `{ amount: z.number().int().positive().max(1000) }`
  - `BuyStickerSchema`: `{ stickerId: z.string().min(1) }`
  - `CanvasItemSchema`: `{ id, emoji, x, y, scale, rotation }` (string/number fields)
  - `CanvasSchema`: `{ canvasData: CanvasItemSchema[] }`
  - `QuizHistorySchema`: `{ category: z.enum([...9 values...]), score: int ≥ 0, totalQuestions: int > 0, coinsEarned: int ≥ 0 }`
  - `MigrateSchema`: `{ coins: int ≥ 0, ownedStickers: string[] }`
- [x] Export inferred types for all new schemas

### Step 2 — lib/services/player.ts (modify)
- [x] Add `addCoins(supabase, userId, amount)`: UPDATE players SET coins = coins + amount WHERE id = userId RETURNING *; map row → Player; throw if no row
- [x] Add `migrateFromLocalStorage(supabase, userId, coins, stickerIds)`: UPDATE players SET coins = GREATEST(coins, coins_param); batch INSERT player_stickers ON CONFLICT DO NOTHING

### Step 3 — lib/services/stickers.ts (new)
- [x] Define `InsufficientFundsError extends Error`
- [x] `getCatalog(supabase)`: SELECT * FROM stickers ORDER BY category, price → StickerRow[]
- [x] `getOwnedStickers(supabase, userId)`: SELECT sticker_id FROM player_stickers WHERE player_id = userId → string[]
- [x] `purchaseSticker(supabase, userId, stickerId, price)`: SQL-guard UPDATE + INSERT ON CONFLICT DO NOTHING → { newCoinBalance }

### Step 4 — lib/services/canvas.ts (new)
- [x] `getCanvas(supabase, userId)`: SELECT canvas_data FROM creative_canvas WHERE player_id = userId; no row → []; return CanvasItem[]
- [x] `saveCanvas(supabase, userId, canvasData)`: UPSERT on player_id conflict

### Step 5 — lib/services/quiz.ts (new)
- [x] `recordHistory(supabase, userId, record)`: INSERT INTO quiz_history
- [x] `getHistory(supabase, userId)`: SELECT * FROM quiz_history WHERE player_id = userId ORDER BY completed_at DESC → QuizHistoryRow[]

### Step 6 — app/api/players/me/route.ts (new)
- [x] GET: auth guard → getPlayer → apiSuccess(player) | 404 if not found | 500 on error

### Step 7 — app/api/players/coins/route.ts (new)
- [x] POST: auth guard → AddCoinsSchema → addCoins → apiSuccess(updatedPlayer)

### Step 8 — app/api/players/migrate/route.ts (new)
- [x] POST: auth guard → MigrateSchema → migrateFromLocalStorage → apiSuccess({ migrated: true })

### Step 9 — app/api/players/stickers/route.ts (new)
- [x] GET: auth guard → getOwnedStickers → apiSuccess(stickerIds)
- [x] POST: auth guard → BuyStickerSchema → fetch price from stickers table (404 if not found) → purchaseSticker (catch InsufficientFundsError → 400) → apiSuccess({ newCoinBalance })

### Step 10 — app/api/stickers/route.ts (new)
- [x] GET: auth guard → getCatalog → apiSuccess(stickers)

### Step 11 — app/api/players/canvas/route.ts (new)
- [x] GET: auth guard → getCanvas → apiSuccess(canvasData)
- [x] PUT: auth guard → CanvasSchema → saveCanvas → apiSuccess(null)

### Step 12 — app/api/quiz/history/route.ts (new)
- [x] GET: auth guard → getHistory → apiSuccess(rows)
- [x] POST: auth guard → QuizHistorySchema → recordHistory → apiSuccess(null) [HTTP 200]

### Step 13 — aidlc-docs/construction/BackendDataAPI/code/code-summary.md (new)
- [x] Document all 13 files: paths, purpose, key implementation details
- [x] Note business rules implemented (BR-DATA-01 through BR-DATA-34)
- [x] Security compliance summary

---

## Story Traceability
- All 10 route handlers implement backend data API requirements from `aidlc-docs/construction/BackendDataAPI/functional-design/`
- Business rules BR-DATA-01 through BR-DATA-34 fully implemented across Steps 1–12

## Security Baseline Compliance (Per-Step)
- Every route: auth guard (BR-DATA-01), try/catch 500 (BR-DATA-02)
- Zod validation before any DB call (SECURITY rules)
- No user-controlled input passed raw to SQL
- `InsufficientFundsError` distinguishes business error from unexpected DB errors
