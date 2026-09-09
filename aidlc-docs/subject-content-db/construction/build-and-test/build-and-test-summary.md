# Build and Test Summary — subject-content-db

**Status**: Approved (user, 2026-09-09)
**Last updated**: 2026-09-09

---

## Build Status

| | |
|---|---|
| **Build tool** | Next.js 16.2.0 (`next build --webpack`) |
| **Build status** | ✅ Success |
| **New routes registered** | `/api/subjects/[key]/questions`, `/api/admin/subjects`, `/api/admin/subject-questions` |
| **Lint** | ✅ `eslint .` — 0 errors, 14 warnings (12 pre-existing + 2 new `react-hooks/set-state-in-effect`, which the repo's eslint config downgrades to `warn`) |
| **Typecheck** | ✅ clean for all new/changed files (`tsc --noEmit`). Pre-existing unrelated errors remain in `data/stickers.ts`, `lib/services/{canvas,player}.ts`, `debug-hook-test.ts` (CI runs `tsc` advisory-only). |
| **Lockfiles** | ✅ `bun.lock`, `pnpm-lock.yaml`, `package-lock.json` all updated with `@testing-library/react` + `@testing-library/dom` |

## Test Execution Summary

### Unit + API tests (Vitest)
| | |
|---|---|
| **Total** | **175** |
| **Passed** | 175 |
| **Failed** | 0 |
| **Files** | 16 (`automation_tests/unit` + `automation_tests/api`) |
| **New this initiative** | ~120 (10 new files + additions) |
| **Status** | ✅ Pass |

### Property-Based tests (fast-check — blocking)
| Group | Property | Status |
|---|---|---|
| PBT-B | `resolveQuestion`: `fixed` subject output independent of UI locale; `localized` follows locale; options length 3 / index range; corrupted row throws | ✅ |
| PBT-C | `rowToDto` → `dtoToWritePayload` round-trip preserves persisted fields | ✅ |
| PBT-A | `pickSessionQuestions`: size = `min(n, pool)`; subset; no dup ids; pass-through integrity; exact difficulty histogram when buckets rich; determinism for a fixed seed | ✅ |
| U3 | `validateModeCoverage`: fixed target-only ok / other-locale throws; localized complete ok / missing throws | ✅ |
| **Total PBT** | | **14 tests, all pass** |

### E2E tests (Playwright — Chromium)
| | |
|---|---|
| **New** | `subject-content.spec.ts` — TC-E009–E017 (9 cases) |
| **Existing** | `grade2-subjects.spec.ts` TC-E001–E007 (unchanged), `smoke.spec.ts` TC-E008 |
| **Status** | ⏳ **Not run** — require a deployed environment with the `0002`/`0003` migrations applied. Expected green post-deploy (Q2=A). The CI `e2e` job is `continue-on-error: true`. |

### API tests
| | |
|---|---|
| **Coverage** | `GET /api/subjects/[key]/questions` full contract (401/400/404/500/shape), language-resolution invariants, migration CHECK text |
| **Admin routes** | No automated route tests (CL2=C — user-approved). `isAdminEmail` + `validateModeCoverage` + Zod schemas unit-tested; routes verified by TC-M003. `app/api/admin/**` excluded from coverage globs. |
| **Status** | ✅ Pass |

### Manual verification (TC-M)
`MANUAL-TEST-CHECKLIST.md` at the repo root — **5 items**, all pending (require deploy):
- TC-M001 content review of the ~100 authored Grade 2 questions
- TC-M002 migration applied + row counts
- TC-M003 admin allowlist gate + CRUD on the deployed env
- TC-M004 Vietnamese subject in Vietnamese with UI in English (deployed)
- TC-M005 coins + `quiz_history` for all quiz types (deployed; incl. the constraint fix)

### Coverage
- `bun run test:coverage` (threshold `lines: 80`): **not met (~30%)** and **not met before
  this initiative** — a pre-existing structural gap; the coverage `include` globs span many
  untested legacy routes/components. **Not enforced in CI** (the `unit` job runs `vitest
  run` without `--coverage`).
- New logic modules `lib/subject-content/*`, `lib/quiz-session.ts`, `lib/hooks/*`,
  `lib/admin-auth.ts`, `lib/admin-guard.ts` sit outside the current `include` globs but are
  each covered by a dedicated test file.
- **Open item**: if coverage is to become meaningful/enforced, extend the `include` globs
  to the new `lib/` dirs and address the legacy gap — out of scope for this initiative.

## PBT Compliance (Property-Based Testing extension — full/blocking)

| Rule | Status |
|---|---|
| PBT-01 property identification | ✅ in each unit's `business-logic-model.md` "Testable Properties" |
| PBT-02 round-trip | ✅ PBT-C |
| PBT-03 invariant | ✅ PBT-A, PBT-B, U3 coverage properties |
| PBT-04 idempotency | N/A — no app-logic operation claims idempotency |
| PBT-05 oracle | N/A — no reference implementation |
| PBT-06 stateful | N/A — pure functions; the hook's state machine is example-tested |
| PBT-07 generators | ✅ `automation_tests/unit/_arbitraries.ts` + per-file arbitraries |
| PBT-08 shrink & seed | ✅ fast-check default shrinking enabled; failing seed + shrunk input printed to the CI verbose reporter output. To pin: `FASTCHECK_SEED` / `fc.configureGlobal({ seed })`. |
| PBT-09 framework | ✅ fast-check `^3.22.0` (devDependency) |
| PBT-10 complementary | ✅ example-based tests alongside every PBT file |

**No blocking PBT findings.**

## CI changes
- `.github/workflows/ci.yml`: `INITIATIVE` env var `grade2-subjects-coin-rewards` →
  `subject-content-db`; the Pages index card text refreshed for this initiative.
- `playwright.config.ts`: `projects` → `[chromium]` only.
- `vitest.config.ts`: coverage `include` gains `"!app/api/admin/**"`.

## Overall Status

| | |
|---|---|
| **Build** | ✅ Success |
| **Automated tests (unit + api + PBT)** | ✅ 175/175 pass |
| **E2E** | ⏳ deferred to post-deploy (accepted) |
| **Manual checklist** | ⏳ 5 items pending deploy |
| **Ready for Operations** | ✅ code-complete. **Release depends on**: (1) `supabase db push`, (2) `ADMIN_EMAILS` set in the deploy env, (3) working through `MANUAL-TEST-CHECKLIST.md` after CI is green on main. |

## Next Steps
1. Merge the branch → CI runs lint + unit + api (green) and, on main, E2E (may be red one cycle).
2. Set `ADMIN_EMAILS` in the Vercel project env.
3. `supabase db push` against `eoelyqphaixgqlkyoxau`.
4. Deploy.
5. Work through `MANUAL-TEST-CHECKLIST.md` (TC-M001–TC-M005).
