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

## Technical Debt
- `coinsEarned: 10` hardcoded in `components/learning-zone.tsx:274` — no difficulty-based calculation
- Grade 2 categories are a flat array with no subject grouping concept in the data model
- `quiz_history.category` enum in the database does not include subject-level categories — only leaf-level practices (addition, subtraction, timesTable)
- `data/translations.ts` has `quiz.claimCoins` and `quiz.earnCoins` with hardcoded "10 Xu" / "10 Coins" text that will need updating

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
