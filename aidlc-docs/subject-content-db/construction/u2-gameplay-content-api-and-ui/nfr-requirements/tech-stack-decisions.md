# Tech Stack Decisions — U2 gameplay-content-api-and-ui

## New dependencies (Q1=B)

| Package | Type | Version target | Why |
|---|---|---|---|
| `@testing-library/react` | devDependency | `^16` (React 19 compatible) | `renderHook` for `useSubjectQuestions`; RTL render tests for `QuizModal` states and `LearningZone` |
| `@testing-library/dom` | devDependency | `^10` | peer of `@testing-library/react` |

- Installed with **both** package managers' lockfiles updated (`bun.lock` **and**
  `package-lock.json` / `pnpm-lock.yaml` if present) — Build & Test step handles this
  (never `--frozen-lockfile` during install there).
- `@testing-library/jest-dom` is **not** added — assertions use Vitest's built-in
  `expect` + DOM queries; `screen.getByTestId(...)` + `.textContent` is enough.
- `vitest.config.ts` already sets `environment: "jsdom"` and `globals: true` — no config
  change needed for RTL. (`setupFiles: []` stays; RTL auto-cleanup is imported per-file or
  a tiny `afterEach(cleanup)` is added where used.)

## Unchanged

| Concern | Decision |
|---|---|
| PBT framework (PBT-09) | fast-check `^3.22.0` (already present) — used for `pickSessionQuestions` PBT-A |
| HTTP | native `fetch` (same-origin relative URL) — no client added |
| API route | Next.js App Router route handler + `createServerClient` + `apiSuccess`/`apiError` (existing pattern) |
| Validation | `zod` `LocaleSchema` (added in U1) |
| State | React `useState` + `useEffect` + module-level `Map` cache (no state library) |
| i18n | existing `useLanguage()` / `t()` — 4 new `quiz.*` chrome keys added to `translations.ts` |
| E2E | Playwright, **Chromium only** (`playwright.config.ts` `projects` reduced — CL4=B) |

## PBT compliance (U2)

`business-logic-model.md` §5 — PBT-01 ✅ (TP-A1..A6), PBT-03 ✅, PBT-07 ✅, PBT-08 ✅
(CI seed), PBT-09 ✅ (fast-check), PBT-10 ✅. PBT-02/04/05/06 N/A with rationale.
