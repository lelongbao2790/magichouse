# Unit of Work Plan — my-house

**Status**: Answered — awaiting approval to proceed to generation
**Last updated**: 2026-09-13

---

## Proposed Decomposition (from Application Design + Execution Plan preview)

| Unit | Owns | Responsibility |
|---|---|---|
| **U1 — house-schema-and-service** | DB migration (`house_items`, `player_house_items`, `house_layout` + RLS + seed), `lib/services/house-items.ts`, `lib/services/house-layout.ts`, all 4 API routes (`/api/house-items`, `/api/players/house-items`, `/api/players/house-layout`), `lib/database.types.ts` additions, `lib/validation/api.ts` additions (Zod schemas for the 4 routes) | The data model, the server-side logic (including FR-2.1's server-side locale selection), and the HTTP contract. Foundation — nothing in U2 can be built against a real backend without this. |
| **U2 — my-house-ui** | `components/my-house/` (all 5 files), `lib/hooks/use-house-items.ts`, `contexts/coin-context.tsx` extension, `components/dashboard.tsx` extension (4th card + view branch), `data/translations.ts` additions (UI chrome only — item names are server-localized per U1, not translation keys) | The player-facing screen: browse, buy, place, persist. Delivers the feature visibly. |

**Dependencies**: U2 → U1 (U2's client code calls U1's API routes and consumes U1's response
shapes/types). U1 has no dependency on U2.

**Requirement → unit map**
- FR-1 (schema), FR-2 (API) → **U1**
- FR-3 (UI), FR-4 (client state) → **U2**
- NFR-6 (blocking PBT): purchase-affordability + idempotent-ownership properties → **U1**;
  placement-bounds + layout round-trip properties → **U2**
- NFR-8 (deployment/migration) → **U1**

This mirrors `subject-content-db`'s U1 (schema+service) → U2 (gameplay UI) split, one level
simpler since there's no third admin unit here (Q5=A in requirements — no admin surface).

---

## Planning Questions

Fill in each `[Answer]:` tag and say "done".

---

### Question 1 — Is the 2-unit split (schema+service vs UI) right, or should it change?

A) **Keep the 2-unit split as previewed** — U1 (schema/service/API) → U2 (UI). Matches the
   clean service-layer/component-layer boundary from Application Design and the
   `subject-content-db` precedent. *(Recommended)*

B) **Split U1 further**: a separate "content" unit for the migration + seed data, independent
   of the service-layer code (mirrors `subject-content-db`'s Question 1, which rejected this
   same split for that initiative).

C) **Merge into a single unit** — schema, service, API, and UI all built together as one unit
   (simplest if there's no value in an intermediate checkpoint between backend and frontend).

D) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 2 — Build order for U1 and U2

A) **Sequential: U1 → U2** — finish and verify the schema/service/API layer (including its own
   unit/API tests) before starting the UI, so U2 is built against a real, tested backend from
   the start. *(Recommended — matches `subject-content-db`'s precedent and avoids throwaway
   client-side mocks)*

B) **Parallel with stubbed types** — start U2 immediately against hand-written TypeScript types
   matching the planned API shape, reconcile with the real U1 API once both are done.

C) Other (describe after [Answer]: tag)

[Answer]:B

---

### Question 3 — Shared-file ownership

`lib/database.types.ts`, `lib/validation/api.ts`, `data/translations.ts`, and
`contexts/coin-context.tsx` are all touched by this feature but not exclusively "owned" by one
unit in the way a new file is.

A) **U1 adds** the 3 new table types to `database.types.ts` and the 4 new Zod schemas to
   `validation/api.ts`; **U2 adds** UI-chrome translation keys to `translations.ts` and the
   `ownedHouseItems`/`buyHouseItem()`/`hasHouseItem()` extension to `coin-context.tsx`. Each
   file gets one additive edit from the unit that needs it — no unit touches a file the other
   unit also needs to touch. *(Recommended)*

B) **U1 adds everything up front** (including the coin-context extension and translation keys),
   U2 only builds UI on top of it.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 4 — Deployment sequencing

The schema migration (U1) is forward-only and adds 3 unused-until-U2 tables; the dashboard card
(U2) is what actually exposes the feature to players.

A) **Ship together** — merge and deploy U1 and U2 in the same release; the migration existing
   "quietly" for a few hours/days between U1's code-complete and U2's code-complete is fine
   since the tables aren't referenced by anything else. *(Recommended — this is how
   `subject-content-db`'s multi-unit rollout was handled, and there's no user-facing risk to an
   unreferenced table sitting in the DB)*

B) **Ship U1 to production as soon as it's done** (migration applied, API live but unused),
   then ship U2 separately once ready — an intentional two-step rollout.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 5 — Where does the `room` enum representation get decided?

`requirements.md` §13 (Key Risks) flags this as an open structural detail: whether `room` is a
Postgres `CHECK` constraint (`bedroom`/`kitchen`/`living_room`/`garden`) or a proper lookup
table, given only `bedroom` has real rows in V1.

A) **Decide it in U1's Functional Design** (technology-agnostic business-logic design, per-unit,
   CONSTRUCTION phase) — this is exactly the kind of schema-shape detail Functional Design
   exists to resolve, and it only affects U1. *(Recommended)*

B) **Decide it now** — describe your preferred approach after [Answer]: tag (e.g. "CHECK
   constraint" or "lookup table") and it will be locked into `unit-of-work.md` directly.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

## Categories Evaluated But Not Turned Into Questions (with justification)

- **Team Alignment**: N/A — this is a single-developer, single-repo initiative (consistent with
  `grade2-subjects-coin-rewards` and `subject-content-db`); there's no team-ownership boundary to
  negotiate.
- **Code Organization (Greenfield multi-unit)**: N/A — this rule only applies to greenfield
  projects; `my-house` is brownfield (existing Next.js/Supabase monolith).
- **Business Domain boundaries**: Already resolved by Application Design's component/service
  split (Q1-Q2 above test whether that split should change) — no separate bounded-context
  question needed beyond that.
