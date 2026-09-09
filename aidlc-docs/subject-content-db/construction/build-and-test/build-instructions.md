# Build Instructions — subject-content-db

## Prerequisites
- **Node** ≥ 20, and one of **bun** (CI), **pnpm** ≥ 12, or **npm** ≥ 10 for local dev
- **Supabase CLI** ≥ 2.117 (already a devDependency) — linked to project `eoelyqphaixgqlkyoxau`
- **Environment variables** (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and **new**: `ADMIN_EMAILS`
  (comma-separated admin email allowlist — unset disables the admin API). E2E needs
  `E2E_USERNAME` / `E2E_PASSWORD`.

## 1. Install dependencies — run for EVERY lockfile present

This initiative added `@testing-library/react` + `@testing-library/dom` (devDeps). All three
lockfiles have been updated in this branch (`bun.lock`, `pnpm-lock.yaml`, `package-lock.json`),
but re-run install to be safe:

```bash
bun install          # CI uses this (bun install --frozen-lockfile)
pnpm install         # if you use pnpm locally
npm install          # if you use npm locally
```

## 2. Apply the database migrations (once, out of band)

CI does **not** run migrations. Apply `0002` (schema) and `0003` (seed) to the linked
Supabase project:

```bash
supabase db push          # or: supabase migration up
```

Then verify (TC-M002): `subjects` has 7 rows; `subject_questions` has
shapes/colors/animals 10 each, vietnamese 3, english 10, grade2Vietnamese 50,
grade2English 50; the `quiz_history_category_check` constraint lists `grade2Vietnamese`
and `grade2English`.

## 3. Build

```bash
bun run build        # next build --webpack
```

Expected: "Compiled successfully"; the route list includes
`/api/subjects/[key]/questions`, `/api/admin/subjects`, `/api/admin/subject-questions`.

## 4. Lint & typecheck

```bash
bun run lint         # eslint . — expect 0 errors (warnings pre-exist)
bunx tsc --noEmit    # advisory — pre-existing errors in data/stickers.ts,
                     # lib/services/{canvas,player}.ts, debug-hook-test.ts are unrelated
```

## Troubleshooting
- **`bun install --frozen-lockfile` fails** — the lockfile is out of sync; run `bun install`
  (no flag) and commit `bun.lock`.
- **Build error `Cannot find module '@testing-library/...'`** — only affects tests; run the
  install step. It is a devDependency and does not ship in the bundle.
- **Quiz shows a Retry button in every content subject** — the migrations aren't applied to
  the environment the app points at. Run step 2.
