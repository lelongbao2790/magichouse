# Business Rules — Unit 4: FrontendIntegration

## CoinContext — Initialization

| Rule | Description |
|---|---|
| BR-FE-01 | CoinContext watches `player` from `useAuth()`; runs data fetch effect when `player` changes |
| BR-FE-02 | When player becomes non-null: fetch `GET /api/players/me` and `GET /api/players/stickers` in parallel |
| BR-FE-03 | On successful fetch: `setCoins(me.coins)`, `setOwnedStickers(stickers)`, write localStorage cache, `setIsLoaded(true)` |
| BR-FE-04 | On any fetch failure: read `localStorage.getItem("kidCoins")` and `localStorage.getItem("kidStickers")` as fallback; set `isCacheFallback = true`, `setIsLoaded(true)` |
| BR-FE-05 | When player becomes null (logout): reset state to `{ coins: 0, ownedStickers: [], isLoaded: false, isCacheFallback: false }` |

---

## CoinContext — Migration

| Rule | Description |
|---|---|
| BR-FE-06 | After loading data (BR-FE-03), check if `localStorage.getItem("migrationDone") === "true"` |
| BR-FE-07 | If migration not done AND (savedCoins > 0 OR savedStickers.length > 0): fire POST `/api/players/migrate` |
| BR-FE-08 | Migration body: `{ coins: parseInt(localStorage.kidCoins \|\| "0"), ownedStickers: JSON.parse(localStorage.kidStickers \|\| "[]") }` |
| BR-FE-09 | On migration success: `localStorage.setItem("migrationDone", "true")` |
| BR-FE-10 | Migration is fire-and-forget: errors silently ignored; UI is not blocked |
| BR-FE-11 | If `migrationDone === "true"` or no old localStorage data: skip migration silently |

---

## CoinContext — addCoins (Q4=A Optimistic)

| Rule | Description |
|---|---|
| BR-FE-12 | `addCoins(amount)` immediately updates state: `setCoins(prev => prev + amount)` |
| BR-FE-13 | Immediately writes new value to `localStorage.setItem("kidCoins", ...)` |
| BR-FE-14 | Fires POST `/api/players/coins` in background (no await in the calling code) |
| BR-FE-15 | On API success: sync with server value `setCoins(data.coins)` to correct any drift |
| BR-FE-16 | On API failure: silent — optimistic value stays, localStorage may be slightly ahead of DB |

---

## CoinContext — buySticker (Q1=A Loading State)

| Rule | Description |
|---|---|
| BR-FE-17 | `buySticker(sticker)` is async and returns `Promise<boolean>` |
| BR-FE-18 | Caller (StickerShop) is responsible for showing loading state while `buySticker` is in flight |
| BR-FE-19 | Posts `{ stickerId: sticker.id }` to `POST /api/players/stickers` |
| BR-FE-20 | On success: `setCoins(data.newCoinBalance)`, add `sticker.id` to `ownedStickers`, update localStorage; return `true` |
| BR-FE-21 | On 400 (insufficient funds): return `false` |
| BR-FE-22 | On any other error: return `false` |
| BR-FE-23 | Does NOT do optimistic update — state changes only on confirmed API success |

---

## page.tsx — Auth-Gated Routing

| Rule | Description |
|---|---|
| BR-FE-24 | `AuthProvider` wraps the entire application inside `ThemeProvider` + `LanguageProvider` |
| BR-FE-25 | `CoinProvider` is nested inside `AuthProvider` |
| BR-FE-26 | `HomeContent` reads `isAuthenticated` from `useAuth()` |
| BR-FE-27 | If `isAuthenticated === true`: render `<Dashboard onBack={handleBack} />` (no `name` prop) |
| BR-FE-28 | If `isAuthenticated === false`: render `<WelcomeScreen />` |
| BR-FE-29 | Remove `WelcomeForm`, local `name` state, `handleStart`, `handleReset` — replaced by auth flow |
| BR-FE-30 | Remove localStorage reads for `kidName` in page.tsx |

