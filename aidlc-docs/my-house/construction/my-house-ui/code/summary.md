# Code Summary — U2: my-house-ui

**Status**: Complete
**Last updated**: 2026-09-14

---

## Created

- `lib/hooks/use-house-items.ts` — `useHouseItems(room, locale)`, module-cached.
- `lib/hooks/use-rooms.ts` — `useRooms(locale)`, module-cached.
- `components/my-house/layout-math.ts` — pure position math (`clampPercent`,
  `computeDropPosition`, `computeRepositionPosition`), extracted from the components for direct
  unit-testability (BR-5).
- `components/my-house/room-nav.tsx`, `item-catalog.tsx`, `my-items-strip.tsx`,
  `bedroom-canvas.tsx`, `index.tsx` (the `MyHouse` orchestrator) — full `data-testid` coverage
  per `test-case-design.md`.
- `automation_tests/unit/layout-math.test.ts` — 8 layout-position-clamping unit tests.
- `automation_tests/e2e/my-house.spec.ts` — TC-E018 through TC-E027 (all 10 cases).

## Modified

- `contexts/coin-context.tsx` — added `ownedHouseItems`, `buyHouseItem()`, `hasHouseItem()`;
  migration logic untouched.
- `components/dashboard.tsx` — 4th "My House" card, `"house"` `ViewType` branch, grid updated
  to 4 columns.
- `data/translations.ts` — UI-chrome-only keys (room labels, "Coming soon", dashboard card
  text); no item-name keys (server-localized by U1).
- `automation_tests/unit/house-items.pbt.test.ts` — added PBT-E (placement bounds) and PBT-F
  (layout round-trip); U1's PBT-D/G untouched.
- `MANUAL-TEST-CHECKLIST.md` — appended TC-M006, TC-M007, TC-M008.

No U1 file (`lib/database.types.ts`, `lib/validation/api.ts`, `lib/services/house-items.ts`,
`lib/services/house-layout.ts`, any `app/api/**` route, the migration) was touched — verified
via diff.

## Verification

- `npx eslint` (all new/modified files): 0 errors, 5 warnings — all matching pre-existing
  patterns already present elsewhere in the codebase (`react-hooks/set-state-in-effect`,
  `react-hooks/immutability`), independently re-run and confirmed.
- `npx vitest run` (full suite): 225/225 passing, independently re-run and confirmed.
- `npx tsc --noEmit`: zero new errors (the same pre-existing errors already present in
  `data/stickers.ts`, `lib/services/canvas.ts`, `lib/services/player.ts`,
  `lib/services/house-layout.ts` — none newly introduced), independently re-run and confirmed.
- E2E suite not executed (no dev server/DB in this environment) — confirmed to compile and lint
  cleanly; run it against a staging deploy before merge, per TC-M007.
- A `reviewer` subagent pass returned PASS with no FAIL items (a few non-blocking WARN items,
  documented below).

## Deviations Flagged (per the process rule established after U1) — all resolved, no unapproved architecture change

1. **`BedroomCanvas`'s documented `onPlace` prop was dropped.** `frontend-components.md` listed
   `onPlace` on `BedroomCanvas`, but the component hierarchy is flat siblings — `MyItemsStrip`'s
   drop coordinates can never reach `BedroomCanvas` directly. Implemented as `MyHouse` handling
   `MyItemsStrip.onItemDropped` itself via the shared `canvasRef`, calling `handlePlaceItem`
   directly — `BedroomCanvas` never receives an `onPlace` prop at all. The design doc itself
   hedged on this exact point ("passed up some other way per the actual drag library's API").
2. **Emoji resolution**: `PlacedHouseItem` (U1's type) carries only `itemId`, not an emoji, and
   no doc gave `BedroomCanvas` a catalog prop. `MyHouse` joins `placedItems` against its already
   -fetched catalog to build a `PlacedItemView` (mirrors `creative-room.tsx`'s
   `PlacedSticker.emoji`) before passing it down.
3. **Test file location**: the layout-clamping unit test lives in `automation_tests/unit/`
   rather than co-located with `layout-math.ts`, because `vitest.config.ts`'s `include` glob
   only covers `automation_tests/unit/**`/`automation_tests/api/**` — a co-located file would
   silently never run.

None of these change any business rule, API contract, or architecture — they're implementation
gaps in the frontend-components.md's level of detail, resolved consistently with everything
else already built (and confirmed by the reviewer pass and this session's own review).
