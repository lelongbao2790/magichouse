# Requirements — my-house

**Status**: Awaiting user approval
**Last updated**: 2026-09-11

---

## 1. Intent Analysis

| Field | Value |
|---|---|
| **User request** | Implement the "My House" feature from `features-requirement/magic_house_feature_requirements/01-my-magic-house.md` (and its condensed duplicate `01-v1-my-house.md`): a new section where children spend their existing coin balance to buy furniture and decorate a Bedroom. |
| **Request type** | New Feature |
| **Scope estimate** | Multiple components — new DB tables + migration, new service layer, new API routes, new React components, extended `coin-context.tsx`, new translations, tests |
| **Complexity estimate** | Moderate — closely mirrors an existing, working pattern (Sticker Shop → Creative Room) rather than inventing a new one |
| **Project type** | Brownfield (Next.js 16 + Supabase monolith, deployed on Vercel) |

---

## 2. Background (from Reverse Engineering)

- The existing **Sticker Shop → Creative Room** loop is the direct analog: `stickers` (catalog) +
  `player_stickers` (ownership) + `creative_canvas` (single-row-per-player JSONB placed-items
  array), each with RLS policies (`auth.uid() = player_id` / catalog readable to any authenticated
  user) and its own API route.
- `lib/services/stickers.ts::purchaseSticker()` enforces affordability at the SQL level
  (`UPDATE ... WHERE id=$1 AND coins >= $2`) then does an idempotent `ON CONFLICT ... DO NOTHING`
  ownership insert — this is the pattern to reuse for house-item purchases.
- `components/creative-room.tsx` already implements percentage-based drag-and-drop placement via
  Framer Motion (`drag`, `onDragEnd` computing position relative to the canvas bounding rect,
  clamped 5–95%) with a 300ms-debounced autosave to the layout table.
- `components/dashboard.tsx` is **card-based** (`mainSections` array + local `ViewType` state),
  not a persistent tab bar, despite the source doc's "main navigation tab" language.
- No real furniture image assets exist; the existing Sticker Shop is emoji-only.
- Test infrastructure: `automation_tests/{unit,api,e2e}/` all have real tests today (not
  placeholders).

---

## 3. Decisions from Clarification

| Ref | Decision |
|---|---|
| Q1=A | My House is added as a **4th dashboard card**, exactly like Shop/Creative Room/Learning Zone — same `ViewType` switch pattern, no new nav paradigm. |
| Q2=A | House items are **emoji-only** for V1 — no new image assets. |
| Q3=A | The V1 Bedroom catalog is exactly: **Bed 100, Desk 70, Lamp 40, Teddy Bear 30, Plant 50, Rug 60** (6 items). |
| Q4=A | Schema is **multi-room-ready now** — the catalog and layout tables carry a `room` column (`bedroom`, `kitchen`, `living_room`, `garden`), even though only `bedroom` has real items/data in V1. |
| Q5=A | **No admin surface** for house items in V1 — the catalog is fixed seed data in a migration, edited via new SQL when needed (matches `stickers` today). |
| Q6=A | House ownership + purchase state is added to the **existing `coin-context.tsx`** (`ownedHouseItems`, `buyHouseItem()`), alongside `ownedStickers` / `buySticker()`. |
| Q7=A | House item names are **localized EN/VI** via `t()`, matching the sticker `nameMap` pattern. |
| Q8=A | Locked rooms (Kitchen/Living Room/Garden) show as a **simple grayed-out card** with a lock icon and "Coming soon" label — not clickable. |
| Q9=C | Tests: **Unit + API + E2E**. |
| Q10=A | Security Baseline extension: **enabled, full/blocking**. |
| Q11=A | Resiliency Baseline extension: **enabled** (directional best practices). |
| Q12=A | Property-Based Testing extension: **enabled, full/blocking**. |
| Q13 | No additional constraints given. |

### Resiliency Baseline mandatory decisions (RESILIENCY-02/03/04/08/15)

