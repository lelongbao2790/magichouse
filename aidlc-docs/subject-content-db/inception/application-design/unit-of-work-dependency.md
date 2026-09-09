# Unit of Work — Dependencies — subject-content-db

## Dependency matrix

| Unit | Depends on | Blocks | Can start when |
|---|---|---|---|
| U1 content-schema-and-service | — | U2, U3 | now |
| U2 gameplay-content-api-and-ui | U1 (schema, `resolve.ts`, service reads, types) | Build & Test | U1 code generation complete + approved |
| U3 admin-content-api | U1 (schema, service module, types) | Build & Test | U1 code generation complete + approved |

No circular dependencies. Update strategy: **sequential U1 → U2 → U3** (Q2=A).

## Graph

```
        +----+
        | U1 |  content-schema-and-service
        +----+
         |  \
         |   \
         v    v
      +----+  +----+
      | U2 |  | U3 |     (U2 before U3, per Q2=A; no U2<->U3 dependency)
      +----+  +----+
         \     /
          v   v
     +---------------+
     | Build & Test  |
     +---------------+
```

## Shared-file coordination

| File | U1 does | U2 does | U3 does |
|---|---|---|---|
| `lib/database.types.ts` | add `subjects` + `subject_questions` types | — | — |
| `lib/validation/api.ts` | add `LocaleSchema` | consume `LocaleSchema` | add `SubjectQuestionCreate/UpdateSchema` (additive) |
| `lib/services/subject-content.ts` | create with read fns + write fn stubs | consume reads | implement + wire write fns |
| `data/translations.ts` | — | remove migrated question + title keys (with C11) | — |
| `playwright.config.ts` | — | Chromium-only | — |
| `vitest.config.ts` | — | — | coverage `include` += `!app/api/admin/**` |
| `.env.local.example` | — | — | add `ADMIN_EMAILS` |
| `.github/workflows/ci.yml` | — | — | — (INITIATIVE var finalized in Build & Test) |
| `MANUAL-TEST-CHECKLIST.md` | create + TC-M001, TC-M002 | TC-M004, TC-M005 | TC-M003 |

All shared-file edits are additive or clearly partitioned — no merge hazard given the
sequential order.

## Integration checkpoints

| After | Verify |
|---|---|
| U1 | migrations apply locally (`supabase db reset`); types compile; U1 unit + PBT-B/C green; app still builds (translations.ts untouched so old UI still works) |
| U2 | `bun dev` → open each content subject → questions load from API; bug-fix E2E (TC-E009) green; `grade2-subjects.spec.ts` green; math practices unaffected; translations.ts keys removed and build clean |
| U3 | `isAdminEmail` + schema unit tests green; manual curl of admin routes (dev) → gate + validation behave |
| Build & Test | full suite; coverage ≥ 80%; MANUAL-TEST-CHECKLIST complete; CI `INITIATIVE` updated |

## Rollback

- U3 only: revert `app/api/admin/**`, `lib/admin-auth.ts`, admin schema block,
  `.env.local.example`, `vitest.config.ts` line. Schema/content untouched.
- U2 only: revert frontend + gameplay route + `quiz-session.ts` + `translations.ts` (restore
  keys) + `playwright.config.ts`. DB untouched.
- U1: drop `subjects` / `subject_questions`; restore the original `quiz_history` CHECK
  (migration `0002` includes the prior constraint text in a comment for reversal).
