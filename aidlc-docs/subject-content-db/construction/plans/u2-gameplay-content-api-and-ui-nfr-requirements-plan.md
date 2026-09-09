# U2 NFR Requirements Plan — gameplay-content-api-and-ui

**Status**: Awaiting user answers
**Last updated**: 2026-09-09

Light stage. Confirms testing approach + records that the PBT framework is unchanged.

Finding from the codebase: there is **no React Testing Library** in the project, CI runs
`vitest run automation_tests/unit` **without** `--coverage`, and the existing component
tests (`learning-zone.test.ts`) only exercise *exported pure functions* from the component
files — JSX render paths are covered by **E2E**, not unit tests. So the vitest 80% coverage
threshold is not CI-enforced today.

---

## Answers
- Q1=**B** — add `@testing-library/react` + `@testing-library/dom` (React-19-compatible)
  as devDependencies; write `renderHook` hook tests + RTL component tests for `QuizModal`
  loading/error/empty states and the `LearningZone` content-subject path. `pickSessionQuestions`
  keeps its own pure unit + PBT tests.
- Q2=A — add the new E2E specs now; accept red until deploy (`e2e` job is `continue-on-error`)
- Q3=A — no new perf/a11y/bundle concern; `translations.ts` deletion shrinks the client bundle

## Plan — DONE
- [x] `nfr-requirements/nfr-requirements.md`
- [x] `nfr-requirements/tech-stack-decisions.md`

---

## Questions

### Q1 — Component / hook testing approach

A) **Match the existing project pattern — no new test deps.** Extract the hook's
   fetch-and-classify logic into a pure async helper `classifySubjectContentResponse()` /
   `loadSubjectContent(key, locale, fetchImpl)` and unit-test that with a fake `fetch`
   (idle/loading/ready/error/empty, cache, retry, stale-guard). `pickSessionQuestions` is
   already pure. `QuizModal` / `LearningZone` JSX branches are covered by the E2E specs
   (TC-E009–E017) and the modal's loading/error/empty states by TC-E013/E014 + a manual
   check for `quiz-empty`. *(Recommended — consistent with the repo, zero dependency risk)*

B) **Add `@testing-library/react` + `@testing-library/dom`** as devDependencies and write
   `renderHook` / RTL component tests for the hook and `QuizModal` states

C) Other (describe after [Answer]: tag)

[Answer]:B

### Q2 — The new E2E specs in CI

The CI `e2e` job runs Playwright against the deployed Vercel URL. New specs
(TC-E009–E017) will **fail until** U2 is deployed and `supabase db push` is run.

A) **Add them now; accept red until deploy.** The e2e job is already `continue-on-error:
   true` and only runs on push to `main`. The specs go green once the deploy + migration
   land. *(Recommended — matches how the prior initiative's e2e specs were added)*

B) **Add them behind a skip/tag** until the deploy is confirmed, then un-skip in a
   follow-up commit

C) Other (describe after [Answer]: tag)

[Answer]:A

### Q3 — Anything else (performance / a11y / bundle)

A) **No new concern.** One fetch per quiz open, ~50 small rows, session cache; the
   `translations.ts` deletion *reduces* bundle size. Document and move on. *(Recommended)*

B) I have a concern to capture (describe after [Answer]: tag)

[Answer]:A
