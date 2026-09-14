# Tech Stack Decisions — U1: house-schema-and-service

**Status**: Draft (NFR Requirements)
**Last updated**: 2026-09-13

Brownfield unit — no new technology introduced. This records the specific, unit-level
technical choices made within the existing stack.

---

## Database Indexing

| Table | Index | Rationale |
|---|---|---|
| `house_items` | `(room, is_active)` composite | Matches the catalog query's exact filter shape (`WHERE room = ? AND is_active = true ORDER BY sort_order`); direct precedent from `subject_questions`' `idx_subject_questions_subject_active` on `(subject_id, is_active)` for the identical query pattern |
| `player_house_items` | None beyond its composite PK `(player_id, item_id)` | `player_id` already leads the PK, matching `player_stickers`' precedent (which also has no additional index) |
| `house_layout` | None beyond its composite PK `(player_id, room)` | Same reasoning — `player_id` leads the PK |
| `rooms` | None beyond its PK `(id)` | 4 rows; no query pattern benefits from an additional index |

## Property-Based Testing Framework (PBT-09)

`fast-check` (already a project dependency, `^3.22.0`) — no new framework introduced. Restates
`requirements.md` Assumption A-2, as PBT-09 requires framework selection to be recorded at this
stage.

## Validation

Zod (already a project dependency) — every new route's input validated the same way every
existing route's is; no new validation library.

## Data Access

Supabase JS client (`@supabase/supabase-js`, already a dependency) via the existing
`createServerClient()` helper — identical to every other service module in the codebase.

## No New Dependencies

This unit introduces zero new npm packages. Matches `requirements.md` SECURITY-10 ("Compliant
(inherited) — No new dependencies planned").
