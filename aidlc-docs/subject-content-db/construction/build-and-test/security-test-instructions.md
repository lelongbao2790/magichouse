# Security Test Instructions — subject-content-db

The Security Baseline extension was **not enabled** (Requirements Q12=B). This is the
lightweight security check list for the changes in this initiative.

## Dependency check

```bash
npm audit --omit=dev        # or: bun audit
```
New devDependencies this initiative: `@testing-library/react`, `@testing-library/dom` — dev
only, not in the bundle. No new runtime dependencies.

## Auth / authorization (manual review + TC-M003)

| Endpoint | Check |
|---|---|
| `GET /api/subjects/[key]/questions` | Returns 401 without a valid session (verified: TC-A025). RLS on `subjects` / `subject_questions` = authenticated SELECT only. |
| `GET /api/admin/subjects` | 401 unauth, **403 for an authenticated non-allowlisted user** (TC-M003 step 8). |
| `/api/admin/subject-questions` (all verbs) | Same gate. Writes use the service-role client **only after** the gate passes. |
| Fail-closed | `ADMIN_EMAILS` unset → every admin request gets 403 (verified: TC-U126). |

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` — used only in `lib/supabase/admin.ts` / `lib/admin-guard.ts`
  (server), never imported by client code. No change.
- `ADMIN_EMAILS` — new env var; documented in `.env.local.example` with a placeholder, not
  a real value. Not exposed to the client.

## Input validation

- Gameplay: `locale` via `LocaleSchema` (enum). `key` is an opaque, parameterised
  `.eq('key', key)` filter — no injection surface.
- Admin: every write body via `SubjectQuestionCreate/UpdateSchema` (Zod) + route-level
  `validateModeCoverage` + the DB trigger/CHECK constraints as a backstop.

## Logging

- Rejected admin requests → `console.warn('[admin] 403 <email> <path>')`.
- Successful admin writes → `console.log('[admin] <VERB> subject_questions <id> by <email>')`.
- No secrets or full request bodies are logged.

## Not in scope

Rate limiting (platform-provided), CSRF (same-origin JSON API + Supabase cookie auth),
pen testing, SAST beyond `eslint` + `tsc`.
