# Infrastructure Design — Unit 1: SupabaseDBLayer

## Component-to-Infrastructure Mapping

| Logical Component | Type | Infrastructure Service | Location |
|---|---|---|---|
| `0001_initial_schema.sql` | SQL migration | Supabase PostgreSQL 17 | Remote: `eoelyqphaixgqlkyoxau` |
| `seed.sql` | SQL seed | Supabase PostgreSQL 17 | Remote: `eoelyqphaixgqlkyoxau` |
| `lib/database.types.ts` | Generated TypeScript | Supabase CLI type generator | Local workspace |
| `next.config.ts` (headers) | Next.js config | Next.js server (Vercel / local) | Runtime: all environments |
| `.env.example` | Env var template | Git repository | Committed — no secrets |
| `.env.local` | Env var secrets | Local filesystem | Git-ignored; never committed |

---

## Environment Variables

### Required Variables

| Variable | Scope | Source | Used By |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser + server) | Supabase Dashboard → Project Settings → API | Units 2–4 (client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) | Supabase Dashboard → Project Settings → API | Units 2–4 (browser client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (secret) | Supabase Dashboard → Project Settings → API | Units 2–3 (API routes) |

### Where to Find Values
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → project `magichouse`
2. Navigate to **Project Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### `.env.example` (committed to git)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### `.env.local` (git-ignored, actual secrets)
Copy `.env.example` → `.env.local` and fill in real values from the Supabase dashboard.

---

## Infrastructure Services Summary

### Supabase Cloud (Remote — `eoelyqphaixgqlkyoxau`)
- **Engine**: PostgreSQL 17
- **Auth**: Supabase Auth (email/password; email confirmation disabled)
- **Encryption**: AES-256 at rest, TLS 1.3 in transit (platform-managed)
- **Backups**: Daily automatic (Supabase Pro)
- **Uptime SLA**: 99.9%
- **CLI link**: Already established via `supabase link --project-ref eoelyqphaixgqlkyoxau`

### Next.js Runtime (Local dev / Vercel production)
- **Security headers**: Applied via `next.config.ts` `headers()` function to all routes
- **Config scope**: `source: "/(.*)"` — every HTTP response

### Supabase CLI (Local tooling)
- **Version**: `^2.116.0` (pinned in `devDependencies`)
- **Migration apply**: `npx supabase db push` → remote
- **Type generation**: `npx supabase gen types typescript --project-id eoelyqphaixgqlkyoxau --schema public > lib/database.types.ts`

---

## Security Compliance

| SECURITY Rule | Status | Infrastructure Decision |
|---|---|---|
| SECURITY-01 | Compliant | Supabase cloud: TLS 1.3 + AES-256 at rest |
| SECURITY-04 | Compliant | HTTP headers via `next.config.ts` |
| SECURITY-09 | Compliant | `.env.example` uses placeholder values only; `.env.local` git-ignored |
| SECURITY-10 | Compliant | Supabase CLI pinned; lock file committed |
