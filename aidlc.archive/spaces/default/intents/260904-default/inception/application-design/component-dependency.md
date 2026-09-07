# Component Dependencies — Supabase Backend Integration

## Dependency Matrix

| Component | Depends On |
|---|---|
| `LoginView` | `AuthContext` |
| `RegisterView` | `AuthContext` |
| `WelcomeScreen` | `LoginView`, `RegisterView` |
| `Dashboard` | `AuthContext`, `CoinContext` |
| `LearningZone` | `CoinContext`, `/api/quiz/history` (direct fetch) |
| `StickerShop` | `CoinContext` (buySticker + ownedStickers), `/api/stickers` (direct fetch) |
| `CreativeRoom` | `CoinContext` (ownedStickers), `AuthContext` (userId), `/api/players/canvas` (direct fetch) |
| `AuthContext` | `lib/supabase/client.ts`, `/api/auth/*` |
| `CoinContext` | `AuthContext` (userId), `/api/players/*`, `localStorage` (cache) |
| API Route Handlers | `lib/supabase/server.ts`, `lib/services/*`, `lib/validation/api.ts`, `lib/api-response.ts` |
| `lib/services/player.ts` | Supabase `players` table |
| `lib/services/stickers.ts` | Supabase `stickers`, `player_stickers` tables |
| `lib/services/canvas.ts` | Supabase `creative_canvas` table |
| `lib/services/quiz.ts` | Supabase `quiz_history` table |

---

## Architecture Layers

```
+------------------------------------------------------+
|              BROWSER (React Components)              |
|                                                      |
|  WelcomeScreen                                       |
|    LoginView ──────────────────────────────┐         |
|    RegisterView ────────────────────────── | ─┐      |
|                                            |  |      |
|  Dashboard                                 |  |      |
|    LearningZone                            |  |      |
|    StickerShop                             |  |      |
|    CreativeRoom                            |  |      |
|                                            |  |      |
|  Contexts                                  |  |      |
|    AuthContext ─── supabase/client.ts ─────┘  |      |
|    CoinContext ─── localStorage (cache)   ────┘      |
|                                                      |
+------------------------|-----------------------------+
                         | HTTP (fetch)
+------------------------|-----------------------------+
|           NEXT.JS SERVER (API Routes)                |
|                                                      |
|  /api/auth/*     /api/players/*                      |
|  /api/stickers   /api/quiz/history                   |
|       |                                              |
|  lib/api-response.ts  lib/validation/api.ts          |
|       |                                              |
|  lib/services/                                       |
|    player.ts   stickers.ts   canvas.ts   quiz.ts     |
|       |                                              |
|  lib/supabase/server.ts                              |
|                                                      |
+------------------------|-----------------------------+
                         | Supabase JS SDK
+------------------------|-----------------------------+
|              SUPABASE (PostgreSQL)                   |
|                                                      |
|  auth.users  players  stickers  player_stickers      |
|  creative_canvas  quiz_history                       |
|                                                      |
+------------------------------------------------------+
```

---

## Data Flow Diagrams

### Authentication Flow

```
User opens app
      |
      v
page.tsx → AuthContext.isLoading? → show spinner
      |
      v (session exists via cookie)
AuthContext → GET /api/auth/session → players table
      |
      v
Dashboard shown → CoinContext.loadPlayerData()
  → GET /api/players/me + GET /api/players/stickers
  → Check localStorage migration flag
  → If needed: POST /api/players/migrate
```

### Quiz Completion Flow

```
LearningZone → quiz complete
      |
      ├─ CoinContext.addCoins(10)
      |     → POST /api/players/coins
      |     → Update localStorage cache
      |
      └─ POST /api/quiz/history (fire-and-forget)
            category, score, total, coinsEarned
```

### Sticker Purchase Flow

```
StickerShop → user clicks Buy
      |
      v
CoinContext.buySticker(sticker)
      |
      v
POST /api/players/stickers
      |
      v (server-side transaction)
  stickers.purchaseSticker()
    UPDATE players.coins - price
    INSERT player_stickers
      |
      v
Return { newCoinBalance }
      |
      v
CoinContext: update coins + ownedStickers + localStorage cache
```

### Canvas Save Flow

```
CreativeRoom → user moves sticker
      |
      v
Internal state updated (immediate, no debounce)
      |
      v (after 300ms debounce)
PUT /api/players/canvas { canvasData: [...] }
      |
      v
canvas.saveCanvas() → UPSERT creative_canvas
```

### Offline Fallback Flow

```
Any CoinContext API call
      |
      v
fetch() → network error or timeout
      |
      v
catch block → load from localStorage cache
CoinContext.isCacheFallback = true
      |
      v
On next successful API call:
  sync response data → localStorage cache
  isCacheFallback = false
```

---

## Communication Patterns

| Pattern | Used For |
|---|---|
| Context subscription | Components read coins/stickers from CoinContext; auth state from AuthContext |
| Direct fetch (from component) | StickerShop fetches catalog; CreativeRoom fetches/saves canvas; LearningZone posts quiz history |
| Fire-and-forget | Quiz history recording (errors swallowed, does not block UI) |
| Write-through cache | Every successful API coin/sticker response → localStorage |
| Debounced write | Canvas saves — 300 ms delay to batch rapid drag changes |
| Transactional write | Sticker purchase — coins deduction + ownership insert atomic |
