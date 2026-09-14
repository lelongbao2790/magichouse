# Code Quality Assessment

> **Carried forward 2026-09-11** from `subject-content-db`'s reverse engineering (unchanged since
> 2026-09-09 — no source code changed in between).

## Test Coverage
- **Overall**: Moderate — key business logic covered
- **Unit Tests**: Present for question generators, quiz session, subject content, admin auth/validation
- **Property-Based Tests**: Present via fast-check (multiple `*.pbt.test.ts` files)
- **E2E Tests**: Smoke tests + grade2-subjects + subject-content specs (Chromium only)
- **API Tests**: Present — quiz history, subject content, subject questions route

## Test Infrastructure

> **Refreshed 2026-09-11**: `automation_tests/api/` now has real tests (shipped by
> `subject-content-db`) — no longer a placeholder.

| Folder | Status | Framework |
|---|---|---|
| automation_tests/unit/ | has tests | Vitest |
| automation_tests/api/ | has tests | Vitest (direct route-handler invocation) |
| automation_tests/e2e/ | has tests | Playwright (Chromium only) |

## Code Quality Indicators
- **Linting**: ESLint configured (eslint.config.mjs, eslint-config-next)
- **Type Safety**: Full TypeScript with strict types
- **Code Style**: Consistent — functional components, named exports, service layer separation
- **Documentation**: Minimal inline comments; self-documenting via naming

## Technical Debt (refreshed 2026-09-09)
- **Quiz content is 100% hardcoded** in `data/translations.ts` (~500 lines) and
  re-assembled inline in `components/learning-zone.tsx`. No DB table, no API, no CMS path.
- **`correctIndex` drift risk**: the correct-answer index for every content-based quiz is
  a literal in the `learning-zone.tsx` array, physically separated from the option text in
  `translations.ts`. Editing options without updating the component silently breaks scoring.
- **Language-vs-content conflation**: `t()` resolves quiz questions with the UI locale, so
  the Vietnamese subject renders in English when UI = English (user-reported bug). See
  `subject-content-findings.md` §2.
- **Content volume is thin**: Grade 1 Vietnamese = 3 questions; Grade 2 VN/EN = 15 each
  (10 shown). User wants substantially more.
- `quiz_history.category` DB `CHECK` constraint omits `grade2Vietnamese` / `grade2English`
  (added to TS + Zod but not the migration) — silent server-side insert failures.
- `.github/workflows/ci.yml` hardcodes `INITIATIVE: grade2-subjects-coin-rewards` for
  report paths — new initiative reports would need a CI tweak or will reuse that path.

## Resolved since prior analysis
- `coinsEarned` is no longer hardcoded — computed via `lib/coin-rewards.ts`.
- Grade 2 now has a two-level subject navigation (`components/grade2-subject-view.tsx`).

## Patterns and Anti-patterns

### Good Patterns
- Service layer isolation (lib/services/) separates DB from UI
- Zod validation at API boundaries
- RLS-enforced data isolation per user
- Context + custom hook pattern for state
- Idempotent SQL migrations (IF NOT EXISTS guards)

### Anti-patterns
- Coin amount duplicated: hardcoded both in quiz history POST body and in onQuizComplete → addCoins call (two separate places that must stay in sync)
- Grade 2 categories have no data structure for subject grouping — all UI organization is purely in the component array definitions
