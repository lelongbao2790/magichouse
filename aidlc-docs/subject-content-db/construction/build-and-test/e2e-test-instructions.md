# E2E Test Instructions — subject-content-db

Playwright, **Chromium only** (`playwright.config.ts` `projects` reduced this initiative).

## Run

```bash
# local (against a dev server with the migration applied):
bun run dev &
npx wait-on http://localhost:3000
bun run test:e2e            # playwright test  (chromium)

# CI runs against the deployed Vercel URL (PLAYWRIGHT_BASE_URL), on push to main only.
```

## Specs

| File | Cases |
|---|---|
| `automation_tests/e2e/subject-content.spec.ts` | **TC-E009** UI=en → G2 Vietnamese shows Vietnamese; **TC-E010** UI=en → G2 English shows English; **TC-E011** preschool follows UI locale; **TC-E012** language switch mid-quiz doesn't change questions; **TC-E013** loading → 10 questions; **TC-E014** API failure → error + Retry, no quiz; **TC-E015** full quiz → results + coins; **TC-E016** math practice regression; **TC-E017** preschool quiz regression |
| `automation_tests/e2e/grade2-subjects.spec.ts` | (existing, unchanged) TC-E001–E007 — Grade 2 navigation. Not modified: none of these open a content-subject quiz, so the async-load change doesn't affect them. |
| `automation_tests/e2e/smoke.spec.ts` | (existing) TC-E008 — browser-launch sanity |

## Preconditions

- `E2E_USERNAME` / `E2E_PASSWORD` for a real account.
- **The `0002` + `0003` migrations must be applied** to the environment the E2E target
  points at. Until then, TC-E009–E015/E017 fail at the loading step (the questions API
  500s → Retry UI). TC-E014 (which forces a 500 via route interception) and TC-E016 (math,
  generated) pass regardless.
- New `data-testid`s the specs rely on: `quiz-loading`, `quiz-error`, `quiz-retry-button`
  (added to `components/quiz-modal.tsx`). `coin-value` (pre-existing) is used for the coin
  assertion.

## Expected

Once U2 is deployed and the migrations are applied: **all TC-E009–E017 pass on Chromium**.
The CI `e2e` job is `continue-on-error: true` and runs only on push to `main`, so it may be
red for one cycle between the merge and the migration/deploy (Q2=A, accepted).

## After CI passes on main

The developer must complete **every item in `MANUAL-TEST-CHECKLIST.md`** (TC-M001–TC-M005)
before the deploy is considered done.
