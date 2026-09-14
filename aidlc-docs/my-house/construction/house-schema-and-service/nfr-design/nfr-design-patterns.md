# NFR Design Patterns — U1: house-schema-and-service

**Status**: Draft (NFR Design)
**Last updated**: 2026-09-14

---

## Resilience Patterns

- **Fail-closed validation**: every write path (purchase, layout save) validates fully before
  touching the database and never leaves a partial write (`business-rules.md` BR-3, BR-4, BR-6,
  BR-7). This is the primary resilience pattern this unit applies — correctness-under-failure
  rather than retry-based recovery.
- **No retry/circuit-breaker pattern**: matches the existing codebase-wide posture (no such
  pattern exists anywhere today); RESILIENCY-10 remains "partially compliant" by design
  acceptance, not by omission.
- **Backup & Restore (DR pattern)**: relies entirely on Supabase-managed automated backups —
  no application-level backup logic. RTO/RPO = hours (R1=A, unchanged).

## DR Testing Pattern (RESILIENCY-14, Q=B — propose a plan)

No existing DR-testing/chaos-engineering practice was identified for this project, so a
lightweight, proportionate plan is proposed here rather than assuming a heavier one:

| Test | Frequency | What it verifies |
|---|---|---|
| Restore drill | Once, after this feature's migration ships; then whenever a schema change touches these 4 tables | Trigger a Supabase point-in-time restore to a scratch project (or use Supabase's restore-verification tooling if available on the plan tier) and confirm `house_items`, `player_house_items`, `house_layout`, `rooms` come back with correct row counts and RLS policies intact |
| RLS policy check | Every migration touching these tables | `select * from pg_policies where tablename in ('house_items','player_house_items','house_layout','rooms')` — confirm expected policies exist and are enabled (same check already specified as TC-M008 for the initial migration) |
| Purchase-guard chaos check | Ad hoc, opportunistic (not scheduled) | Manually attempt a purchase with a stale/incorrect balance assumption (e.g. two rapid clicks) and confirm the SQL guard prevents a negative balance — a manual analog of PBT-D, exercised against the real deployed environment rather than the test suite |

This plan is scaled to a hobby/small-project context (matches R1/R6/R7's already-accepted
lightweight posture) — it is a starting point for adoption, not a certified DR program (per the
Resiliency Baseline extension's own framing).

## Scalability Patterns

- Stateless serverless functions (Vercel), platform-default auto-scaling — no custom scaling
  pattern introduced.

## Performance Patterns

- Indexed catalog query pattern: `house_items(room, is_active)` composite index (already
  decided in NFR Requirements `tech-stack-decisions.md`).
- Client-side module-level cache pattern for `useHouseItems`/`useRooms` (Application Design
  decision, restated here as the performance pattern it implements — avoids redundant fetches
  within a session).

## Security Patterns

Already fully specified as concrete rules (`business-rules.md`), not abstract patterns:
auth-gate-every-route, Zod-validate-every-input, SQL-level-guard-every-balance-mutation,
RLS-scope-every-player-owned-table. No additional pattern-level decision needed here.
