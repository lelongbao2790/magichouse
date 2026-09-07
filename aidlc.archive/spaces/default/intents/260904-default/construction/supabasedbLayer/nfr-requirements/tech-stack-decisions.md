# Tech Stack Decisions — Unit 1: SupabaseDBLayer

## Database Engine

| Decision | Choice | Rationale |
|---|---|---|
| Database | PostgreSQL 17 | Already configured in `supabase/config.toml`; matches remote project version |
| Hosting | Supabase cloud (linked project: `eoelyqphaixgqlkyoxau`) | Already linked via CLI; provides managed auth, storage, realtime, auto-backups |
| Extension | `pgcrypto` | Required for `gen_random_uuid()` used as default PK on `quiz_history` |

---

## Migration Tooling

| Decision | Choice | Rationale |
|---|---|---|
| Migration tool | Supabase CLI migrations | Already in project (`supabase` v2.116.0 in devDependencies); tracks applied files in `supabase_migrations` table |
| Migration structure | Single file (`0001_initial_schema.sql`) | Entire initial schema in one place; future changes get new numbered files |
| Apply command (local) | `supabase db reset` | Drops + recreates local DB, applies migrations, runs seed |
| Apply command (remote) | `supabase db push` | Applies pending migrations to linked cloud project |

---

## Seed Tooling

| Decision | Choice | Rationale |
|---|---|---|
| Seed file | `supabase/seed.sql` | Standard Supabase seed path; auto-run on `supabase db reset` |
| Idempotency | `ON CONFLICT (id) DO NOTHING` | Safe to re-run; does not fail or duplicate if stickers already seeded |

---

## Type Generation

| Decision | Choice | Rationale |
|---|---|---|
| Type generator | `supabase gen types typescript` | Official CLI tool; generates fully typed `Database` interface from live schema |
| Output | `lib/database.types.ts` | Conventional location; imported by all service files |
| Regeneration trigger | Any schema migration | Must re-run after each new migration to keep types in sync |

```bash
# Command to regenerate types (run after applying migrations)
npx supabase gen types typescript \
  --project-id eoelyqphaixgqlkyoxau \
  --schema public \
  > lib/database.types.ts
```

---

## Security Headers

| Decision | Choice | Rationale |
|---|---|---|
| Implementation | `next.config.ts` `headers()` function | Native Next.js approach; no additional middleware package needed |
| Scope | All routes (`source: "/(.*)"`) | Applies to every response from the Next.js server |

---

## Not Used (and Why)

| Alternative | Reason Not Used |
|---|---|
| Prisma / Drizzle ORM | Supabase JS SDK with generated types provides sufficient type safety; ORM adds complexity without benefit here |
| Manual SQL client (pg) | Supabase SDK wraps pg and adds auth-awareness; no reason to use raw pg directly |
| Multiple migration files | Single file is simpler for initial schema; splitting adds overhead with no rollback benefit at this scale |
| `uuid_generate_v4()` | Requires `uuid-ossp` extension; `gen_random_uuid()` from `pgcrypto` is equivalent and already available in Supabase |
