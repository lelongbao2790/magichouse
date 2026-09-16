# Test Case Design — my-house

**Status**: Approved (user, 2026-09-11)
**Last updated**: 2026-09-11

Numbering continues from the prior initiative: existing E2E cases end at TC-E017, existing API
cases end at TC-A030, existing manual cases end at TC-M005. New cases start at TC-E018 / TC-A031 /
TC-M006.

### Scope decisions carried from QA answers
- **All 5 primary acceptance criteria get an E2E test** (Q1=F).
- **Catalog/layout load failures fail silently** to an empty/default state, no visible error UI
  (Q2a=A) — matches the older Creative Room precedent, not the newer Sticker Shop retry pattern.
- **First-time/empty state is automated** (Q2b=A).
- **All three manual-only areas are on the checklist**: content review, mobile drag feel, live
  migration verification (Q3=D).
- **E2E stays Chromium only** (Q4=A).
- **E2E test account is topped up to a known balance** before purchase-related tests run (Q5=A).
- **All regression flows are explicitly re-verified**: Shop/Creative Room coin-balance sharing,
  Learning Zone coin rewards spendable in My House, and 4-way dashboard navigation (Q6=D).

---

## Coverage Summary

| Type | Count | Source |
|---|---|---|
| Automated E2E (TC-E) | 10 | Playwright (Chromium only) |
| Automated API / unit-contract (TC-A) | 7 | Vitest (no live server) |
| Property-based (PBT) | 4 property groups | fast-check (blocking) |
| Manual Verification (TC-M) | 3 | Developer checklist |
| **Total explicit cases** | **20** + PBT | |

---

## Automated E2E Test Cases (TC-E)

Generated as a new Playwright spec `automation_tests/e2e/my-house.spec.ts`.

**Common preconditions**: logged in via the existing E2E account
(`E2E_USERNAME`/`E2E_PASSWORD`); on the Dashboard. Helper `topUpCoins(page, amount)` calls the
existing `/api/players/coins` endpoint to guarantee a sufficient balance before purchase tests
(Q5=A).

---

### TC-E018 | Opening My House shows the Bedroom by default with the coin balance visible

**Preconditions**: Logged in; on Dashboard.
**Browser scope**: Chromium.
**Steps**:
1. Click `nav-house`.
2. Wait for `my-house` to be visible.
**Expected result**: The Bedroom room is shown as active; `coin-display` shows the current
balance; the item catalog is visible.
**Assertions**: `my-house` visible; `room-bedroom` has an active/selected state; `coin-display`
visible with a numeric value; `house-items-grid` visible.
**data-testid(s) needed**: `nav-house` (new), `my-house` (new), `room-bedroom` (new),
`house-items-grid` (new).

---

### TC-E019 | Kitchen, Living Room, and Garden show as locked and are not interactive

**Preconditions**: Logged in; My House open.
**Browser scope**: Chromium.
**Steps**:
1. Locate `room-kitchen`, `room-living-room`, `room-garden`.
2. Attempt to click `room-kitchen`.
**Expected result**: All three show a locked visual state (e.g. lock icon / "Coming soon");
clicking one does not change the active room away from Bedroom.
**Assertions**: `room-kitchen`, `room-living-room`, `room-garden` all show a `data-locked="true"`
(or equivalent disabled) state; after the click, `room-bedroom` is still the active room.
**data-testid(s) needed**: `room-kitchen`, `room-living-room`, `room-garden` (new).

---

### TC-E020 | Buying an affordable item deducts coins and moves it into My Items

**Preconditions**: Logged in; My House open; account topped up to ≥150 coins via `topUpCoins`.
**Browser scope**: Chromium.
**Steps**:
1. Read the starting balance from `coin-display`.
2. Click `buy-house-lamp` (Lamp, 40 coins).
3. Wait for the item to appear in `my-items-house`.
**Expected result**: Balance decreases by exactly 40; the Lamp shows as owned in the catalog and
appears in the My Items strip.
**Assertions**: `coin-display` numeric value === starting − 40; `house-item-lamp` shows an owned
badge; `my-items-house` contains `my-item-lamp`.
**data-testid(s) needed**: `buy-house-{itemId}` (new), `house-item-{itemId}` (new),
`my-items-house` (new), `my-item-{itemId}` (new).

---

### TC-E021 | Purchase is blocked when the player cannot afford the item

**Preconditions**: A freshly registered test player (0 starting coins, per the `players` table
default) logs in and opens My House.
**Browser scope**: Chromium.
**Steps**:
1. Read the starting balance (0) from `coin-display`.
2. Click `buy-house-lamp` (40 coins).
**Expected result**: The buy control is disabled/shows a "need more coins" state; no purchase
occurs.
**Assertions**: `coin-display` unchanged (still 0); `house-item-lamp` does not show an owned
badge; `my-items-house` remains empty.
**data-testid(s) needed**: none new beyond TC-E020's.

