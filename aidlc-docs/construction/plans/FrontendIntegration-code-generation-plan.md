# Code Generation Plan — Unit 4: FrontendIntegration

## Unit Context
- **Unit**: FrontendIntegration
- **Workspace Root**: D:\WebPractice_Data\magichouse-main
- **Depends on**: Units 1–3 (all API routes + AuthContext complete)
- **Produces**: 7 modified files, 1 new file, 1 doc = 9 total

## Files Modified (7)

1. `contexts/coin-context.tsx` — full refactor (API primary, cache, migration, async buy)
2. `app/page.tsx` — AuthProvider wrapper, auth-gated routing, remove WelcomeForm
3. `components/dashboard.tsx` — remove name prop, useAuth(), async quiz completion
4. `components/quiz-modal.tsx` — onComplete(score, totalQuestions) signature
5. `components/learning-zone.tsx` — quiz history fire-and-forget, pass score/category up
6. `components/sticker-shop.tsx` — catalog from API, async buySticker, loading state
7. `components/creative-room.tsx` — PlacedSticker→CanvasItem, canvas load/save+debounce

## Files Created (1)

8. `.env.local.example` — env var template

## Documentation (1)

9. `aidlc-docs/construction/FrontendIntegration/code/code-summary.md`

---

## Execution Steps

### Step 1 — contexts/coin-context.tsx (modify)
- [x] Remove `StickerItem` interface, `childName`, `setChildName`, `spendCoins`
- [x] Add `isLoaded`, `isCacheFallback` state; import `useAuth`, `StickerRow`
- [x] Replace localStorage-primary init with `useEffect([player])`: parallel fetch me+stickers → localStorage cache → migration check
- [x] `addCoins(amount)`: optimistic setState + localStorage + background POST (fire-and-forget, sync on success)
- [x] `buySticker(sticker: StickerRow): Promise<boolean>`: POST /api/players/stickers → update state+cache on success → return true/false
- [x] Update CoinContextType interface; remove `spendCoins`, `childName`, `setChildName`

### Step 2 — app/page.tsx (modify)
- [x] Add `AuthProvider` import from `@/contexts/auth-context`
- [x] Add `WelcomeScreen` import, remove `WelcomeForm` import
- [x] Wrap providers: `ThemeProvider > LanguageProvider > AuthProvider > CoinProvider`
- [x] In `HomeContent`: `useAuth()` for `isAuthenticated`; route on `isAuthenticated` (Dashboard vs WelcomeScreen)
- [x] Remove local `name` state, `handleStart`, `handleReset`, localStorage reads, welcome-back screen
- [x] `Dashboard` no longer receives `name` prop; remove that prop

### Step 3 — components/dashboard.tsx (modify)
- [x] Add `import { useAuth } from '@/contexts/auth-context'`
- [x] Remove `name` from `DashboardProps`; read `player.name` from `useAuth()`
- [x] Change `onQuizComplete` prop type to `(category: string, score: number, totalQuestions: number) => void`
- [x] Update `handleQuizComplete(category, score, totalQuestions)`: calls `addCoins(10)` + `setShowFireworks(true)` + fire-and-forget POST /api/quiz/history

### Step 4 — components/quiz-modal.tsx (modify)
- [x] Change `onComplete: () => void` → `onComplete: (score: number, totalQuestions: number) => void`
- [x] Update the call site: `onComplete()` → `onComplete(score, questions.length)`

### Step 5 — components/learning-zone.tsx (modify)
- [x] Change `LearningZoneProps.onQuizComplete` type to `(category: string, score: number, totalQuestions: number) => void`
- [x] Change `handleQuizCompleteInternal` to accept `(score: number, totalQuestions: number)`
- [x] In `handleQuizCompleteInternal`: fire-and-forget POST /api/quiz/history with `{ category: activeQuiz, score, totalQuestions, coinsEarned: 10 }`, then call `onQuizComplete(activeQuiz!, score, totalQuestions)`
- [x] Pass updated `onComplete` to `<QuizModal>`

### Step 6 — components/sticker-shop.tsx (modify)
- [x] Remove `name` from `StickerShopProps`; remove `import { allStickers, getStickersByCategory }`
- [x] Add `catalog: StickerRow[]`, `catalogLoading: boolean`, `purchasingStickerId: string | null` state
- [x] On mount: fetch `GET /api/stickers` → `setCatalog(data)`
- [x] `currentStickers = catalog.filter(s => s.category === activeTab)`
- [x] `totalCount = catalog.length`
- [x] Make `handleBuy` async; `setPurchasingStickerId(sticker.id)` → await `buySticker(sticker)` → clear loading → animate on success
- [x] Buy button: disabled when `purchasingStickerId === sticker.id || !canAfford || owned`; spinner while purchasing

### Step 7 — components/creative-room.tsx (modify)
- [x] Change `PlacedSticker` interface: replace `stickerId: string` with `emoji: string`; add `rotation: number`
- [x] Add `canvasLoaded: boolean` state
- [x] On mount: fetch `GET /api/players/canvas` → `setPlacedStickers(data ?? [])` → `setCanvasLoaded(true)`
- [x] Add debounced save `useEffect([placedStickers])`: skip if `!canvasLoaded`; setTimeout 300ms → PUT /api/players/canvas
- [x] New sticker placement: `{ id: "item-" + Date.now(), emoji: sticker.emoji, x, y, scale: 1, rotation: 0 }`
- [x] Canvas render: `{placed.emoji}` instead of `getStickerById(placed.stickerId)?.emoji`
- [x] Remove `getStickerById` import; keep `allStickers` for collection panel

### Step 8 — .env.local.example (create)
- [x] Create with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY placeholders

### Step 9 — aidlc-docs/construction/FrontendIntegration/code/code-summary.md (create)
- [x] Document all 9 files, key decisions, BR-FE traceability, security compliance

---

## Story Traceability
- FR-08 (localStorage migration) → Step 1 (migration check in CoinContext)
- FR-09 (offline fallback) → Step 1 (isCacheFallback)
- FR-10 (frontend calls API) → Steps 1–7
- NFR-03 (reliability) → Steps 1 (fallback), 6 (debounced save)

## Key Implementation Notes
- Steps 4 and 5 are tightly coupled (QuizModal signature → LearningZone call site) — execute sequentially
- Step 1 is the largest and most complex; all others depend on `CoinContextType` interface being stable
- Step 7: `useRef` for debounce timer to avoid stale closure issues in the `useEffect`