---

## Dashboard

| Rule | Description |
|---|---|
| BR-FE-31 | `name` prop removed; Dashboard reads `player.name` from `useAuth()` (Q3=A) |
| BR-FE-32 | `handleQuizComplete(category, score, totalQuestions)` — receives data from LearningZone |
| BR-FE-33 | `handleQuizComplete` calls `addCoins(10)` (optimistic) and `setShowFireworks(true)` immediately (Q4=A) |
| BR-FE-34 | `handleQuizComplete` also fires POST `/api/quiz/history` with `{ category, score, totalQuestions, coinsEarned: 10 }` (fire-and-forget) |
| BR-FE-35 | `onQuizComplete` prop type changes to `(category: string, score: number, totalQuestions: number) => void` |

---

## StickerShop

| Rule | Description |
|---|---|
| BR-FE-36 | On mount: fetch `GET /api/stickers`; store in `catalog` state; `setCatalogLoading(false)` on done |
| BR-FE-37 | Replace `allStickers` and `getStickersByCategory` imports with local filtering of `catalog` by `activeTab` |
| BR-FE-38 | `totalCount` = `catalog.length` (was `allStickers.length`) |
| BR-FE-39 | `handleBuy` is now async; sets `purchasingStickerId(sticker.id)` before calling `buySticker` |
| BR-FE-40 | On `buySticker` return: clear `purchasingStickerId`; if true, show purchase animation |
| BR-FE-41 | Buy button is disabled when `purchasingStickerId === sticker.id` OR `coins < sticker.price` |
| BR-FE-42 | `handleBuy` accepts `StickerRow` instead of `typeof allStickers[0]` |

---

## CreativeRoom

| Rule | Description |
|---|---|
| BR-FE-43 | On mount: fetch `GET /api/players/canvas`; `setPlacedStickers(data)` — data is already `CanvasItem[]` which equals new `PlacedSticker[]` (Q2=A) |
| BR-FE-44 | `PlacedSticker` interface now matches `CanvasItem`: `{ id, emoji, x, y, scale, rotation }` |
| BR-FE-45 | New stickers placed on canvas: `{ id: "item-" + Date.now(), emoji: sticker.emoji, x, y, scale: 1, rotation: 0 }` |
| BR-FE-46 | Render uses `placed.emoji` directly instead of `getStickerById(placed.stickerId).emoji` |
| BR-FE-47 | On `placedStickers` change: debounce 300ms; fire PUT `/api/players/canvas { canvasData: placedStickers }` |
| BR-FE-48 | Canvas save is fire-and-forget; errors silently ignored (last-write-wins per BR-DATA-29) |
| BR-FE-49 | Collection panel still uses `allStickers.filter(s => ownedStickers.includes(s.id))` from static data for emoji/name lookup |
| BR-FE-50 | Remove `getStickerById` import (no longer needed in canvas render path) |

---

## LearningZone + QuizModal

| Rule | Description |
|---|---|
| BR-FE-51 | `QuizModal.onComplete` signature changes to `(score: number, totalQuestions: number) => void` |
| BR-FE-52 | `handleQuizCompleteInternal` receives `(score, totalQuestions)` from QuizModal |
| BR-FE-53 | `handleQuizCompleteInternal` fires POST `/api/quiz/history` (fire-and-forget) with `{ category: activeQuiz, score, totalQuestions, coinsEarned: 10 }` |
| BR-FE-54 | `onQuizComplete` called with `(activeQuiz, score, totalQuestions)` after firing history |
| BR-FE-55 | LearningZone `onQuizComplete` prop type: `(category: string, score: number, totalQuestions: number) => void` |
| BR-FE-56 | Quiz history errors silently swallowed — fire-and-forget per BR-DATA-34 |
