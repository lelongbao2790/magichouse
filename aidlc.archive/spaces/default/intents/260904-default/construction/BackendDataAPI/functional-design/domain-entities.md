# Domain Entities — Unit 3: BackendDataAPI

## Route Contracts (7 files, 10 handlers)

All routes return `{ data: T | null, error: string | null }` envelope.
All routes except `GET /api/stickers` require a valid session cookie.

### Player Routes

| Method | Path | Auth | Input | Success Data |
|---|---|---|---|---|
| GET | `/api/players/me` | Required | — | `Player` |
| POST | `/api/players/coins` | Required | `{ amount: number }` | `Player` (updated balance) |
| POST | `/api/players/migrate` | Required | `{ coins: number, ownedStickers: string[] }` | `{ migrated: true }` |

### Sticker Routes

| Method | Path | Auth | Input | Success Data |
|---|---|---|---|---|
| GET | `/api/players/stickers` | Required | — | `string[]` (owned sticker IDs) |
| POST | `/api/players/stickers` | Required | `{ stickerId: string }` | `{ newCoinBalance: number }` |
| GET | `/api/stickers` | Required | — | `StickerRow[]` (full catalog) |

### Canvas Route

| Method | Path | Auth | Input | Success Data |
|---|---|---|---|---|
| GET | `/api/players/canvas` | Required | — | `CanvasItem[]` |
| PUT | `/api/players/canvas` | Required | `{ canvasData: CanvasItem[] }` | `null` (200) |

### Quiz Route

| Method | Path | Auth | Input | Success Data |
|---|---|---|---|---|
| GET | `/api/quiz/history` | Required | — | `QuizHistoryRow[]` |
| POST | `/api/quiz/history` | Required | `{ category, score, totalQuestions, coinsEarned }` | `null` (201) |

---

## Service Return Types

### lib/services/player.ts (completed)
```typescript
// Added to existing Unit 2 stub:
addCoins(supabase, userId, amount): Promise<Player>
migrateFromLocalStorage(supabase, userId, coins, stickerIds): Promise<void>
```

### lib/services/stickers.ts (new)
```typescript
getCatalog(supabase): Promise<StickerRow[]>
getOwnedStickers(supabase, userId): Promise<string[]>
purchaseSticker(supabase, userId, stickerId, price): Promise<{ newCoinBalance: number }>
```

### lib/services/canvas.ts (new)
```typescript
getCanvas(supabase, userId): Promise<CanvasItem[]>
saveCanvas(supabase, userId, canvasData: CanvasItem[]): Promise<void>
```

### lib/services/quiz.ts (new)
```typescript
recordHistory(supabase, userId, record: QuizHistoryInsert): Promise<void>
getHistory(supabase, userId): Promise<QuizHistoryRow[]>
```

---

## Zod Schemas (added to lib/validation/api.ts)

```typescript
AddCoinsSchema       { amount: positive integer, max 1000 }
BuyStickerSchema     { stickerId: non-empty string }
CanvasItemSchema     { id, emoji, x, y, scale, rotation }
CanvasSchema         { canvasData: CanvasItemSchema[] }
QuizHistorySchema    { category: enum(9 values), score: int ≥ 0, totalQuestions: int > 0, coinsEarned: int ≥ 0 }
MigrateSchema        { coins: int ≥ 0, ownedStickers: string[] }
```
