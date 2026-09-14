# Requirements Clarification Questions — my-house

Please answer each question by filling in the letter after the `[Answer]:` tag.
If none of the options fit, choose the last option (**Other**) and describe your choice.
Let me know when you're done and I'll build the requirements document.

Context recap (from Reverse Engineering — see `my-house-findings.md`):
- The existing **Sticker Shop -> Creative Room** loop is the closest analog: a DB catalog table
  (`stickers`), an ownership table (`player_stickers`), and a single-row-per-player JSONB layout
  table (`creative_canvas`), each with its own API route and RLS policy.
- The dashboard (`components/dashboard.tsx`) is **card-based**, not a persistent tab bar — Shop,
  Creative Room, and Learning Zone are cards that swap a full-screen view via local state.
- Drag-and-drop already exists in `creative-room.tsx` via Framer Motion, positioning items as a
  percentage of the canvas bounding box.
- Sticker items today are **emoji-only** (no real image assets); `data/stickers.ts` is a stale,
  unused client-side catalog — the live catalog is DB-backed via `/api/stickers`.

---

## Question 1 — How should "My House" appear in navigation?

A) **Add it as a 4th dashboard card**, exactly like Shop/Creative Room/Learning Zone today (same pattern, no new nav paradigm) *(Recommended — matches existing UI)*

B) **Build an actual persistent tab bar** across the top of the app (bigger UI change, affects every screen)

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 2 — Visual style for house items (FR-3 asks for an "Image" per item)

No real furniture image assets exist in the repo, and the existing Sticker Shop uses emoji only.

A) **Emoji only**, same as the Sticker Shop (🛏 🪑 💡 🧸 🪴, etc.) — fastest, zero new asset work *(Recommended for V1)*

B) **Simple flat-color/SVG icon per item** that I'll need to source or you'll generate as inline SVG

C) **Real illustrated image files** — I will provide image files for you to add under `public/`

D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 3 — The V1 Bedroom item catalog

The requirement doc's example table is: Bed 100, Desk 70, Lamp 40, Teddy Bear 30, Plant 50, Rug 60 (6 items).

A) **Use that exact list and those exact prices** as the final V1 catalog

B) **Use it as a starting point** — you (AI) may adjust names/prices/add 1-2 more items to round out the room, I'll review in the requirements doc

C) Other (please describe your own item list/prices after [Answer]: tag below)

[Answer]:A

---

## Question 4 — Database design: Bedroom-only now, or multi-room-ready schema?

Other rooms (Kitchen/Living Room/Garden) are locked/future in V1 per the requirement doc.

A) **Design the schema multi-room-ready now** — `house_items` and the layout table carry a `room` column (`bedroom`, `kitchen`, ...) even though only `bedroom` has real data/items today; adding a room later is just new rows, no migration *(Recommended)*

B) **Bedroom-only schema for V1** — no `room` column; a future room means a schema migration later

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 5 — Managing the house item catalog after V1

The requirement doc doesn't mention admin tooling for house items (unlike the `subject-content-db` initiative, which added admin CRUD routes for quiz content).

A) **No admin surface** — the catalog is fixed seed data in a migration file, edited via new SQL when needed (matches how `stickers` works today) *(Recommended for V1 scope)*

B) **Add an admin CRUD API** (`/api/admin/house-items`) gated the same way as `subject-content-db`'s admin routes (env-based `ADMIN_EMAILS` allowlist), no UI

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 6 — Client-side state management for house ownership + coins

A) **Extend the existing `coin-context.tsx`** with `ownedHouseItems` / `buyHouseItem()`, alongside the existing `ownedStickers` / `buySticker()` *(Recommended — coins and all "things bought with coins" already live together)*

B) **New dedicated `house-context.tsx`** mirroring `coin-context.tsx`'s pattern but calling `useCoins()` for the actual balance/spend

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 7 — Localized item names (EN/VI)

The app has an EN/VI language switcher (`language-context.tsx`, `t()` helper). Sticker names today go through a `nameMap` -> translation-key lookup in the component.

A) **Yes — localize house item names** the same way (VI + EN strings, resolved via `t()`) *(Recommended — matches existing UX)*

B) **No — one language only** for item names (please say which, after the tag)

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 8 — Locked/future rooms UI (Kitchen, Living Room, Garden)

A) **Simple locked card** — grayed out, a lock icon, "Coming soon" label, not clickable (or a toast on click) *(Recommended — matches V1 scope, minimal work)*

B) **Locked but with a peek** — clickable, opens a small "coming soon" preview screen with placeholder art/description

C) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 9 — Which automated tests should we write for this feature?

We found these test folders in your project:
- `automation_tests/unit/` → unit tests (individual functions) — ✅ already has tests
- `automation_tests/api/` → API tests (call your route's validation/logic directly, no server) — ✅ already has tests
- `automation_tests/e2e/` → E2E tests (real browser clicking through the app) — ✅ already has tests

Which tests should we write for this feature?

A) **Unit tests only** — purchase/placement logic, layout persistence shape

B) **Unit + API tests** — also test the new house-items/purchase/layout API routes (auth, insufficient-funds, ownership idempotency) *(Recommended)*

C) **Unit + API + E2E tests** — also a browser test that buys an item, drags it into the Bedroom, reloads, and confirms it's still placed

D) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Question 10 — Security Extensions

Should security extension rules be enforced for this project? (The last two initiatives both chose No.)

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 11 — Resiliency Extensions

Should the resiliency baseline (AWS Well-Architected Reliability-pillar design-time best practices) be applied to this project? (The last two initiatives both chose No.)

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more)

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 12 — Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project? (`subject-content-db` chose "Yes — full/blocking"; `grade2-subjects-coin-rewards` chose "Partial".)

A) Yes — enforce all PBT rules as blocking constraints (recommended given purchase/placement logic has clear invariants: coins never go negative, item positions stay in bounds, etc.)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 13 — Anything else

Any other constraints, preferences, or content guidance (specific furniture ideas, art style, deadlines, things to avoid)?

[Answer]:No
