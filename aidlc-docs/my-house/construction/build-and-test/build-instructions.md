# Build Instructions — my-house

## Prerequisites
- **Build Tool**: Next.js 16.2.0 (`next build --webpack`)
- **Dependencies**: none new — this initiative added zero npm packages (confirmed:
  `package.json` unchanged)
- **Environment Variables**: none new — uses the existing Supabase project env vars already
  configured (`.env.local`)
- **System Requirements**: Node.js (matches repo's existing `engines`, if any), no new system
  dependency

## Build Steps

### 1. Install Dependencies
```bash
npm install     # package-lock.json present
```
`pnpm` and `bun` binaries were not available in this build environment, so
`pnpm-lock.yaml`/`bun.lock` could not be regenerated here — but since `package.json` is
unmodified (verified via `git diff package.json` — no output), neither lockfile needs updating.
Anyone running this on a machine with `pnpm`/`bun` installed can confirm with
`pnpm install --frozen-lockfile` / `bun install --frozen-lockfile`, which should succeed with no
changes.

### 2. Configure Environment
No new environment variables. Existing `.env.local` (Supabase URL/keys) is sufficient.

### 3. Build All Units
```bash
npm run build
```

### 4. Verify Build Success
- **Expected Output**: `✓ Compiled successfully`, followed by the route manifest.
- **New routes confirmed in the manifest**: `ƒ /api/house-items`, `ƒ /api/players/house-items`,
  `ƒ /api/players/house-layout`, `ƒ /api/rooms`.
- **Build Artifacts**: `.next/` (standard Next.js output).
- **Common Warnings**: none observed for this build.

## Actual Result (this session)
✅ **Success** — `npm run build` completed cleanly; all 4 new API routes registered.

## Troubleshooting

### Build Fails with Dependency Errors
- **Cause**: stale `node_modules` after a lockfile change elsewhere.
- **Solution**: `rm -rf node_modules && npm install`.

### Build Fails with Compilation Errors
- **Cause**: a schema/type mismatch between `lib/database.types.ts` and actual Supabase schema
  after `supabase db push` (types are hand-written here, not `supabase gen types` output, per
  this repo's existing convention — see the comment at the top of `lib/database.types.ts`).
- **Solution**: re-run `npx supabase gen types typescript --project-id eoelyqphaixgqlkyoxau
  --schema public > lib/database.types.ts` after applying `0004_house_items_schema.sql`, then
  reconcile with the hand-written additions from this initiative if they diverge.
