# Unit of Work — Story / Requirement Map — subject-content-db

User Stories stage was skipped; this maps `requirements.md` functional requirements,
acceptance criteria, and test cases to units.

## U1 — content-schema-and-service

| Item | Description |
|---|---|
| FR-1.1 / FR-1.2 / FR-1.4 | `subjects` + `subject_questions` tables, columns, RLS |
| FR-1.3 | math practices excluded from the tables |
| FR-2.1 | migrate existing question content, preserve correct answers |
| FR-2.2 / FR-2.3 | author ~50 Grade 2 Vietnamese + ~50 Grade 2 English |
| FR-2.4 | re-author Grade 1 English fully English |
| FR-2.5 | content guidance: 3 options, one correct, difficulty tagged, Grade 1–2 level |
| FR-2.6 | idempotent seed migration |
| FR-3.2 | server-side language resolution (`resolve.ts`) — the bug fix logic |
| FR-6.1 | `quiz_history.category` CHECK adds `grade2Vietnamese` / `grade2English` |
| NFR-3 | active question always has complete required-locale text + valid `correct_index` |
| NFR-5 | PBT-B (resolution invariance), PBT-C (round-trip); PBT-01 property list |
| AC-3 | Grade 2 VN & EN ≥ 45 active questions each |
| AC-4 | `translations.ts` still builds (types compile; keys removed later in U2) |
| AC-7 | Grade 2 language-subject history insert succeeds |
| TC-A028, TC-A029, TC-A030 | resolution + migration-constraint tests |
| TC-M001, TC-M002 | content review; migration applied |

## U2 — gameplay-content-api-and-ui

| Item | Description |
|---|---|
| FR-3.1 | `GET /api/subjects/[key]/questions?locale=` returns `{ title, questions }` |
| FR-3.3 | client-side `pickSessionQuestions` (10 per session) |
| FR-3.4 | 401 unauth; clear error body; never partial text |
| FR-4.1 | `learning-zone.tsx` hybrid `quizData` (DB content vs generated math) |
| FR-4.2 | loading state while questions fetch |
| FR-4.3 | error + Retry in the quiz modal; no quiz starts on failure |
| FR-4.4 | titles from `subjects`; question/option text out of `translations.ts` |
| FR-4.5 | switching UI language mid-quiz does not change `fixed`-subject text |
| NFR-1 | existing flows (preschool, math, coins, Grade 2 nav) unchanged for users |
| NFR-2 | one query per quiz open; session cache in the hook |
| NFR-5 | PBT-A (selection invariants) |
| NFR-7 | coverage ≥ 80% incl. new async paths (component tests for loading/error) |
| AC-1 | UI = English → Grade 2 Vietnamese shows Vietnamese |
| AC-2 | Preschool follows UI locale |
| AC-5 | endpoint 401 / shape / `fixed` locale-independence |
| AC-8 | API error → retry UI, no quiz |
| TC-A025, TC-A026, TC-A027 | endpoint contract tests |
| TC-E009–TC-E017 + `grade2-subjects.spec.ts` update | E2E (Chromium) |
| TC-M004, TC-M005 | deployed-app language check; history/coins for all types |

## U3 — admin-content-api

| Item | Description |
|---|---|
| FR-5.1 | admin CRUD over `subject_questions` + list `subjects` |
| FR-5.2 | `ADMIN_EMAILS` allowlist gate → 403 otherwise |
| FR-5.3 | Zod validation: subject ref, 3 options, `correct_index` range, difficulty, mode locale coverage |
| FR-5.4 | `ADMIN_EMAILS` in `.env.local.example` |
| NFR-4 | service-role key server-only; content tables RLS unchanged; no new client secrets |
| NFR-6 | content manageable via migrations + admin API |
| AC-6 | admin endpoints 403 / 2xx+persist / 400 — verified manually (TC-M003) |
| unit tests | `isAdminEmail`; admin Zod schemas |
| (no route tests — CL2=C) | `app/api/admin/**` excluded from coverage |
| TC-M003 | allowlist gate on the deployed env |

## Build & Test (cross-unit)

| Item | Description |
|---|---|
| NFR-8 | one idempotent migration set; user applies via `supabase db push` |
| A-6 | CI `INITIATIVE` var → `subject-content-db` |
| PBT-08 | fast-check seed logged in the CI unit-test step |
| AC-9 | PBT suite green + wired into CI; no blocking PBT finding |
| TC-M001–TC-M005 | consolidated into `MANUAL-TEST-CHECKLIST.md` |

## Coverage check — every FR and AC is assigned

FR-1..FR-6 ✅ · NFR-1..NFR-8 ✅ · AC-1..AC-9 ✅ · TC-E009–017 ✅ · TC-A025–030 ✅ ·
PBT-A/B/C ✅ · TC-M001–005 ✅