---

### TC-E022 | Dragging an owned item onto the Bedroom places it, and it can be moved

**Preconditions**: Logged in; My House open; player owns at least one item (reuse TC-E020's
purchased Lamp) not yet placed.
**Browser scope**: Chromium.
**Steps**:
1. Drag `my-item-lamp` from the My Items strip onto `bedroom-canvas`.
2. Wait for `placed-house-lamp` to appear.
3. Drag `placed-house-lamp` to a different position within the canvas.
**Expected result**: The Lamp appears placed inside the Bedroom at the drop position, then moves
to the new position.
**Assertions**: `placed-house-lamp` visible inside `bedroom-canvas` after step 1; its computed
`left`/`top` style changes between step 2 and step 3.
**data-testid(s) needed**: `bedroom-canvas` (new), `placed-house-{itemId}` (new).

---

### TC-E023 | Removing a placed item returns it to My Items, still owned

**Preconditions**: Continuation of TC-E022 — the Lamp is placed in the Bedroom.
**Browser scope**: Chromium.
**Steps**:
1. Click `placed-house-lamp` to select it.
2. Click `remove-house-lamp`.
**Expected result**: The Lamp disappears from the Bedroom canvas and reappears in My Items; it
remains owned (not deleted from ownership).
**Assertions**: `placed-house-lamp` no longer in the DOM; `my-item-lamp` visible again in
`my-items-house`.
**data-testid(s) needed**: `remove-house-{itemId}` (new).

---

### TC-E024 | Reloading My House restores previously bought items and the saved layout

**Preconditions**: Continuation — Lamp purchased; a different owned item (e.g. Teddy Bear,
purchased via a setup step) placed in the Bedroom at a known position.
**Browser scope**: Chromium.
**Steps**:
1. Place the Teddy Bear at a known position; wait for the debounced autosave (300ms + margin).
2. Reload the page; navigate back into My House.
**Expected result**: Both the Lamp (owned, unplaced) and the Teddy Bear (owned, placed at the
same position) are present exactly as left.
**Assertions**: `my-item-lamp` present in `my-items-house`; `placed-house-teddy` present in
`bedroom-canvas` at the same `left`/`top` (within a small tolerance) as before reload.
**data-testid(s) needed**: none new beyond above.

---

### TC-E025 | First-time player sees an empty Bedroom and empty My Items

**Preconditions**: A freshly registered test player with 0 owned house items.
**Browser scope**: Chromium.
**Steps**:
1. Open My House.
**Expected result**: The Bedroom canvas is empty; My Items shows an empty-state message (no
visible error — Q2a=A silent-fallback behavior applies equally here since there's nothing to load).
**Assertions**: `bedroom-canvas` contains no `placed-house-*` elements; `my-items-house` shows
`no-house-items-message`.
**data-testid(s) needed**: `no-house-items-message` (new).

---

### TC-E026 | Coin balance stays consistent across Shop, Creative Room, and My House (regression)

**Preconditions**: Logged in; account topped up.
**Browser scope**: Chromium.
**Steps**:
1. From Dashboard, open Sticker Shop; read `coin-display`.
2. Go back to Dashboard, open My House; read `coin-display`.
3. Buy a house item; go back, open Creative Room; read `coin-display`.
**Expected result**: The balance shown is identical across all three screens at each point, and
reflects the My House purchase once made.
**Assertions**: `coin-display` values match across screens (step 1 === step 2); step 3's Creative
Room balance === step 2's value − the purchased item's price.
**data-testid(s) needed**: none new.

---

### TC-E027 | Dashboard navigation to and from My House works alongside existing sections (regression)

**Preconditions**: Logged in; on Dashboard.
**Browser scope**: Chromium.
**Steps**:
1. From Dashboard, click `nav-house`; click back to Dashboard.
2. Click `nav-shop`, back; click `nav-creative`, back; click `nav-learning`, back.
**Expected result**: Every section opens and returns to the Dashboard's 4-card view (`main-nav`
showing all 4 cards) without errors.
**Assertions**: `main-nav` visible with `nav-shop`, `nav-creative`, `nav-learning`, `nav-house`
all present after each round-trip.
**data-testid(s) needed**: none new — `nav-shop`/`nav-creative`/`nav-learning`/`main-nav` already exist.

---

## Automated API / Unit-Contract Test Cases (TC-A)

