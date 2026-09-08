# Build Instructions — grade2-subjects-coin-rewards

## Prerequisites
- **Build Tool**: Bun 1.4.1 (primary), pnpm 11.25.0 (secondary)
- **Runtime**: Node.js 20+
- **Framework**: Next.js 16.2 / TypeScript 5.7.3
- **Environment Variables**: `.env.local` with Supabase URL and anon key

## Build Steps

### 1. Install Dependencies
```bash
bun install        # updates bun.lock
pnpm install       # updates pnpm-lock.yaml
```
Both lockfiles must stay in sync. Run both commands.

### 2. TypeScript Check
```bash
bun run tsc --noEmit
```
**Expected**: Exit 0 or exit 1 with only pre-existing errors in:
- `lib/services/canvas.ts` (Json/CanvasItem type mismatch — pre-existing)
- `lib/services/player.ts` (missing `updated_at` — pre-existing)
- `data/stickers.ts` (missing export — pre-existing)
- `debug-hook-test.ts` (missing module — pre-existing)

Any errors in the new/modified files (`lib/coin-rewards.ts`, `components/quiz-modal.tsx`, `components/learning-zone.tsx`, `components/grade2-subject-view.tsx`, `components/dashboard.tsx`, `data/translations.ts`, `lib/validation/api.ts`, `lib/database.types.ts`) are regressions that must be fixed.

### 3. Run Unit Tests
```bash
bun test automation_tests/unit/
```
**Expected**: 68 pass, 0 fail

### 4. Production Build (optional — requires .env.local)
```bash
bun run build
```
**Expected**: Successful Next.js production build in `.next/`

## Troubleshooting

### TypeScript errors in new files
- Verify `Difficulty` is imported from `@/lib/coin-rewards` (not inline defined)
- Verify `onComplete` prop signature in `QuizModal` matches all call sites

### Test failures
- Run `bun test automation_tests/unit/coin-rewards.test.ts` to isolate
- PBT failures include a seed — re-run with that seed to reproduce
