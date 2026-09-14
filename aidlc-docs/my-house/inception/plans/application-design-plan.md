# Application Design Plan — my-house

**Status**: Answered — design artifacts generated, awaiting user approval
**Last updated**: 2026-09-13

---

## Purpose

Identify the components, their high-level methods, the service layer, and component
dependencies for this initiative. Most behavioral decisions are already locked in
`requirements.md` (table/column shapes, purchase semantics, drag mechanics); this stage resolves
the remaining **structural** design choices, then generates the design artifacts.

---

## Design Questions

Please fill in each `[Answer]:` tag and say "done".

---

### Question 1 — Component file structure

The existing analog features (`sticker-shop.tsx`, `creative-room.tsx`) are each a single,
fairly large file. My House combines a catalog view (like Shop) AND a canvas view (like
Creative Room) into one screen.

A) **One file, `components/my-house.tsx`** — room nav, item catalog, My Items strip, and the
   Bedroom canvas all in one component, matching the existing single-large-file convention.
   *(Recommended — consistent with the codebase, simplest for a V1 scoped to one room)*

B) **A `components/my-house/` folder** with `index.tsx` (orchestrator) plus sub-components:
   `room-nav.tsx`, `item-catalog.tsx`, `my-items-strip.tsx`, `bedroom-canvas.tsx` — more files,
   more reusable structure ahead of future rooms.

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Question 2 — Service layer structure

A) **Two services**, mirroring the exact split of the analog feature: `lib/services/house-items.ts`
   (catalog fetch + purchase, mirrors `stickers.ts`) and `lib/services/house-layout.ts`
   (get/save layout, mirrors `canvas.ts`). *(Recommended — matches the pattern this feature is
   explicitly modeled on)*

B) **One combined `lib/services/house.ts`** with all catalog/ownership/layout functions together.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 3 — API route paths

A) **Flat, mirroring existing naming exactly**: `GET /api/house-items?room=` (catalog),
   `GET /api/players/house-items` + `POST /api/players/house-items` (ownership + purchase),
   `GET /api/players/house-layout?room=` + `PUT /api/players/house-layout` (layout).
   *(Recommended — identical convention to `/api/stickers`, `/api/players/stickers`,
   `/api/players/canvas`)*

B) **Nested under `/api/house/*`**: `/api/house/items`, `/api/house/players/items`,
   `/api/house/players/layout`.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 4 — Client data-fetching pattern for the catalog

A) **Inline `useEffect` fetch directly inside `my-house.tsx`**, matching `sticker-shop.tsx`'s
   style exactly — no separate hook, no cache (catalog is tiny and rarely changes within a
   session). *(Recommended — matches the closer analog; the `useSubjectQuestions` hook pattern
   from a different initiative was built for a different reason — per-locale caching — that
   doesn't apply here)*

B) **A dedicated `useHouseItems()` hook** with module-level caching, matching the newer
   `useSubjectQuestions` pattern.

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Question 5 — Room-navigation implementation for V1

A) **Hardcode the 4 room tabs directly in `my-house.tsx`** (Bedroom active + 3 locked cards) —
   simplest, matches "V1 is Bedroom-only" scope; a real `<RoomNav>` abstraction can be extracted
   later when a second room actually ships. *(Recommended — avoids designing an abstraction
   before there's a second real use case)*

B) **Extract a small reusable `<RoomNav rooms={...} activeRoom={...} />` component now**,
   anticipating future rooms.

C) Other (describe after [Answer]: tag)

[Answer]:B
