# Functional Design Plan — U2: my-house-ui

**Status**: Awaiting user answers
**Last updated**: 2026-09-14

---

## Purpose

Detailed, technology-agnostic business logic for U2's UI: exact state ownership, interaction
sequences, and error-handling behavior for the My House screen. Most of this is already locked
by `requirements.md` (FR-3/FR-4) and the Application Design artifacts (component
responsibilities/props) — and, per the parallel build decision (Units Generation Q2=B), U2 is
designed against U1's Functional Design output (concrete workflows/business rules) even though
U1's code doesn't need to exist yet. This plan resolves the remaining genuine UI-behavior
decisions before generating `business-logic-model.md`, `business-rules.md`,
`domain-entities.md`, and `frontend-components.md`.

---

## Design Questions

Please fill in each `[Answer]:` tag and say "done".

---

### Question 1 — Total failure of `useRooms()`

Per Q2a=A (test-case-design.md), catalog/layout load failures fail silently to an
empty/default state — appropriate when "empty" is still a usable state (an empty catalog just
means nothing to buy yet). A **total** `useRooms()` failure is different: with zero rooms, there
is no room to select as active, and the whole My House screen has nothing to show.

A) **Silent-empty, consistent with Q2a=A** — `MyHouse` renders with no room tabs and no active
   room; the rest of the screen (catalog, canvas) shows its own empty state. Matches the
   existing convention exactly, accepts a degraded-but-non-crashing screen on this rare failure.

B) **Hardcoded emergency fallback** — if `useRooms()` fails, fall back to a small hardcoded
   4-room list (the same shape Application Design originally had before the DB-table decision)
   so the screen stays usable even if the API is down. *(Recommended — this is the one scenario
   where "silent empty" produces a screen with literally nothing actionable on it, which is a
   materially worse failure mode than an empty catalog; a tiny hardcoded fallback costs nothing
   and only ever activates when the network/API call itself has already failed)*

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 2 — Placed item referencing an item the player no longer appears to own

`saveLayout` rejects any request containing an unowned `itemId` (U1's BR-4), so this shouldn't
happen in normal operation. But `GET /api/players/house-layout` and
`GET /api/players/house-items` are two separate calls loaded by two different pieces of state
(`placedItems` in `MyHouse`, `ownedHouseItems` in `coin-context`) — if they're ever
momentarily inconsistent (e.g. one load succeeds and the other fails silently per Q2a=A), a
placed item's `itemId` could transiently not appear in `ownedHouseItems`.

A) **Render it anyway** — trust `placedItems` as loaded; don't cross-check against
   `ownedHouseItems` for rendering. Simplest, and the inconsistency (if it ever occurs) is
   transient — a later successful reload of `ownedHouseItems` self-corrects it.
   *(Recommended — avoids adding a defensive check for a scenario that's a transient loading
   race, not a real data-integrity violation, given BR-4 already prevents the real one)*

B) **Filter it out** — `MyHouse` only renders placed items whose `itemId` is also in
   `ownedHouseItems`; a mismatch silently hides the item from the canvas until state catches up.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 3 — Resize controls for placed items

`requirements.md` FR-3.4 explicitly marks resizing as optional: "not required by the source doc
— carried over from the reused component only if trivial, not a hard requirement." Creative
Room already has working shrink/grow controls (`handleResizeSticker`) that could be copied.

A) **Include resize controls** — copy Creative Room's shrink/grow buttons onto a selected
   placed item, since the mechanic already exists and adapting it is low-effort.

B) **Omit resize for V1** — a selected placed item shows only the remove control (per FR-3.4's
   framing as genuinely optional, and to keep V1's scope exactly at what the requirements
   describe as required — `domain-entities.md`'s `PlacedItem.scale` field still exists in the
   schema for future use, just not exposed in the V1 UI). *(Recommended — matches "not a hard
   requirement" most literally; can be added later without a schema change)*

C) Other (describe after [Answer]: tag)

[Answer]:B

---

## Categories Evaluated But Not Turned Into Questions (with justification)

- **Drag/drop mechanics** (drop-position calculation, canvas-bounds check, debounce timing):
  Direct precedent match with `creative-room.tsx` — percentage-of-canvas-rect coordinates,
  clamp `[5,95]`, 300ms debounce, last-write-wins on rapid successive placements. No deviation
  proposed, so no question.
- **Optimistic UI on purchase**: Already specified in `component-methods.md`
  (`buyHouseItem` mirrors `buySticker` — await response, then update state). No ambiguity.
- **`useHouseItems`/existing catalog load failure**: Already resolved by Q2a=A; unchanged by
  this Functional Design pass.
- **Business Scenarios** (fully-owned catalog, zero-balance-after-purchase, navigate-away
  mid-debounce): Each either has an obvious, unambiguous UI treatment (buy button shows
  "owned") or matches an already-accepted existing risk (Creative Room has the identical
  navigate-away-mid-debounce exposure today, unaddressed) — no new question needed.
- **Integration Points**: The 5 U1 routes, per `services.md`/`unit-of-work.md` — already fully
  specified; U2 codes against them (initially via stub types per Units Generation Q2=B).
