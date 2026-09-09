# U3 Code Generation Plan — admin-content-api

**Status**: Part 1 approved — Part 2 executed 2026-09-09 (all 12 steps done)
**Last updated**: 2026-09-09
**Summary**: `../u3-admin-content-api/code/summary.md`

Deviation: added `lib/admin-guard.ts` (plan said "inline requireAdmin"). Local verify:
175 unit+api tests pass (14 blocking PBT); tsc clean; eslint 0 errors; next build OK
(both admin routes registered). No admin route tests (CL2=C).
**Workspace root**: `/Users/brian/Github_Repo/magichouse-dev/magichouse` (brownfield).

**Requirements covered**: FR-5; AC-6 (via TC-M003); NFR-4/6.
**Depends on**: U1 (schema, service write fns, types), U2 (nothing hard — additive).
**No new dependencies.**

---

## Step 1 — `lib/admin-auth.ts`  [ ]
- `isAdminEmail(email, allowlistCsv)` per `business-logic-model.md` §1 (fail-closed,
  case-insensitive, trimmed).
- `getAdminEmails(): string | undefined` → `process.env.ADMIN_EMAILS`.

## Step 2 — `lib/subject-content/resolve.ts` — add `validateModeCoverage`  [ ]
- `ModeCoverageError extends Error`.
- `validateModeCoverage(row, subject)` per `business-logic-model.md` §5 — pure; throws
  `ModeCoverageError` with a specific message. Operates on a row-shaped object
  (`prompt_vi/en`, `options_vi/en`) + `Pick<SubjectRow,'content_mode'|'target_language'>`.

## Step 3 — `lib/validation/api.ts` — admin schemas (additive)  [ ]
- `OptionsArraySchema = z.array(z.string().min(1)).length(3)`
- `SubjectQuestionCreateSchema` — `subjectKey`, optional `promptVi/promptEn` (nullable),
  optional `optionsVi/optionsEn` (nullable `OptionsArraySchema`), `correctIndex` 0..2,
  `difficulty` enum, optional `isActive`, `sortOrder`.
- `SubjectQuestionUpdateSchema = SubjectQuestionCreateSchema.partial().omit({ subjectKey: true }).extend({ id: z.string().uuid() })`
- Export the inferred types.
- **Do not touch** U1's `LocaleSchema` / existing schemas.

## Step 4 — `lib/services/subject-content.ts` — 3 read helpers  [ ]
- `getQuestionById(sb, id): Promise<SubjectQuestionRow | null>`
- `getSubjectById(sb, id): Promise<SubjectRow | null>`
- `maxSortOrder(sb, subjectId): Promise<number>` (0 if none)
- (write fns + `listAllQuestionsForSubject` + `listSubjects` + `getSubjectByKey` already exist.)

## Step 5 — `app/api/admin/subjects/route.ts`  [ ]
- `GET` — `requireAdmin()` inline (auth → `isAdminEmail` → 401/403, `console.warn` on 403),
  then `listSubjects` (via the **anon** server client is fine for reads; use `createAdminClient()`
  for consistency) → `apiSuccess(rows)`.

## Step 6 — `app/api/admin/subject-questions/route.ts`  [ ]
- Shared `requireAdmin(): Promise<{ user; admin } | Response>`.
- `GET ?subjectKey=` → resolve subject (400 unknown) → `listAllQuestionsForSubject` → rows.
- `POST` → `SubjectQuestionCreateSchema.parse` (400) → resolve subject (400) →
  `validateModeCoverage` (400) → `sortOrder ?? maxSortOrder+1` → `createQuestion(admin, {..., sourceKey: null})`
  → `console.log` audit → `apiSuccess(row)` 201. Catch PG error → 400 translated.
- `PATCH` → `SubjectQuestionUpdateSchema.parse` (400) → `getQuestionById` (404) → if
  prompt/options touched: `getSubjectById` + `validateModeCoverage(merge(current, patch))` (400)
  → `updateQuestion` → audit → row. Catch PG → 400.
- `DELETE ?id=` → uuid check (400) → `deleteQuestion` → audit → `apiSuccess(null)`.
- All: `requireAdmin` first.

## Step 7 — `.env.local.example`  [ ]
- Add, after the E2E block:
  ```
  # Admin content API — comma-separated allowlist of admin emails.
  # Unset = the admin API is disabled (every request gets 403).
  ADMIN_EMAILS=you@example.com
  ```

## Step 8 — `vitest.config.ts`  [ ]
- coverage `include`: add `"!app/api/admin/**"` after `"!components/ui/**"`.

## Step 9 — Unit tests  [ ]
- `automation_tests/unit/admin-auth.test.ts` — `isAdminEmail`: exact match, case-insensitive,
  padded entries, not-listed → false, `undefined`/`''`/whitespace csv → false, `null` email → false.
- `automation_tests/unit/admin-validation.test.ts` —
  - `SubjectQuestionCreateSchema` / `UpdateSchema`: valid payload passes; 2-option array →
    fail; `correctIndex` 3 → fail; bad `difficulty` → fail; `UpdateSchema` needs a uuid `id`.
  - `validateModeCoverage`: fixed-vi row correct → ok; fixed-vi row with `options_en` set →
    throw; fixed-vi row missing `options_vi` → throw; localized row missing one locale → throw;
    localized row complete → ok.
  - one `fast-check` property: for `fixedSubjectArb`, a row filled only for the target
    language never throws; a row additionally setting the other locale always throws.

## Step 10 — `MANUAL-TEST-CHECKLIST.md`  [ ]
- Replace the TC-M003 placeholder with the full text from `test-case-design.md` (allowlist
  gate: 200 for allowlisted GET, 2xx create/patch, 400 invalid, 403 ordinary user, 401 no
  auth; confirm a created row is served by the gameplay endpoint; confirm `ADMIN_EMAILS` is
  set in the deploy env).

## Step 11 — Local verification  [ ]
- `bunx tsc --noEmit` — clean for U3 files
- `bunx vitest run automation_tests/unit automation_tests/api` — all pass (incl. the new
  fast-check property)
- `bun run lint`
- `bun run build` — `/api/admin/subjects` + `/api/admin/subject-questions` appear
- (no E2E for admin — CL2=C)

## Step 12 — Documentation  [ ]
- `construction/u3-admin-content-api/code/summary.md`

---

## Files

**Created**: `lib/admin-auth.ts`, `app/api/admin/subjects/route.ts`,
`app/api/admin/subject-questions/route.ts`,
`automation_tests/unit/admin-auth.test.ts`, `automation_tests/unit/admin-validation.test.ts`

**Modified**: `lib/subject-content/resolve.ts` (+`validateModeCoverage`),
`lib/validation/api.ts` (+admin schemas), `lib/services/subject-content.ts` (+3 read helpers),
`.env.local.example`, `vitest.config.ts`, `MANUAL-TEST-CHECKLIST.md`

**Not touched**: `.github/workflows/ci.yml` (`INITIATIVE` var → Build and Test).
