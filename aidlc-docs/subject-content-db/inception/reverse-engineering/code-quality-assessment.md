# Code Quality Assessment

## Test Coverage
- **Overall**: Moderate — key business logic covered
- **Unit Tests**: Present for question generators (learning-zone.test.ts)
- **Property-Based Tests**: Present via fast-check (learning-zone.pbt.test.ts)
- **E2E Tests**: Smoke tests present (automation_tests/e2e/smoke.spec.ts)
- **API Tests**: Placeholder only (automation_tests/api/.gitkeep)

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