| Ref | Decision |
|---|---|
| R1=A | RTO/RPO: **Hours — Backup & Restore**, relying on Supabase's managed-Postgres backups. No custom DR infrastructure. |
| R2=A | Change management: **use the existing (informal) process** — direct commits/PRs on this repo; no external CAB/ticketing tool. |
| R3=A | CI/CD: **use the existing pipeline** — GitHub Actions runs tests/lint (`.github/workflows/ci.yml`); Vercel auto-deploys the connected branch on merge. |
| R4=A | Rollback: **redeploy previous version** via Vercel's built-in Instant Rollback. This feature ships new tables/migrations (forward-only; see NFR-8). |
| R5=A | Deployment style: **direct/in-place** — matches Vercel's current atomic-swap deploy model. |
| R6=A | Regional topology: **single-region** — no multi-zone/multi-region infrastructure exists or is proposed; relies on Vercel's edge network + Supabase's single-region Postgres. |
| R7=A | Incident response: **no formal process — a lightweight note is proposed**: check Vercel deployment logs + Supabase logs; roll back via the Vercel dashboard if a deploy misbehaves. |

---

## 4. Functional Requirements

### FR-1 — House item catalog & ownership in the database
- **FR-1.1** A `house_items` table stores the catalog: `id`, `room` (`bedroom` | `kitchen` |
  `living_room` | `garden`), `name_vi`, `name_en`, `emoji`, `price`, `is_active`, `sort_order`.
  Only `bedroom` rows exist in V1 seed data; the `room` column exists so future rooms are new
  rows, not a schema migration.
- **FR-1.2** A `player_house_items` table stores ownership: `player_id` (FK), `item_id` (FK),
  `purchased_at` — mirrors `player_stickers` exactly, including the composite primary key and
  idempotent-insert semantics.
- **FR-1.3** A `house_layout` table stores each player's placed items **per room**:
  `player_id`, `room`, `layout_data` (JSONB array of `{ id, itemId, x, y, scale, rotation }`),
  `updated_at`. Primary key `(player_id, room)` — one row per player per room (V1 only ever
  writes the `bedroom` row).
- **FR-1.4** RLS: `house_items` is `SELECT`-only for `auth.role() = 'authenticated'` (catalog);
  `player_house_items` and `house_layout` restrict `SELECT`/`INSERT`(/`UPDATE` for layout) to
  `auth.uid() = player_id`, matching the `stickers`/`player_stickers`/`creative_canvas` policies.
- **FR-1.5** V1 seed data (one migration, idempotent): Bed 100, Desk 70, Lamp 40, Teddy Bear 30,
  Plant 50, Rug 60 — all `room = 'bedroom'`, localized names, an emoji each.

### FR-2 — House items API
- **FR-2.1** `GET /api/house-items?room=` returns the active catalog for a room (defaults to
  `bedroom` if omitted), localized per the caller's UI locale (name only — price/emoji are
  locale-independent).
- **FR-2.2** `GET /api/players/house-items` returns the authenticated player's owned item IDs
  (mirrors `GET /api/players/stickers`).
- **FR-2.3** `POST /api/players/house-items { itemId }` purchases an item: validates the item
  exists and is active, re-checks affordability at the SQL level
  (`UPDATE players SET coins = coins - price WHERE id=$1 AND coins >= price`), returns `400`/
  insufficient-funds error if the guard fails, otherwise idempotently records ownership and
  returns the new coin balance. Purchasing an already-owned item is a no-op success (matches
  sticker purchase idempotency).
- **FR-2.4** `GET /api/players/house-layout?room=` / `PUT /api/players/house-layout
  { room, layoutData }` fetch/save the placed-items layout for one room — same shape and
  upsert-by-primary-key semantics as `GET`/`PUT /api/players/canvas`.
- **FR-2.5** All four routes require authentication (`401` otherwise) and validate input with
  Zod (room enum, item existence, layout item shape/count/position bounds).

### FR-3 — My House UI
- **FR-3.1** `components/dashboard.tsx` gains a 4th card ("My House") using the same
  `mainSections` pattern; selecting it renders a new `MyHouse` component full-screen, replacing
  the dashboard view (same convention as Shop/Creative/Learning).
- **FR-3.2** `MyHouse` shows: room navigation (Bedroom active; Kitchen/Living Room/Garden as
  locked, grayed-out, non-clickable cards with a lock icon and "Coming soon" label), the current
  coin balance (`<CoinDisplay />`), the Bedroom canvas, an items panel showing the catalog with
  price/owned/affordability state, and a "My Items" strip of owned-but-not-yet-placed items.