Generated in `automation_tests/api/house-items.api.test.ts`. Import route handlers/services/Zod
schemas directly — no live server (matches the project's existing API test convention).

### TC-A031 | GET house-items — unauthenticated → 401

Mocked `auth.getUser()` returns no user. Expect `apiError('Not authenticated', 401)` shape.

### TC-A032 | GET house-items — authenticated, valid room → documented shape

Authenticated request for `room=bedroom`. Expect `{ data: [{ id, name, emoji, price, room }] }`
for the 6 seeded items, `name` localized per the caller's `locale` param.

### TC-A033 | GET players/house-items — returns owned item IDs

Mocked service returns a known ownership set. Expect `{ data: string[] }` matching it.

### TC-A034 | POST players/house-items — insufficient funds is rejected server-side

Mocked player balance (e.g. 10 coins) attempting to buy a 40-coin item. Expect a documented
error response; assert (via a mocked Supabase client) that the `UPDATE ... WHERE coins >= price`
guard is what rejects it, no ownership row is inserted, and the returned balance is unchanged.

### TC-A035 | POST players/house-items — success deducts coins and is idempotent

First purchase: balance decreases by the item price, ownership recorded, response returns the
new balance. Second purchase of the same item: no additional coin deduction, no duplicate
ownership row, request still succeeds (idempotent, matches `ON CONFLICT ... DO NOTHING`).

### TC-A036 | GET/PUT players/house-layout — round-trip persists layout shape; invalid room → 400

`PUT` a layout for `room=bedroom` with 2 placed items; `GET` it back and expect an identical
array. A `PUT`/`GET` with an invalid `room` value (not one of the 4 enum values) returns `400`.

### TC-A037 | Purchase and layout payload validation

Malformed inputs are rejected `400` before reaching the service layer: purchasing a non-existent
`itemId`; a layout item missing `x`/`y`; an `x`/`y` outside the valid percentage range.

---

## Unit / Helper Tests (Vitest — not TC-numbered, listed for Code Generation)

| Target | Cases |
|---|---|
| `purchaseHouseItem(supabase, userId, itemId, price)` | success deducts exact price and returns new balance; insufficient funds throws/returns a typed error without mutating balance; repeat purchase of an owned item is a no-op success (idempotent) |
| Layout position clamping (shared with/adapted from the Creative Room drag math) | any input delta keeps resulting `x`/`y` within `[5, 95]`; placing at the exact canvas edge clamps correctly |
| Localized item name resolution | `getCatalog(supabase, room, locale)` selects the correct `name_vi`/`name_en` column into a single `name` field per the given locale (server-side, matching `subject-content-db`'s `getSubjectContent` precedent — **not** a client-side `nameMap`/`t()` lookup); falls back sensibly for an unrecognized locale |
| `house_layout` DTO mapper | `layoutData` JSONB array ↔ typed `PlacedHouseItem[]` round-trips (id, itemId, x, y, scale, rotation) |

---

## Property-Based Test Cases (PBT — fast-check, BLOCKING)

Generated in `automation_tests/unit/house-items.pbt.test.ts`. Seed logged in CI (PBT-08).

| ID | Category | Property |
|---|---|---|
| PBT-D | Invariant (PBT-03) | For any generated starting balance ≥ 0 and any sequence of purchase attempts (each with a generated item price > 0): the player's coin balance is never negative after any attempt, and each attempt either fully succeeds (balance decreases by exactly the price, ownership recorded) or fully fails (balance and ownership unchanged) — never a partial state. |
| PBT-E | Invariant (PBT-03) | For any generated starting placed-item position and any generated drag delta, the resulting `x`/`y` always lands within `[5, 95]` (matches the existing Creative Room clamping behavior this feature reuses). |
| PBT-F | Round-trip (PBT-02) | For any generated `layoutData` array (0–20 placed items with valid id/itemId/x/y/scale/rotation), saving then loading via the layout service preserves the array exactly (`f_inv(f(x)) = x`). |
| PBT-G | Idempotence (PBT-04) | For any generated item and any number of repeated purchase calls (≥1) once the first succeeds: the observable ownership state (owned: true, balance after first success) is identical after 1 call vs. N calls — `buy(buy(x)) = buy(x)`. |

Generators: a domain `houseItemArb` (id, room, price > 0, name pair) and a `placedItemArb`
(id, itemId, x/y in a wide including-out-of-range test domain, scale, rotation) — defined as
reusable utilities alongside the existing `_arbitraries.ts` (PBT-07). Example-based tests in the
unit files pin the concrete seeded catalog (Bed/Desk/Lamp/Teddy Bear/Plant/Rug) as regression
cases (PBT-10).

---

## Manual Verification Test Cases (TC-M)

Written to `MANUAL-TEST-CHECKLIST.md` at the repo root.

---

### TC-M006 | Content review of the 6 seeded Bedroom items

**When to verify**: Before merging the schema/seed migration PR.
**Preconditions**: The migration SQL (or a rendered list) of the 6 Bedroom items.
**Steps**:
1. Read each item's name (VI + EN), emoji, and price.
2. Confirm the emoji is a reasonable visual match for the item (e.g. 🛏 for Bed).
3. Confirm prices feel fair relative to typical coin-earn rates (5–30 coins/quiz).
4. Confirm Vietnamese names are correctly spelled with tone marks.
**Expected result**: All 6 items look appealing, correctly named in both languages, and
reasonably priced.
**What to specifically check**: any emoji that doesn't clearly read as its item name; any price
that would take an unreasonable number of quizzes to afford.

---

### TC-M007 | Drag-and-drop feel on a real mobile screen size

**When to verify**: After the UI unit (U2) is deployed to a preview/staging URL.
**Preconditions**: A phone or a browser resized to a narrow viewport (~375px wide).
**Steps**:
1. Open My House on the narrow viewport.
2. Drag an owned item from My Items onto the Bedroom.
3. Try moving and removing it.
**Expected result**: Dragging feels responsive (no visible lag/jump), items don't overlap the
catalog panel awkwardly, and touch targets (buy button, remove button) are big enough to tap
reliably.
**What to specifically check**: any item that's hard to grab with a finger; any layout where the
Bedroom canvas is cut off or too small to use.

---

### TC-M008 | Migration applied correctly on the live Supabase project

**When to verify**: Immediately after running `supabase db push`, before the frontend deploy is
marked done.
**Preconditions**: Supabase CLI linked to the project.
**Steps**:
1. Run `supabase db push`.
2. In the Supabase dashboard SQL editor: `select count(*) from house_items;`
3. `select * from pg_policies where tablename in ('house_items','player_house_items','house_layout');`
**Expected result**: `house_items` has exactly 6 rows, all `room = 'bedroom'`; RLS policies exist
on all 3 new tables matching the `stickers`/`player_stickers`/`creative_canvas` pattern.
**What to specifically check**: row count is exactly 6, not 0 or duplicated; RLS is actually
enabled (not just policies defined but RLS toggle off).

---

## Regression Guard

| Flow | Type | How to verify |
|---|---|---|
| Sticker Shop + Creative Room share the coin balance with My House | Automated | TC-E026 |
| Learning Zone coin rewards are spendable in My House | Automated (incidental via shared balance) + Manual | TC-E026 covers the shared-balance mechanism; full quiz-earn-then-spend flow is exercised manually as part of TC-M007's session |
| Dashboard navigation across all 4 sections | Automated | TC-E027 |
| Existing Sticker Shop / Creative Room / Learning Zone E2E specs | Automated | No changes to those specs expected; existing suite re-run as part of CI |

---

## data-testid Attribute Requirements

Code Generation MUST add these to the new/modified components.

| Attribute | Element | Component | Used by |
|---|---|---|---|
| `nav-house` | My House dashboard card | `dashboard.tsx` | TC-E018, TC-E027 |
| `my-house` | Root container of the My House screen | `my-house.tsx` (new) | TC-E018 |
| `room-bedroom` | Bedroom room-nav item (active) | `my-house.tsx` | TC-E018, TC-E019 |
| `room-kitchen`, `room-living-room`, `room-garden` | Locked room-nav items | `my-house.tsx` | TC-E019 |
| `house-items-grid` | Catalog grid container | `my-house.tsx` | TC-E018 |
| `house-item-{itemId}` | One catalog item card | `my-house.tsx` | TC-E020, TC-E021 |
| `buy-house-{itemId}` | Buy button on a catalog item | `my-house.tsx` | TC-E020, TC-E021 |
| `my-items-house` | My Items strip container | `my-house.tsx` | TC-E020, TC-E024, TC-E025 |
| `my-item-{itemId}` | One owned, unplaced item in the strip | `my-house.tsx` | TC-E020, TC-E022–E024 |
| `bedroom-canvas` | Drop-target Bedroom canvas | `my-house.tsx` | TC-E022, TC-E024, TC-E025 |
| `placed-house-{itemId}` | A placed item inside the Bedroom | `my-house.tsx` | TC-E022–E024 |
| `remove-house-{itemId}` | Remove control on a selected placed item | `my-house.tsx` | TC-E023 |
| `no-house-items-message` | Empty-state message in My Items | `my-house.tsx` | TC-E025 |

Existing testids reused (no change): `coin-display`, `main-nav`, `nav-shop`, `nav-creative`,
`nav-learning`, `back-button`.
