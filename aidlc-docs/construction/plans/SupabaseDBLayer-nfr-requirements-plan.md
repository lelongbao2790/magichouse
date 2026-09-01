# NFR Requirements Plan — Unit 1: SupabaseDBLayer

## Artifacts to Generate
- [x] nfr-requirements.md — performance, security, reliability, maintainability NFRs
- [x] tech-stack-decisions.md — technology choices and rationale

---

## NFR Assessment

Most NFRs for this unit are satisfied by Supabase cloud defaults
(TLS in transit, AES-256 at rest, 99.9% uptime SLA, automatic backups).
The two genuine decisions below require your input.

---

## Questions

### Question 1
Should explicit indexes be added to the migration beyond what PostgreSQL creates automatically for primary keys?

PostgreSQL auto-creates indexes on PKs and unique constraints. For FKs like `player_stickers.player_id`
and `quiz_history.player_id`, explicit indexes improve lookup speed when fetching
a player's stickers or history.

A) Yes — add explicit indexes on foreign key columns:
   - `player_stickers(player_id)`
   - `creative_canvas(player_id)` — already PK, no extra needed
   - `quiz_history(player_id)`
   - `quiz_history(completed_at DESC)` — speeds up history ordered by date

B) No — rely on PostgreSQL defaults only; add indexes later if performance data shows a need

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
Should the migration be a single file or split into multiple files?

A) Single file — one `0001_initial_schema.sql` containing all tables, triggers, RLS, and policies
   (simpler for a greenfield schema; everything visible in one place)

B) Multiple files — separate migrations per concern:
   `0001_create_tables.sql`, `0002_rls_policies.sql`, `0003_triggers.sql`
   (more granular rollback; clearer git blame per concern)

C) Other (please describe after [Answer]: tag below)

[Answer]: A
