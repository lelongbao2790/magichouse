# Unit of Work Story Map — my-house

**Status**: Approved (user, 2026-09-13)
**Last updated**: 2026-09-13

Maps every functional requirement, acceptance criterion, NFR, and test case from
`requirements.md` and `test-case-design.md` to the unit that delivers it. `my-house` has no
User Stories artifact (skipped at Workflow Planning — see `execution-plan.md`), so this map uses
requirements/ACs as the mapping unit instead of stories, per `error-handling.md`'s guidance for
when a prerequisite artifact doesn't exist.

---

## Functional Requirements -> Unit

| Requirement | Description | Unit |
|---|---|---|
| FR-1.1–1.5 | `house_items`/`player_house_items`/`house_layout` schema, RLS, seed data | **U1** |
| FR-2.1–2.5 | 4 API routes (catalog, ownership, purchase, layout), auth + Zod validation | **U1** |
| FR-3.1–3.6 | My House UI: dashboard card, room nav, catalog, purchase UI, drag/place/remove, autosave | **U2** (room list itself now sourced from **U1**'s `GET /api/rooms` — added 2026-09-13, U1 Functional Design) |
| FR-4.1 | `coin-context.tsx` extension (`ownedHouseItems`, `buyHouseItem()`, `hasHouseItem()`) | **U2** |

## Non-Functional Requirements -> Unit

| NFR | Description | Unit |
|---|---|---|
| NFR-1 (Compatibility) | Existing Shop/Creative/Learning unaffected | **U2** (only unit touching shared UI files) |
| NFR-2 (Performance) | Small payloads, no pagination | **U1** (API/service shape) |
| NFR-3 (Data integrity) | Placed-item ownership invariant, non-negative balance | **U1** (SQL guard) + **U2** (client never places an unowned item) |
| NFR-4 (i18n) | Item names server-localized (U1); UI chrome localized via `t()` (U2) | **U1** + **U2** |
| NFR-5 (Testability) | Unit/API/E2E coverage | **U1** (unit+API) + **U2** (E2E, plus its own unit tests) |
| NFR-6 (PBT, blocking) | 4 property groups | Split below |
| NFR-7 (Coverage) | Vitest line coverage threshold | **U1** + **U2** (each meets the threshold for its own new code) |
| NFR-8 (Deployment) | Forward-only migration, `supabase db push` | **U1** |

## Acceptance Criteria -> Unit (+ Test Case)

| AC | Description | Unit | Test Case(s) |
|---|---|---|---|
| AC-1 | My House opens to Bedroom with coin balance visible | **U2** | TC-E018 |
| AC-2 | Locked rooms render non-interactive | **U2** | TC-E019 |
| AC-3 | Affordable purchase succeeds, balance updates | **U1** (guard) + **U2** (UI) | TC-E020, TC-A035 |
| AC-4 | Unaffordable purchase rejected, no state change | **U1** (guard) | TC-E021, TC-A034, PBT-D |
| AC-5 | Drag-place/move/remove works, ownership retained | **U2** | TC-E022, TC-E023 |
| AC-6 | Reload restores items + layout | **U1** (persistence) + **U2** (load UI) | TC-E024 |
| AC-7 | All 4 routes: `401` unauth, `400` invalid input | **U1** | TC-A031, TC-A036, TC-A037 |
| AC-8 | PBT suite passes, seed logged on failure | **U1** + **U2** (split below) | PBT-D/E/F/G |

## Property-Based Tests -> Unit

| PBT | Property | Unit |
|---|---|---|
| PBT-D | Purchase affordability invariant | **U1** |
| PBT-E | Placement position bounds `[5,95]` | **U2** |
| PBT-F | Layout save/load round-trip | **U2** (client-facing round-trip) — exercises **U1**'s `getLayout`/`saveLayout` underneath |
| PBT-G | Idempotent ownership insert | **U1** |

## Test Cases -> Unit

| Test type | IDs | Unit |
|---|---|---|
| E2E (TC-E) | TC-E018–TC-E027 (all 10) | **U2** |
| API (TC-A) | TC-A031–TC-A037 (all 7) | **U1** |
| Manual (TC-M) | TC-M006 (content review), TC-M008 (migration check) | **U1** |
| Manual (TC-M) | TC-M007 (mobile drag feel) | **U2** |

---

## Coverage Check

Every FR, NFR, AC, PBT group, and test case from `requirements.md` and `test-case-design.md`
is assigned to at least one unit above — no orphaned requirement. Where a requirement spans
both units (e.g. AC-3, AC-6, NFR-3, NFR-4), both units' contributions are listed explicitly
rather than picking one owner, since the underlying behavior genuinely requires both the
service-layer guard/persistence (U1) and the UI that exercises it (U2).
