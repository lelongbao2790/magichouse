# Logical Components — Unit 1: SupabaseDBLayer

## Component Inventory

This unit produces static artifacts only — no runtime components, no queues, caches, or
background workers. All infrastructure is managed by the Supabase platform.

| Component | Type | Output Path | Purpose |
|---|---|---|---|
| Initial Schema Migration | SQL file | `supabase/migrations/0001_initial_schema.sql` | Creates all 5 tables, indexes, RLS, trigger, pgcrypto extension |
| Sticker Seed | SQL file | `supabase/seed.sql` | Inserts all 22 sticker catalog rows (idempotent) |
| Database Types | Generated TypeScript | `lib/database.types.ts` | Typed `Database` interface for all tables and columns |
| Security Headers Config | Next.js config | `next.config.ts` | HTTP security headers applied to all routes |

---

## No Runtime Infrastructure Required

| Infrastructure Type | Status | Reason |
|---|---|---|
| Message queue / job queue | Not needed | No async jobs in DB layer |
| Cache layer (Redis, etc.) | Not needed | Supabase handles connection pooling; query response times meet targets without caching |
| Circuit breaker | Not needed | No outbound calls from DB layer |
| CDN / edge config | Not needed | Static assets handled elsewhere; no DB-level CDN requirement |
| Replication / read replicas | Not needed | Supabase Pro includes this at platform level; no application-level config required |

---

## Supabase Platform Components (Managed — No Config Required)

| Platform Component | Used By | Notes |
|---|---|---|
| PostgreSQL 17 | All tables | Managed; version pinned in `supabase/config.toml` |
| pgcrypto extension | `quiz_history.id` | `gen_random_uuid()` — must be explicitly enabled in migration |
| Supabase Auth | `players.id` foreign key | `auth.users.id` is the source of truth for player identity |
| Supabase CLI | Migration apply | `supabase db push` (remote) / `supabase db reset` (local) |
| `supabase_migrations` table | Re-run prevention | Tracks which migration files have been applied |

---

## Execution Flow (Migration Apply)

```
Developer runs: supabase db push
    │
    ├─ Supabase CLI checks supabase_migrations table
    ├─ Identifies 0001_initial_schema.sql as unapplied
    ├─ Executes SQL against remote PostgreSQL 17
    │   ├─ CREATE EXTENSION IF NOT EXISTS pgcrypto
    │   ├─ CREATE TABLE IF NOT EXISTS players / stickers / player_stickers / creative_canvas / quiz_history
    │   ├─ CREATE INDEX IF NOT EXISTS (3 FK indexes)
    │   ├─ ALTER TABLE ... ENABLE ROW LEVEL SECURITY (5 tables)
    │   ├─ DROP POLICY IF EXISTS + CREATE POLICY (5 policies)
    │   └─ CREATE OR REPLACE FUNCTION + CREATE TRIGGER (updated_at)
    └─ Records migration in supabase_migrations

Developer runs: npx supabase gen types typescript --project-id eoelyqphaixgqlkyoxau --schema public > lib/database.types.ts
    └─ Generates typed Database interface from live schema
```

---

## Dependency Map

```
0001_initial_schema.sql
    └─ depends on: pgcrypto extension (enabled in same file, first statement)

seed.sql
    └─ depends on: stickers table (created by 0001_initial_schema.sql)

lib/database.types.ts
    └─ depends on: live schema (generated after migration applied)
    └─ consumed by: lib/services/*.ts (Units 2–3), lib/supabase/server.ts (Unit 4)

next.config.ts
    └─ standalone: no DB dependency
    └─ consumed by: Next.js build (all units)
```

---

## Security Compliance Summary

| SECURITY Rule | Status | Notes |
|---|---|---|
| SECURITY-01 | Compliant | TLS/AES-256 enforced by Supabase platform |
| SECURITY-04 | Compliant | HTTP headers in `next.config.ts` (produced by this unit) |
| SECURITY-06 | Compliant | RLS + IF NOT EXISTS idempotency pattern in `nfr-design-patterns.md` |
| SECURITY-09 | Compliant | No default credentials; seed data is catalog-only (no PII) |
| SECURITY-10 | Compliant | `supabase` CLI pinned in devDependencies; lock file committed |
| All others | N/A | Apply to API route handlers (Units 2–3) or auth logic (Unit 2) |
