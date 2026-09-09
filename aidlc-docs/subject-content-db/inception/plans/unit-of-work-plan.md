# Unit of Work Plan — subject-content-db

**Status**: Part 1 approved (all answers = A) — Part 2 generated 2026-09-09
**Last updated**: 2026-09-09

---

## Proposed decomposition (from Application Design)

| Unit | Components | Responsibility |
|---|---|---|
| **U1 — content-schema-and-service** | C1 (migrations `0002`+`0003`), C2 (`resolve.ts`), C5 (`services/subject-content.ts` — reads + orchestrator), C13-types (`database.types.ts` table types + `LocaleSchema`), **content authoring/migration** | The DB schema, the language-resolution logic, the read service, and all seed content. Foundation. |
| **U2 — gameplay-content-api-and-ui** | C3 (`quiz-session.ts`), C6 (`GET /api/subjects/[key]/questions`), C9 (`useSubjectQuestions` hook), C10 (`quiz-modal.tsx`), C11 (`learning-zone.tsx`), C12 (`translations.ts` cleanup), E2E specs + `grade2-subjects.spec.ts` update | The player-facing path: fetch, select, render, loading/error UI. Delivers the bug fix visibly. |
| **U3 — admin-content-api** | C4 (`admin-auth.ts`), C7 (`/api/admin/subjects`), C8 (`/api/admin/subject-questions`), C13-admin (admin Zod schemas), C5-writes (wire the service write fns), C14 (`.env.local.example`, config) | The admin CRUD path + its allowlist gate. |

**Dependencies**: U2 → U1, U3 → U1. U2 and U3 are independent of each other.

**Story/requirement → unit map**
- FR-1, FR-2, FR-6, AC-3, AC-4, AC-7 → **U1**
- FR-3, FR-4, AC-1, AC-2, AC-5, AC-8 → **U2**
- FR-5, AC-6 → **U3**
- NFR-5 (blocking PBT): PBT-B/PBT-C in **U1**, PBT-A in **U2**

---

## Planning Questions

Fill in each `[Answer]:` tag and say "done".

---

### Question 1 — Is content authoring its own unit?

U1 bundles the schema + service + ~100 newly authored questions + the migration of existing
content. The authoring/review is the largest, most independent chunk.

A) **Keep it in U1** — one unit owns the schema and every row that goes in it; the seed
   migration (`0003`) is authored as part of U1's code generation, reviewed via TC-M001.
   *(Recommended — the content and the schema ship together; nothing else blocks on it)*

B) **Split into U1 (schema + service) and U1b (content authoring + seed migration)** — U1b
   depends on U1; U2/U3 depend only on U1 (schema), so they can start before content is
   finalized

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 2 — Build order for U2 and U3

Both depend only on U1.

A) **Sequential: U1 → U2 → U3** — do the visible bug fix + gameplay path first, admin API
   last *(Recommended — the user-reported bug is fixed and verifiable as early as possible)*

B) **U1 → then U2 and U3 in parallel**

C) **Sequential: U1 → U3 → U2** — admin API first so content can be managed before the
   frontend switches over

D) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 3 — When does `data/translations.ts` lose its question keys (C12)?

Removing the keys while `learning-zone.tsx` still reads them would break the build.

A) **In U2, in the same change that switches `learning-zone.tsx` to the hook** — the keys
   are deleted and their last reader is removed together, no broken intermediate state.
   *(Recommended)*

B) **In U1** — delete the keys as soon as the DB has the content, and have `learning-zone`
   temporarily read from a stub until U2 (accepts a broken/partial UI between units)

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 4 — Shared-file ownership (`lib/database.types.ts`, `lib/validation/api.ts`)

Both U1 and U3 touch these files.

A) **U1 adds** the `subjects` / `subject_questions` table types and `LocaleSchema`;
   **U3 adds** the admin write schemas (`SubjectQuestionCreateSchema` etc.) in a later,
   additive edit. Standard additive edits to shared files, no conflict. *(Recommended)*

B) **U1 adds everything** (all types + all schemas up front, even the admin ones), U3 just
   consumes them

C) Other (describe after [Answer]: tag)

[Answer]:A

---

### Question 5 — CI / config changes (C14)

`playwright.config.ts` (Chromium-only), `vitest.config.ts` (coverage exclude
`app/api/admin/**`), `.github/workflows/ci.yml` (`INITIATIVE` var), `.env.local.example`.

A) **Fold config changes into the unit that needs them** — Playwright/CI config with U2
   (first unit adding E2E), coverage-exclude + `.env.local.example` with U3, and finalize
   the `INITIATIVE` var in Build and Test *(Recommended)*

B) **A tiny U0 config unit first** — all config/CI edits in one upfront pass

C) Other (describe after [Answer]: tag)

[Answer]:A

---

## Answers (all = A)
1=A content stays in U1 · 2=A sequential U1→U2→U3 · 3=A translations.ts keys removed in U2 ·
4=A U1 adds table types + LocaleSchema, U3 adds admin schemas additively ·
5=A config folded into the unit that needs each.

## Mandatory Unit Artifacts (generated in Part 2)
- [x] `inception/application-design/unit-of-work.md`
- [x] `inception/application-design/unit-of-work-dependency.md`
- [x] `inception/application-design/unit-of-work-story-map.md`
