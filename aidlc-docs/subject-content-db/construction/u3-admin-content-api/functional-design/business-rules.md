# Business Rules — U3 admin-content-api

## BR-U3-1 — The admin gate

**BR-U3-1.1** Every admin route: `createServerClient()` → `auth.getUser()`. No user → `401`.

**BR-U3-1.2** `isAdminEmail(user.email, process.env.ADMIN_EMAILS)` must be `true`, else `403`.

**BR-U3-1.3** `isAdminEmail(email, csv)`:
- `csv` is `undefined`, `''`, or whitespace-only → **`false`** for any email (fail closed, Q1=A).
- `email` is `null` / `undefined` / `''` → `false`.
- otherwise: split `csv` on `,`, trim each entry, drop empties, lowercase; return `true`
  iff `email.trim().toLowerCase()` is in that set.

**BR-U3-1.4** After the gate passes, writes use the **service-role** client
(`createAdminClient()`) — RLS is bypassed; the gate is the only authorization.

**BR-U3-1.5** `console.log` a one-line audit record for every successful write
(`[admin] <method> subject_questions <id> by <email>`).

## BR-U3-2 — Subject resolution

**BR-U3-2.1** `POST` and `GET ?subjectKey=` resolve `subjectKey` → `subject` via
`getSubjectByKey`. Unknown key → `400` (`"Unknown subject: <key>"`).

**BR-U3-2.2** `subject_id` on the stored row is the resolved id — the client never sends it.

## BR-U3-3 — Write validation (route-level, Q2=A)

For `POST` (full) and `PATCH` (the fields present):

**BR-U3-3.1** Zod: `correctIndex ∈ {0,1,2}`; `difficulty ∈ {easy,medium,hard}`; each
`options*` array, when present, is exactly 3 non-empty strings; `id` (PATCH) is a uuid.

**BR-U3-3.2** Mode coverage against the resolved subject (POST always; PATCH only when a
prompt/options field is being changed and the whole final row can be evaluated — for PATCH,
fetch the current row, apply the patch in memory, then check):
- `content_mode = 'fixed'`, `target_language = L`: final row must have `promptL` and
  `optionsL` non-null, and the **other** locale's prompt/options must be null.
- `content_mode = 'localized'`: all of `promptVi`, `promptEn`, `optionsVi`, `optionsEn`
  non-null.
- Violation → `400` with a specific message (e.g. `"fixed 'vi' subject: options_en must be empty"`).

**BR-U3-3.3** `correctIndex` must be `< length` of whichever options arrays are present
(always true given BR-U3-3.1's length-3 rule + range 0..2, but asserted).

**BR-U3-3.4** The DB trigger `subject_questions_mode_check()` remains as a backstop — if a
write somehow bypasses BR-U3-3.2, the trigger raises and the route returns `400` with the
translated message.

**BR-U3-3.5** `source_key` is never set by the API (Q5=A) — new rows get `NULL`.

**BR-U3-3.6** `sortOrder` default on `POST`: `(max(sort_order) for the subject) + 1`, so a
new question lands at the end. Explicit `sortOrder` is honoured.

## BR-U3-4 — Operation semantics

**BR-U3-4.1** `POST` → `INSERT`, returns the full new row, `201`.

**BR-U3-4.2** `PATCH` → `UPDATE ... WHERE id = $1`, returns the updated row. Unknown id →
`404`.

**BR-U3-4.3** `DELETE ?id=` → hard `DELETE ... WHERE id = $1` (Q3=A). Missing/invalid `id`
query param → `400`. Deleting a non-existent id is a `200` no-op (idempotent).

**BR-U3-4.4** Deactivating a question = `PATCH { id, isActive: false }`. A deactivated
question disappears from the gameplay endpoint (U1 `getActiveQuestions` filters
`is_active = true`) but stays visible in `GET /api/admin/subject-questions`.

**BR-U3-4.5** Editing a **seeded** question (`source_key != null`) is allowed; the operator
is reminded (in `.env.local.example` / `MANUAL-TEST-CHECKLIST.md`) that a future re-seed of
`0003` reverts it.

## BR-U3-5 — Config & scope

**BR-U3-5.1** `.env.local.example` gains an `ADMIN_EMAILS` entry with a comment.

**BR-U3-5.2** `vitest.config.ts` coverage `include` gains `"!app/api/admin/**"` (CL2=C) so
the untested thin route wrappers don't affect the threshold.

**BR-U3-5.3** **No automated route tests** (CL2=C). Unit tests cover `isAdminEmail` and the
Zod schemas only. TC-M003 (manual) verifies the deployed gate + CRUD.

**BR-U3-5.4** `lib/validation/api.ts` edits are **additive** — U1's `LocaleSchema` and the
existing schemas are untouched (U-of-W Q4=A).