- **FR-3.3** Purchasing an item: tapping "Buy" on an affordable, unowned item calls
  `buyHouseItem()`; on success the item becomes owned and appears in My Items. An unaffordable
  item's buy control is disabled and shows how many more coins are needed (mirrors
  `sticker-shop.tsx`'s `needMore` treatment).
- **FR-3.4** Decorating: dragging an owned item from My Items onto the Bedroom canvas places it
  at the drop position (percentage-of-canvas coordinates, same mechanic as
  `creative-room.tsx::handleDragEnd`); placed items can be dragged to reposition
  (`handlePlacedStickerDragEnd` equivalent), and a selected placed item shows remove controls
  (resize is optional/not required by the source doc — carried over from the reused component
  only if trivial, not a hard requirement).
- **FR-3.5** Removing a placed item returns it to My Items (still owned, just unplaced) — it is
  never deleted from ownership by this action.
- **FR-3.6** The Bedroom layout autosaves (debounced, same 300ms pattern as
  `creative-room.tsx`) via `PUT /api/players/house-layout`; reopening My House restores the
  saved layout and all owned items via `GET`.

### FR-4 — Client state
- **FR-4.1** `contexts/coin-context.tsx` is extended with `ownedHouseItems: string[]`,
  `buyHouseItem(item): Promise<boolean>`, `hasHouseItem(itemId): boolean` — loaded alongside
  `coins`/`ownedStickers` in the existing player-load effect, following the exact
  optimistic-update + localStorage-cache pattern already used for stickers.

---

## 5. Non-Functional Requirements

- **NFR-1 (Compatibility)** The existing Sticker Shop, Creative Room, and Learning Zone continue
  to work unchanged. My House shares the coin balance but no other state with Decoration.
- **NFR-2 (Performance)** Catalog and layout payloads are small (≤ ~10 items, one JSONB array
  per room); no pagination needed.
- **NFR-3 (Data integrity)** A placed item's `itemId` in `house_layout.layout_data` always
  refers to an item the player owns; the purchase guard prevents a negative coin balance
  (enforced at the SQL level, not just in the client) — covered by PBT (NFR-6).
