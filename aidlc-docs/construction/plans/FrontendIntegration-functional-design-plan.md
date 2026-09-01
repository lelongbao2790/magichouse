# Functional Design Plan — Unit 4: FrontendIntegration

## Unit Context
- **Unit**: FrontendIntegration
- **Depends on**: Units 1–3 (all API routes live, auth context complete)
- **NFR stages**: All SKIP (patterns carry over)
- **Produces**: Refactored CoinContext, wired page.tsx, updated Dashboard/StickerShop/CreativeRoom/LearningZone

## Files to Change

### Modified (7)
- `contexts/coin-context.tsx` — full refactor (API primary, localStorage cache + fallback, migration)
- `app/page.tsx` — add AuthProvider, auth-gated routing (WelcomeScreen vs Dashboard)
- `components/dashboard.tsx` — name sourcing, async addCoins, quiz history data threading
- `components/sticker-shop.tsx` — fetch catalog from `/api/stickers`, async buySticker
- `components/creative-room.tsx` — load canvas on mount, debounced PUT save, canvas data model
- `components/learning-zone.tsx` — fire-and-forget POST `/api/quiz/history` after quiz
- `components/quiz-modal.tsx` — expose score+totalQuestions via onComplete callback

### Created (1)
- `.env.local.example` — template with placeholder values

## Artifacts to Generate
- [x] domain-entities.md — refactored state shapes, API call contracts per component
- [x] business-rules.md — per-component rules, cache rules, migration rules
- [x] business-logic-model.md — flows for CoinContext, page.tsx, each component
- [x] frontend-components.md — props/state changes, interaction flows, data-testid additions

---

## Questions

### Question 1
When a child taps "Buy Now" in the Sticker Shop, the new `buySticker()` makes an async
API call (`POST /api/players/stickers`). During this in-flight request, the UI should:

A) Loading state — disable the "Buy Now" button immediately and show a spinner;
   update coin balance and sticker ownership only on confirmed API success.
   If API errors: show brief error message, re-enable button. No rollback needed.

B) Optimistic update — mark sticker as "owned" and deduct coins from display immediately
   (before API responds); silently correct on API error (restore coins/sticker state).
   Snappier feel for children, but requires rollback logic.

[Answer]:

---

### Question 2
The current `creative-room.tsx` uses a local `PlacedSticker` type:
`{ id: string; stickerId: string; x: number; y: number; scale: number }`

The API's `CanvasItem` type is:
`{ id: string; emoji: string; x: number; y: number; scale: number; rotation: number }`

These must be reconciled for canvas load/save. Which approach?

A) Align local type to CanvasItem — change `PlacedSticker` to store `emoji` directly
   (remove `stickerId`); add `rotation: 0` as default for new placements.
   Rendering uses `placed.emoji` instead of `getStickerById(placed.stickerId).emoji`.
   Simpler: no stickerId lookup, API shape IS the runtime shape.

B) Keep local PlacedSticker type — transform to CanvasItem on save (stickerId → emoji
   lookup) and accept that on load from API, stickerId cannot be recovered
   (store emoji in CanvasItem, don't need stickerId for display anyway).
   More code, same practical result since only emoji is needed at runtime.

[Answer]:

---

### Question 3
Dashboard currently receives `name` as a prop passed from `page.tsx`.
After refactoring, the authenticated player's name lives in `AuthContext.player.name`.

A) Remove `name` prop from Dashboard — Dashboard reads `player.name` via `useAuth()` hook
   internally. Clean, no prop drilling. Dashboard becomes self-sufficient.

B) Keep `name` prop on Dashboard — page.tsx passes `authContext.player.name` as `name`.
   Minimal change to Dashboard's interface. Requires page.tsx to know the name.

[Answer]:

---

### Question 4
After a quiz completes, `addCoins(10)` is called (from Dashboard's `handleQuizComplete`)
and fireworks are shown. With the API refactor, `addCoins()` will be async.

A) Optimistic — call API in background (fire-and-forget from Dashboard's perspective);
   update coin display immediately, show fireworks without waiting for API.
   Child sees instant feedback; occasional inconsistency if API fails is acceptable.

B) Await — wait for `POST /api/players/coins` to complete before showing fireworks.
   Coin balance is authoritative before animation. Adds ~300–500ms delay to fireworks.

[Answer]:
