# Infrastructure Design Plan — Unit 1: SupabaseDBLayer

## Artifacts to Generate
- [x] infrastructure-design.md — component-to-infrastructure mapping
- [x] deployment-architecture.md — local and remote environments, apply sequence

---

## Infrastructure Category Assessment

| Category | Applicable? | Rationale |
|---|---|---|
| Deployment Environment | **Yes** | Local vs remote DB, env var sourcing |
| Compute Infrastructure | N/A | No compute services in this unit |
| Storage Infrastructure | Resolved | PostgreSQL 17 on Supabase cloud — decided in tech-stack-decisions.md |
| Messaging Infrastructure | N/A | No async messaging in DB layer |
| Networking Infrastructure | N/A | Supabase manages networking; no custom load balancer |
| Monitoring Infrastructure | N/A | Supabase dashboard; no custom alerting needed for DB infra |
| Shared Infrastructure | Resolved | `next.config.ts` applies to whole app — correct and already decided |

---

## Questions

### Question 1
Should a `.env.example` file be committed to the repository documenting the required
environment variables, so future developers know what to configure?

The three env vars needed across the project are:
- `NEXT_PUBLIC_SUPABASE_URL` — used by browser client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used by browser client
- `SUPABASE_SERVICE_ROLE_KEY` — used by API routes only (server-side)

`.env.local` (the actual secrets) is already git-ignored by Next.js defaults.

A) Yes — create `.env.example` with placeholder values (committed to git, no secrets)

B) No — document required vars in infrastructure-design.md only; no example file

[Answer]: A

---

### Question 2
Should local development use the Supabase local stack (via `supabase start`) or connect
directly to the remote cloud project?

A) Local stack — run `supabase start` (requires Docker) to spin up a local PostgreSQL +
   Auth instance; use `supabase db reset` to apply migrations locally.
   Pros: isolated local env, free iteration, no risk to remote data.
   Cons: requires Docker Desktop installed.

B) Remote only — skip local stack; always `supabase db push` to the linked remote project.
   Pros: simpler setup, no Docker needed.
   Cons: shared remote state; destructive migrations affect the real DB immediately.

[Answer]: B
