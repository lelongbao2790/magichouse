# Build Instructions — Magic House (SupabaseBackendIntegration)

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Bundled with Node.js |
| Supabase CLI | 2.x | Already installed as devDependency (`supabase`) |
| Supabase project | — | Project ref: `eoelyqphaixgqlkyoxau` |

---

## Step 1 — Install Dependencies

```bash
npm install
```

**Expected output**: `added N packages` with no errors.

If `@supabase/ssr` or `@supabase/supabase-js` report peer dependency warnings, they are safe to ignore — both packages are already in `dependencies`.

---

## Step 2 — Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in `.env.local` with real values from the Supabase dashboard (project `eoelyqphaixgqlkyoxau`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://eoelyqphaixgqlkyoxau.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from API settings>
   SUPABASE_SERVICE_ROLE_KEY=<service role key from API settings>
   ```
   > **Security**: `SUPABASE_SERVICE_ROLE_KEY` must never be committed or prefixed with `NEXT_PUBLIC_`.

---

## Step 3 — Apply Database Migration

```bash
npx supabase db push
```

This applies the SQL migration at `supabase/migrations/` which creates:
- `players` table with RLS
- `stickers` table with seed data (16 stickers)
- `player_stickers` junction table with RLS
- `quiz_history` table with RLS
- `player_canvas` table with RLS

**Verify**: Tables appear in Supabase Studio → Table Editor.

---

## Step 4 — Generate TypeScript Types (Optional)

After applying the migration, regenerate types to verify they match the live schema:

```bash
npx supabase gen types typescript --project-id eoelyqphaixgqlkyoxau --schema public > lib/database.types.ts
```

> **Note**: The pre-generated `lib/database.types.ts` should already match. Only re-run if you modify the schema.

---

## Step 5 — TypeScript Compilation Check

```bash
npx tsc --noEmit
```

**Expected output**: No errors. Warnings are acceptable.

Common errors to watch for:
- `Type 'X' is not assignable to type 'Y'` — interface mismatch between units
- `Cannot find module '@/...'` — check `tsconfig.json` path aliases
- `StickerItem` still referenced somewhere — old type removed from `coin-context.tsx`

---

## Step 6 — ESLint Check

```bash
npm run lint
```

**Expected output**: No errors.

Acceptable warnings:
- `react-hooks/exhaustive-deps` in `creative-room.tsx` for the debounced save effect (intentional)

---

## Step 7 — Development Build Verification

```bash
npm run dev
```

**Expected**: Next.js dev server starts on `http://localhost:3000` with no compilation errors in the terminal or browser console.

Verify manually:
- [ ] Home page loads `WelcomeScreen` (sign in / sign up forms)
- [ ] Sign up creates player row in Supabase (check Studio)
- [ ] Sign in navigates to `Dashboard` showing player name
- [ ] Dashboard shows correct player name from `useAuth()`

---

## Step 8 — Production Build

```bash
npm run build
```

**Expected output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
Route (app) ...
```

Build artifacts generated in `.next/`. No output files in `aidlc-docs/`.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Module not found: '@supabase/ssr'` | Not installed | `npm install` |
| `TypeError: cookies() should be awaited` | Missing `await` on cookies() | Check `lib/supabase/server.ts` |
| `NEXT_PUBLIC_SUPABASE_URL is required` | Missing `.env.local` | `cp .env.local.example .env.local` |
| TypeScript errors on `StickerItem` | Old type import | Remove remaining `StickerItem` references |
| `JWT expired` in API responses | Session expired | Sign in again |
