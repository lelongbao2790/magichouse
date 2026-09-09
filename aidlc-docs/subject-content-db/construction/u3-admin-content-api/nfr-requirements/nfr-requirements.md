# NFR Requirements — U3 admin-content-api

**Status**: Approved (user, 2026-09-09)
Light stage — inherits `requirements.md` §5. U3-specific points only.

## Security (primary)
- **S-1** Two-layer gate on every admin route: authenticated (`auth.getUser()`, 401) **and**
  `isAdminEmail(user.email, ADMIN_EMAILS)` (403). Fail closed — unset `ADMIN_EMAILS` = no
  admins.
- **S-2** The service-role client is created **only after** both checks pass, and only
  server-side. `SUPABASE_SERVICE_ROLE_KEY` is never sent to the client (it already isn't).
- **S-3** All write input is Zod-validated + route-level mode-coverage checked; the DB
  trigger + CHECK constraints are a backstop.
- **S-4** `key` / `id` params are parameterised Supabase filters — no SQL injection surface.
- **S-5** Rejected admin requests are `console.warn`-logged (`[admin] 403 <email> <path>`,
  Q1=A) so the deploy logs surface attempts. No lockout.
- **S-6** No brute-force surface — the gate is an env allowlist, not a secret to guess.
  Rate limiting is left to the platform (Vercel/Supabase edge), Q2=A.
- **S-7** `ADMIN_EMAILS` is an env var, documented in `.env.local.example`, **not** committed
  with a real value.

## Performance
- **P-1** Every admin operation is a single-row read or write (plus one small `subjects`
  lookup for `POST`/`GET`). Negligible.
- **P-2** No caching (writes) and no caching needed for the small list reads.

## Reliability
- **R-1** `DELETE` is idempotent (deleting a missing id is a 200 no-op).
- **R-2** `POST`/`PATCH` failures (Zod, mode-coverage, PG error) return a `400` with a
  specific message; nothing partially written (single statement).
- **R-3** The admin API being deployed before the migration is applied → every write 500s
  cleanly (table missing); no data corruption.

## Maintainability
- **M-1** `isAdminEmail` + `validateModeCoverage` + the Zod schemas are pure and unit-tested.
- **M-2** Routes are thin wiring over the U1 service — the only new business logic is the
  gate and the coverage check.

## Testability
- **T-1** Unit tests: `isAdminEmail` (TP-U3-1), `validateModeCoverage` (TP-U3-2, + a
  fast-check pass), `SubjectQuestionCreate/UpdateSchema` (TP-U3-3).
- **T-2** No automated route tests (CL2=C — user-approved scope). `app/api/admin/**`
  excluded from coverage. TC-M003 (manual) verifies the deployed gate + full CRUD.

## Not addressed / N/A
- Admin UI, RBAC beyond the single "admin" tier, per-field audit history, soft-delete
  retention policy, request signing.
