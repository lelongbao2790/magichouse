# U3 Functional Design Plan — admin-content-api

**Status**: Awaiting user answers
**Last updated**: 2026-09-09

Unit U3 = `lib/admin-auth.ts` (`isAdminEmail`), admin Zod schemas, wiring the U1 service
write fns to routes: `GET /api/admin/subjects`, `/api/admin/subject-questions`
(GET/POST/PATCH/DELETE). No automated route tests (CL2=C) — verified via TC-M003.

---

## Answers — all A
1=A fail closed (unset `ADMIN_EMAILS` → nobody is admin); case-insensitive exact match, trimmed
2=A validate mode-coverage in the route (nice 400s) + keep the DB trigger as backstop
3=A `DELETE ?id=` hard-deletes; deactivate via `PATCH { id, isActive: false }`
4=A admin list endpoints return raw snake_case DB rows
5=A admins cannot set `source_key` — admin-created rows are always `source_key = NULL`

## Plan — DONE 2026-09-09
- [x] `functional-design/domain-entities.md`
- [x] `functional-design/business-rules.md`
- [x] `functional-design/business-logic-model.md` (+ PBT-01)
- [x] (no `frontend-components.md` — no UI)

**Approved** by user 2026-09-09.

---

## Questions

### Q1 — `isAdminEmail` matching + `ADMIN_EMAILS` unset

A) **Exact match, case-insensitive, entries trimmed.** `ADMIN_EMAILS` unset or empty →
   `isAdminEmail` returns `false` for everyone (the admin API is effectively disabled —
   every request gets 401/403). *(Recommended — fail closed)*

B) Same matching, but `ADMIN_EMAILS` unset → **allow any authenticated user** (open in
   environments where the var isn't set — e.g. local dev)

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q2 — Mode-coverage validation on admin writes

The DB trigger `subject_questions_mode_check()` (U1) already rejects a row that doesn't
match its subject's `content_mode`. For the admin API:

A) **Validate in the route too** — resolve `subjectKey → subject` (a `getSubjectByKey`
   lookup), then check the vi/en prompt+options coverage against `content_mode` /
   `target_language` in the route and return a clear `400` message. The trigger stays as a
   last line of defence. *(Recommended — nice errors for the human using the API)*

B) **Rely on the trigger only** — attempt the write; on a Postgres error, return `400` with
   the DB message. Less code, uglier errors.

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q3 — `DELETE` semantics

A) **`DELETE ?id=` is a hard delete**; deactivating a question is `PATCH { id, isActive: false }`
   (the seed's `source_key` rows come back on the next re-seed anyway). *(Recommended —
   matches AD Q5=A)*

B) **`DELETE ?id=` always soft-deletes** (`is_active = false`); no hard delete via the API
   (hard deletes only via SQL)

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q4 — Admin list response shape

`GET /api/admin/subjects` and `GET /api/admin/subject-questions?subjectKey=`:

A) **Raw DB rows** (`SubjectRow[]` / `SubjectQuestionRow[]`, snake_case, incl. `source_key`,
   `is_active`, timestamps). Simplest; the consumer is you / curl / a future tiny admin
   tool. *(Recommended)*

B) **Mapped camelCase DTOs** (like the gameplay endpoint)

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Q5 — Can an admin set `source_key` on create?

A) **No** — admin-created rows always have `source_key = NULL` (so a seed re-run never
   overwrites them). The field is not in the create schema. *(Recommended)*

B) **Yes** — allow setting `source_key` (advanced; lets an admin "adopt" a seed slot)

C) Other (describe after [Answer]: tag)

[Answer]:A
