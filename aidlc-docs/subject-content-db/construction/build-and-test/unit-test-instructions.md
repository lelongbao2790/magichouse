# Unit Test Execution — subject-content-db

## Run

```bash
bunx vitest run automation_tests/unit
# or the whole (unit + api) suite:
bun run test        # vitest run
```

## Expected

- **175 tests pass, 0 failures** across 16 files (`automation_tests/unit` +
  `automation_tests/api`).
- Includes **14 property-based tests** (fast-check, blocking): PBT-B/PBT-C (subject content
  resolution + round-trip), PBT-A (session selection invariants), and the U3
  `validateModeCoverage` properties.
- Console noise is expected and benign: `[GET ...] Error: boom` from the deliberate
  500-path tests, and React `act(...)` warnings from the `learning-zone-content` RTL tests
  (async provider fetch settling — assertions still pass).

## New test files (this initiative)

| File | Covers | Cases |
|---|---|---|
| `subject-content-resolve.test.ts` | `resolveQuestion` / `resolveTitle` / round-trip | TC-U069–U079 |
| `subject-content.pbt.test.ts` | **PBT-B** language-resolution invariance, **PBT-C** round-trip | TC-U080–U085 |
| `subject-content-service.test.ts` | `getSubjectContent` (mocked Supabase) | TC-U086–U089 |
| `quiz-session.test.ts` | `pickSessionQuestions` examples | TC-U090–U098 |
| `quiz-session.pbt.test.ts` | **PBT-A** selection invariants | TC-U099–U104 |
| `use-subject-questions.test.tsx` | the fetch hook (renderHook + mocked fetch) | TC-U105–U112 |
| `quiz-modal.test.tsx` | loading / error+retry / empty / question render | TC-U113–U117 |
| `learning-zone-content.test.tsx` | content vs math path, freeze-on-language-switch | TC-U118–U121 |
| `admin-auth.test.ts` | `isAdminEmail` | TC-U122–U128 |
| `admin-validation.test.ts` | admin Zod schemas + `validateModeCoverage` (+ PBT) | TC-U129–U142 |
| `api/subject-content.api.test.ts` | fixed/localized resolution, migration CHECK text | TC-A028–A030 |
| `api/subject-questions-route.api.test.ts` | `GET` route contract | TC-A025–A027(+) |

## Coverage

`bun run test:coverage` (vitest `--coverage`, threshold `lines: 80`) — **the global line
threshold is not met and was not met before this initiative** (~30%). It is **not enforced
in CI** (the CI `unit` job runs `vitest run` without `--coverage`). The gap is structural:
the coverage `include` globs (`lib/services/**`, `app/api/**`, `components/**`) cover many
pre-existing untested routes/components.

New logic in this initiative is well tested; note the pure modules `lib/subject-content/*`,
`lib/quiz-session.ts`, `lib/hooks/*`, `lib/admin-auth.ts`, `lib/admin-guard.ts` sit
**outside** the current coverage `include` globs and are covered by their dedicated test
files above. `app/api/admin/**` is deliberately excluded (CL2=C).
