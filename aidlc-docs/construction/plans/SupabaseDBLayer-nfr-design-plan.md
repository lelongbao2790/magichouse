# NFR Design Plan — Unit 1: SupabaseDBLayer

## Artifacts to Generate
- [x] nfr-design-patterns.md — resilience, performance, security patterns applied to migration and schema
- [x] logical-components.md — infrastructure component inventory for this unit

---

## NFR Category Assessment

| Category | Applicable? | Rationale |
|---|---|---|
| Resilience Patterns | **Yes** | Migration SQL re-run safety is a genuine design decision |
| Scalability Patterns | N/A | No runtime component; DB scaling managed by Supabase platform |
| Performance Patterns | Resolved | Indexes decided in NFR Requirements (Q1=A) — no further ambiguity |
| Security Patterns | Resolved | RLS policies designed in business-rules.md; SECURITY-04 headers defined there |
| Logical Components | **Yes** | Need to enumerate infrastructure components this unit produces |

---

## Questions

### Question 1
Should the migration SQL use `IF NOT EXISTS` guards on `CREATE TABLE`, `CREATE INDEX`,
and `CREATE POLICY` statements?

The Supabase CLI tracks applied migrations in the `supabase_migrations` table and will
never re-run the same file in normal operation. However, `IF NOT EXISTS` guards protect
against the edge case where a DBA manually re-runs `psql -f 0001_initial_schema.sql`
during incident recovery, or where a partial migration failure leaves some objects created
and others not.

A) Yes — use `IF NOT EXISTS` on `CREATE TABLE` and `CREATE INDEX`; use `DROP POLICY IF EXISTS`
   before each `CREATE POLICY` for idempotent policy creation

B) No — rely on Supabase CLI migration tracking; no defensive guards needed (simpler SQL,
   clearer intent)

C) Other (please describe after [Answer]: tag below)

[Answer]: A