- **NFR-4 (i18n)** Item names are localized EN/VI via `t()`; UI chrome (labels, buttons, "Coming
  soon") follows the existing translation-key convention in `data/translations.ts`.
- **NFR-5 (Testability)** Unit tests cover purchase/placement logic and layout serialization;
  API tests cover all 4 new routes (auth, validation, insufficient-funds, idempotency); one E2E
  test buys an item, places it, reloads, and confirms persistence (Q9=C).
- **NFR-6 (Testability / PBT — full/blocking per Q12)** Property-based tests (fast-check,
  already a dependency — PBT-09 satisfied) cover, at minimum: the purchase affordability
  invariant (coin balance never negative after any valid/invalid purchase sequence — PBT-03),
  placement-position bounds (x/y always clamp into [5,95] regardless of drag input — PBT-03),
  and layout-data round-trip through save/load (PBT-02). Exact property list is finalized per
  unit in Functional Design (PBT-01).
- **NFR-7 (Coverage)** Vitest line coverage for new code follows the existing project threshold
  applied to comparable prior work (`lib/services/**`, `app/api/**`, `components/**`).
- **NFR-8 (Deployment)** Schema ships as one idempotent forward-only migration; the user applies
  it via `supabase db push` (matches the established pattern from `subject-content-db`). No
  rollback migration is authored — Resiliency R4 accepts Vercel-level app rollback plus the
  understanding that a schema rollback would be a manual follow-up migration if ever needed.

---

## 6. Security Compliance (Security Baseline — Q10=A, full/blocking)

Assessed against the requirements captured above; implementation-level verification recurs at
Functional Design, Code Generation, and Build & Test.

| Rule | Status | Notes |
|---|---|---|
| SECURITY-01 (encryption at rest/in transit) | Compliant (inherited) | Supabase-managed Postgres; no new infrastructure introduced |
| SECURITY-02 (access logging on network intermediaries) | N/A | No new load balancer/API gateway/CDN — Vercel-managed |
| SECURITY-03 (application logging) | Compliant (inherited) | Follows existing `console.error` + Vercel log pattern used by all current API routes |
| SECURITY-04 (HTTP security headers) | N/A (pre-existing, unchanged by this feature) | No new HTML-serving routes; headers config, if any, is app-wide and out of this feature's scope |
| SECURITY-05 (input validation) | Compliant — required in FR-2.5 | All 4 new routes validate via Zod (room enum, item existence, layout shape/bounds) |
| SECURITY-06 (least privilege) | N/A | No new IAM/service roles — uses existing Supabase client role model |
| SECURITY-07 (network configuration) | N/A | No new network infrastructure |
| SECURITY-08 (application-level access control) | Compliant — required in FR-2.5 + FR-1.4 | All routes require auth; RLS enforces per-player object-level authorization; no admin/privileged routes in this feature (Q5=A) |
| SECURITY-09 (hardening/misconfiguration) | Compliant (inherited) | No default credentials/new deployed components introduced |
| SECURITY-10 (supply chain) | Compliant (inherited) | No new dependencies planned (Framer Motion, Zod, Supabase client already in use) |
| SECURITY-11 (secure design) | Compliant | Purchase logic isolated in a service module (mirrors `lib/services/stickers.ts`); misuse case considered: replay-buying an owned item is a no-op, not a double-charge |
| SECURITY-12 (auth/credential mgmt) | N/A | No new authentication surface introduced by this feature |
| SECURITY-13 (integrity verification) | Compliant | No deserialization of untrusted data beyond the existing Zod-validated JSON body pattern |
| SECURITY-14 (alerting/monitoring) | Deferred to Resiliency R7 | No new alerting infra; incident response note covers manual log review |
| SECURITY-15 (fail-safe defaults) | Compliant — required in FR-2.3/FR-2.5 | Purchase fails closed (SQL guard); errors return generic messages, no stack traces |

No blocking security findings at the Requirements stage.

---

## 7. Resiliency Compliance (Resiliency Baseline — Q11=A)

| Rule | Status | Notes |
|---|---|---|
| RESILIENCY-01 (critical workload ID) | Compliant | My House classified **Medium** criticality — a broken purchase/placement flow degrades the experience but isn't safety- or payment-critical (virtual coins only) |
| RESILIENCY-02 (availability/recovery targets) | Compliant — R1=A | RTO/RPO: hours, Backup & Restore, per user decision |
| RESILIENCY-03 (change management) | Compliant — R2=A | Existing informal repo-based process; no exemption needed to document beyond this |
| RESILIENCY-04 (automated deployment/rollback) | Compliant — R3/R4/R5=A | Existing GitHub Actions + Vercel auto-deploy; rollback = Vercel Instant Rollback; deployment style = direct/in-place |
| RESILIENCY-05 (monitoring/alerting) | N/A (deferred) | No new observability platform in scope; Vercel/Supabase built-in logs are the existing baseline |
| RESILIENCY-06 (health checks) | N/A | Serverless Next.js API routes on Vercel; no custom health-check infra introduced |
| RESILIENCY-07 (resiliency monitoring) | N/A | No resiliency-assessment tooling in scope for a hobby-scale app |
| RESILIENCY-08 (multi-zone/region) | Compliant — R6=A | Single-region, per user decision; Vercel edge network handles static delivery |
| RESILIENCY-09 (auto-scaling/capacity) | N/A | Vercel serverless functions auto-scale by platform default; no custom limits configured or required at this scale |
| RESILIENCY-10 (dependency isolation/circuit breaking) | Partially compliant | All external calls (Supabase) already use the SDK's default timeouts; explicit circuit breakers are not implemented anywhere in the codebase today and are out of scope for this feature alone |
| RESILIENCY-11 (DR strategy) | Compliant — R1=A | Backup & Restore via Supabase-managed backups |
| RESILIENCY-12 (backup/replication) | Compliant (inherited) | Supabase automated backups cover all tables including the 3 new ones; no cross-region replication (matches R1/R6) |
| RESILIENCY-13 (failover/recovery procedures) | N/A | No custom failover — Backup & Restore tier doesn't require a runbook beyond "restore from Supabase backup" |
| RESILIENCY-14 (chaos/DR testing) | Deferred to NFR Requirements/Design | Per the extension's own rule, this question is asked at NFR Design, not Requirements |
| RESILIENCY-15 (incident response) | Compliant — R7=A | Lightweight note proposed: check Vercel + Supabase logs, roll back via Vercel dashboard |

No blocking resiliency findings at the Requirements stage. RESILIENCY-10 is flagged as
"partially compliant" for visibility, not as a blocking finding, since it reflects a pre-existing
codebase-wide pattern this feature doesn't change and isn't required to fix.

---

## 8. Property-Based Testing Plan (PBT — Q12=A, full/blocking)

- **Framework**: fast-check (already a project dependency) — PBT-09 satisfied.
- Full property identification (PBT-01) happens per-unit in Functional Design. Known candidate
  properties from this requirements pass:
  - Purchase affordability invariant (coins never negative; a purchase either fully succeeds or
    fully fails) — PBT-03.
  - Placement position bounds (x/y always land in a valid range after any drag delta) — PBT-03.
  - Layout save/load round-trip (`layoutData` serialized then deserialized equals itself) — PBT-02.
  - Idempotent ownership insert (buying an owned item twice yields the same ownership state) —
    PBT-04.

---

## 9. Personas

| Persona | Need |
|---|---|
| **Student (child)** | Spend earned coins on furniture and decorate a personal Bedroom, separate from character decoration. |
| **Parent** | Trusts that My House reuses the same coin balance and doesn't introduce a second currency or a confusing new interaction pattern. |

---

## 10. Out of Scope (V1)

- Functional Kitchen, Living Room, Garden (locked-only per Q8).
- Wallpaper/room-background customization.
- Item resizing/rotation as a hard requirement (may be trivially inherited from the reused
  drag component but is not required).
- Selling, trading, or gifting items; visiting other players' houses; multiplayer; house ranking.
- Admin CRUD for house items (Q5=A).
- Any new observability/DR infrastructure beyond what's already documented in §7 as N/A.

---

## 11. Assumptions

- **A-1** Each Bedroom item is placed at most a small number of times conceptually — V1 doesn't
  need duplicate placements of the same item (source doc examples show one of each); if a child
  owns one Bed, they can place that one Bed once. (Placing the same item type multiple times, if
  desired later, would need multiple purchases or a "quantity" concept — out of scope now.)
- **A-2** `fast-check` (`^3.22.0`, present) is the PBT framework (PBT-09 satisfied).
- **A-3** The linked Supabase project is writable by the user via `supabase db push`, per the
  established pattern from `subject-content-db`.
- **A-4** "Coming soon" locked rooms need no localized long-form copy — a short label suffices
  (e.g. "Locked").

---

## 12. Acceptance Criteria (observable)

- **AC-1** My House appears as a 4th dashboard card; selecting it opens the Bedroom by default
  with the coin balance visible. (E2E)
- **AC-2** Kitchen/Living Room/Garden render as locked, non-interactive cards. (E2E/unit)
- **AC-3** With 150 coins and a 100-coin Bed, purchasing it succeeds, the Bed appears in My
  Items, and the balance becomes 50. (API test + E2E)
- **AC-4** Attempting to purchase an item costing more than the current balance is rejected;
  no coins are deducted and no ownership row is created. (API test + PBT)
- **AC-5** Dragging an owned item onto the Bedroom places it at the drop position; dragging a
  placed item moves it; removing it returns it to My Items while it remains owned. (E2E/unit)
- **AC-6** Reloading My House after decorating restores exactly the previously owned items and
  the previously saved layout. (E2E)
- **AC-7** All 4 new API routes return `401` unauthenticated and validate malformed input with
  `400`. (API test)
- **AC-8** PBT suite passes with no blocking finding; seed logged on any failure. (CI)

---

## 13. Key Risks

| Risk | Level | Mitigation |
|---|---|---|
| Reusing `creative-room.tsx`'s drag mechanic by copy-adaptation (no shared component today) could drift the two implementations apart over time | Low | Acceptable for V1 per existing codebase conventions (Sticker Shop/Creative Room aren't abstracted either); note as a future refactor opportunity |
| `room` column added "for the future" but only ever written as `bedroom` in V1 — risk of under-tested assumptions when a second room ships later | Low | Application Design should confirm the enum/constraint approach so adding a room is genuinely additive |
| Extending `coin-context.tsx` (already handling coins + stickers + migration logic) adds more responsibility to one context | Medium | Keep the addition mechanically identical to the existing sticker code path; revisit a split if the file grows unwieldy |
| Full-blocking PBT + Security + Resiliency compliance sections add process overhead disproportionate to a hobby-scale feature | Low | Already surfaced to the user at opt-in (Q10/Q11/Q12); most Resiliency rules resolved as N/A given the managed-platform deployment model |
