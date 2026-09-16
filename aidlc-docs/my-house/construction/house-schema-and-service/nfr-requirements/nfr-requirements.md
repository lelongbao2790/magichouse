# NFR Requirements — U1: house-schema-and-service

**Status**: Draft (NFR Requirements)
**Last updated**: 2026-09-13

---

## Scalability

- Catalog: ≤ ~10 rows per room; ownership: one row per (player, item); layout: one row per
  (player, room). No pagination needed (matches `requirements.md` NFR-2).
- Compute: Vercel serverless functions, platform-default auto-scaling — no custom capacity
  planning (RESILIENCY-09: N/A, unchanged from `requirements.md` §7).

## Performance

- All 5 routes (4 original + `GET /api/rooms`) return payloads small enough that no
  pagination, streaming, or caching layer beyond `useHouseItems`/`useRooms`'s client-side
  module cache is needed.
- Indexing (see Tech Stack Decisions): `house_items(room, is_active)` composite index supports
  the catalog query's filter shape directly.

## Availability

- **RTO/RPO**: Hours — Backup & Restore, via Supabase-managed Postgres backups. No custom DR
  infrastructure. *(Restated per `resiliency-baseline.md`'s propagation requirement — decided
  at Requirements Analysis R1=A, unchanged here.)*
- **Regional topology**: Single-region (R6=A, unchanged).
- **Rollback**: Vercel Instant Rollback at the app level; the schema migration itself is
  forward-only (R4=A, NFR-8, unchanged) — U1's migration follows the same convention.

## Security (re-verified against Functional Design output)

`requirements.md` §6 already assessed 15 SECURITY rules against the original 4 routes/3 tables
as fully compliant/N/A with no blocking finding. Functional Design added a `rooms` table and a
`GET /api/rooms` route — re-checking the rules most likely to be affected by that addition:

| Rule | Status | Notes |
|---|---|---|
| SECURITY-05 (input validation) | Compliant | `GET /api/rooms` takes only `?locale=`, validated by the same `LocaleSchema` already covering the other 2 GET routes — no new validation surface |
| SECURITY-08 (application-level access control) | Compliant | `GET /api/rooms` requires auth like every other route (BR-2); RLS on `rooms` is `SELECT`-only for `auth.role() = 'authenticated'`, matching `house_items`'s catalog-table pattern exactly — no player-scoped data in this table, so no per-row policy needed |
| SECURITY-11 (secure design) | Compliant | `getRooms()` is a pure read with no user-supplied identifiers beyond `locale` (already-validated) — no injection surface, no new misuse case introduced |
| All other 12 rules | Unchanged from `requirements.md` §6 | The new table/route don't touch encryption, logging, headers, IAM, network config, credential management, integrity verification, or fail-safe defaults any differently than the existing 3 tables/4 routes already assessed |

**No new blocking security finding.**

### Addendum (2026-09-14, re-verified again after Code Generation's BR-3 amendment)

Code Generation introduced a `SECURITY DEFINER` Postgres function (`purchase_house_item`) not
present when the table above was written — this is the one genuinely new security-relevant
surface in this unit, so it's re-checked explicitly:

| Rule | Status | Notes |
|---|---|---|
| SECURITY-06 (least privilege) | Compliant | The function's elevated privilege is scoped to exactly what it needs (read/update `players.coins`, read/insert `player_house_items`) and is unreachable for any other purpose; `GRANT EXECUTE` is to `authenticated` only, not `anon` |
| SECURITY-11 (secure design) | Compliant | The function re-validates `auth.uid() = p_player_id` as its first statement — a `SECURITY DEFINER` function bypasses RLS, so this check is mandatory and present; without it, the elevated privilege would let any authenticated caller pass an arbitrary `p_player_id` and affect another player's balance, which this check prevents |
| SECURITY-15 (fail-safe defaults) | Compliant | On any guard failure the transaction rolls back — no partial state, matches the fail-closed posture already required elsewhere in this unit |

No new blocking finding. This is a stronger security/correctness posture than the original
design (see BR-3's amendment note) — the tradeoff is a new pattern-type (stored procedure) not
used elsewhere in this codebase, accepted by explicit user decision.

## Resiliency

Resiliency Baseline is enabled as "directional best practices" (not full/blocking) for this
initiative (Q11=A) — the 15-rule compliance table in `requirements.md` §7 stands unchanged; the
new `rooms` table doesn't introduce any new resiliency concern (it's covered by the same
Supabase-managed-backup/single-region/no-custom-DR posture as every other table in this
feature). RESILIENCY-14 (chaos/DR testing approach) remains deferred to NFR Design, per the
execution plan.

## Reliability

- Error handling: fail-closed validation throughout (`business-rules.md` BR-3/BR-4/BR-6/BR-7) —
  malformed or invalid requests are rejected before any write; a failed purchase or layout save
  leaves no partial state.
- Monitoring/alerting: N/A — existing Vercel/Supabase logs are the baseline (RESILIENCY-05,
  unchanged).
- Fault isolation: RESILIENCY-10 remains "partially compliant" (pre-existing codebase-wide gap,
  not introduced or required to be fixed by this feature).

## Maintainability

- Testing: fully specified in `test-case-design.md` (TC-A031-037 for U1's routes; PBT-D
  purchase-affordability and PBT-G idempotent-ownership property groups; the
  `purchaseHouseItem`/layout-DTO/name-resolution unit tests).
- Coverage: existing project Vitest line-coverage threshold applies to U1's new code (NFR-7,
  unchanged).

## Usability

N/A — U1 is backend-only. Covered under U2's NFR Requirements.
