# Integration Test Instructions — subject-content-db

There is no automated integration harness in this project (no live-DB test runner). These
scenarios are verified by running the app against a real Supabase project with the
migrations applied, and are also on the manual checklist (`MANUAL-TEST-CHECKLIST.md`).

## Setup

```bash
supabase db push                     # apply 0002 + 0003 to the linked project
cp .env.local.example .env.local     # fill in real values incl. ADMIN_EMAILS
bun run dev                          # http://localhost:3000
```

## Scenario 1 — content service → gameplay API → UI (the bug fix)

- **Steps**: log in; Learning Zone; set UI language to English; open Grade 2 → Vietnamese.
- **Expected**: brief loading state, then Vietnamese question text with English chrome.
  `GET /api/subjects/grade2Vietnamese/questions?locale=en` returns Vietnamese `question`
  strings.
- **Covered by**: TC-E009, TC-M004.

## Scenario 2 — quiz completion → coins → quiz_history (constraint fix)

- **Steps**: note coin balance; complete a Grade 2 Vietnamese quiz; claim coins.
- **Expected**: balance increases 5–30; a `quiz_history` row with
  `category = 'grade2Vietnamese'` is inserted (previously blocked by the CHECK constraint).
- **Covered by**: TC-E015, TC-M005.

## Scenario 3 — admin write → gameplay read

- **Steps**: as an allowlisted admin, `POST /api/admin/subject-questions` a new
  `grade2English` question; then `GET /api/subjects/grade2English/questions`.
- **Expected**: the new question's `id` can appear in the returned set; `PATCH { isActive:
  false }` removes it from the gameplay set but not from
  `GET /api/admin/subject-questions?subjectKey=grade2English`.
- **Covered by**: TC-M003.

## Scenario 4 — localized subject follows the UI locale

- **Steps**: UI = Vietnamese, open Preschool → Shapes (record text); close; UI = English;
  reopen Shapes.
- **Expected**: the two question texts differ (Vietnamese, then English).
- **Covered by**: TC-E011, TC-E017.

## Cleanup

Deactivate or delete any admin-created test questions (`DELETE
/api/admin/subject-questions?id=<id>`).
