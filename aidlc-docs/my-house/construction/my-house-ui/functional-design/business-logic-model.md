# Business Logic Model — U2: my-house-ui

**Status**: Draft (Functional Design)
**Last updated**: 2026-09-14

Technology-agnostic workflows for the My House screen. Cross-references `business-rules.md`
(BR-#) and U1's `business-rules.md` (U1-BR-#) where a rule spans both units.

---

## Workflow 1 — Open My House

**Trigger**: Player selects the "My House" dashboard card.
**Actors**: Player

1. Mount `MyHouse`; begin loading room list (`useRooms`), catalog for the default active room
   (`useHouseItems`), and the Bedroom layout (`GET /api/players/house-layout?room=bedroom`) —
   in parallel, no sequencing dependency between the three.
2. `ownedHouseItems`/`coins` are already available from `coin-context` (loaded once at app
   entry, not re-fetched per screen).
3. `activeRoom` defaults to `bedroom` (the only unlocked room in V1).
4. If room-list load fails: render with no room tabs (BR-1). If catalog/layout load fails:
   render with an empty catalog/canvas respectively (Q2a=A, unchanged).
5. Render: room tabs, coin balance, catalog for `activeRoom`, the Bedroom canvas with any
   loaded `placedItems`, and the "My Items" strip showing `UnplacedOwnedItem`s.

## Workflow 2 — Buy an Item

**Trigger**: Player taps "Buy" on a catalog item.
**Actors**: Player

1. Guard: control is only clickable when the item is in the **Buyable** state (BR-4) — an
   already-owned or currently-unaffordable item's control isn't wired to this action at all.
2. Set that item's per-item "buying" flag (BR-4's double-submit guard).
3. Call `coin-context.buyHouseItem(item)`, which `POST`s to `/api/players/house-items`.
4. On success: update `coins` and append the item's id to `ownedHouseItems` (optimistic-after-
   response, matching `buySticker`'s pattern — not optimistic-before-response). The item now
   appears in "My Items" (as an `UnplacedOwnedItem`) on the next render, since it's owned but
   not yet in `placedItems`.
5. On failure: clear the "buying" flag, leave `coins`/`ownedHouseItems` unchanged; no error
   message (matches the existing `buySticker` failure handling — silently returns `false`).
6. Clear the "buying" flag either way.

## Workflow 3 — Place an Item

**Trigger**: Player drags an item from "My Items" onto the Bedroom canvas.
**Actors**: Player

1. Drag starts from `MyItemsStrip`; a `DragSession` begins.
2. On drag end: check whether the release point falls within `BedroomCanvas`'s bounding rect
   (BR-5). If not, the drag is a no-op — the item remains in "My Items."
3. If it does: compute `x`/`y` as a percentage of the canvas rect, clamp to `[5, 95]` (BR-5),
   and append a new `PlacedItem` (`{ id: newId, itemId, x, y, scale: 1, rotation: 0 }`) to
   `placedItems`.
4. The item disappears from "My Items" (it's no longer an `UnplacedOwnedItem`) and appears on
   the canvas.
5. The mutation to `placedItems` restarts the debounce timer (BR-7) for the eventual
   `PUT /api/players/house-layout` save.

## Workflow 4 — Reposition a Placed Item

**Trigger**: Player drags an already-placed item within the canvas.
**Actors**: Player

1. On drag end, compute the new `x`/`y` from the drag offset relative to the canvas rect,
   clamp to `[5, 95]` (BR-5), and update that `PlacedItem`'s coordinates in `placedItems`.
2. Restarts the debounce timer (BR-7).

## Workflow 5 — Select / Deselect a Placed Item

**Trigger**: Player taps a placed item (select) or taps the canvas background (deselect).
**Actors**: Player

1. Tapping a placed item sets `SelectedPlacement` to its id, showing its remove control
   (BR-3 — no resize control).
2. Tapping empty canvas space, or tapping the already-selected item again, clears
   `SelectedPlacement`.

## Workflow 6 — Remove a Placed Item

**Trigger**: Player taps the remove control on a selected placed item.
**Actors**: Player

1. Remove that entry from `placedItems`. The item remains in `ownedHouseItems` — it becomes an
   `UnplacedOwnedItem` again and reappears in "My Items."
2. Clear `SelectedPlacement` if it referenced the removed item.
3. Restarts the debounce timer (BR-7).

## Workflow 7 — Reload Persistence Check

**Trigger**: Player leaves and reopens My House (or reloads the page).
**Actors**: Player

1. Re-run Workflow 1 in full. Because the layout was saved by Workflow 3/4/6's debounced save
   (assuming ≥300ms elapsed since the last mutation before navigating away), the reloaded
   `placedItems` matches what was last displayed (AC-6).

---

## Cross-Cutting Notes

- **Workflows 3, 4, and 6 all funnel through the same debounce mechanism (BR-7)** — there is
  exactly one save path, not a separate one per mutation type, matching `creative-room.tsx`'s
  single `useEffect` keyed on `placedStickers`.
- **No workflow above calls a U1 route more than once per user action** — each of Buy, Place,
  Reposition, Remove results in at most one eventual network call (purchase is immediate;
  placement/reposition/removal are debounced together).
