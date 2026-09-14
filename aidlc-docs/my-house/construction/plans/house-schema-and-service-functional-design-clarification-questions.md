# Functional Design (U1) — Clarification Questions

**Status**: Answered (B) — amendments applied to Application Design + Units Generation artifacts

Your answer to Question 1 (a `rooms` lookup table instead of a `CHECK` constraint) surfaces a
follow-up that the original question didn't cover.

## Clarification 1: Does the `rooms` table replace RoomNav's hardcoded client-side room list?

The already-approved Application Design has `RoomNav` (`components/my-house/room-nav.tsx`)
receiving its room list (`id`, `label`, `emoji`, `locked`) as **hardcoded client-side props**
from `MyHouse`, per `component-methods.md`'s `RoomTab` type — not fetched from any API. If
`rooms` becomes a real DB table with `label_vi`/`label_en`/`is_unlocked` columns, there are two
different ways this can coexist with that already-approved design:

A) **DB-only, no client consumption (accepted duplication)** — the `rooms` table exists purely
   for referential integrity (`house_items`/`house_layout` FK to a real table instead of a
   `CHECK` list) and as a seed for future server-driven room metadata; `RoomNav` keeps its
   hardcoded client-side list exactly as already designed in Application Design. The DB
   `label_vi`/`label_en`/`is_unlocked` values are written at seed time but nothing reads them
   back yet. *(Recommended — no new API route, no reopening of the already-approved U2
   Application Design; the lookup table's benefit is purely the FK/future-proofing Q1 asked
   about, not an immediate behavior change)*

B) **Add a new `GET /api/rooms` route and switch `RoomNav` to fetch from it** — the DB becomes
   the single source of truth for room metadata immediately. This reopens U2's approved
   `components.md`/`component-methods.md` (new API route in U1's scope, new data-fetching
   responsibility in U2's `MyHouse` orchestrator) rather than a same-day, low-impact correction
   like the earlier localization fix.

C) Other (describe after [Answer]: tag)

[Answer]:B
