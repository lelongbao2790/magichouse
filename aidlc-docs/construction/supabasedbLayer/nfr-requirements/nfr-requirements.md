# NFR Requirements — Unit 1: SupabaseDBLayer

## Security (SECURITY BASELINE — All Rules Enforced)

| Rule | Status | Implementation |
|---|---|---|
| SECURITY-01 | Compliant | Supabase cloud: AES-256 at rest, TLS 1.3 in transit — enforced by platform, no config needed |
| SECURITY-06 | Compliant | RLS policies restrict each player to their own rows; catalog readable by authenticated role only |
| SECURITY-07 | N/A | No custom VPC or security groups — Supabase managed network |
| SECURITY-09 | Compliant | Migration SQL contains no default credentials; no sample data with PII |
| SECURITY-10 | Compliant | `package-lock.json` committed; `supabase` CLI pinned in `devDependencies` |

All other SECURITY rules (02-05, 08, 11-15) apply to API route handlers (Units 2-3), not to this DB infrastructure unit — marked N/A for this stage.

---

## Performance

| Requirement | Target | Approach |
|---|---|---|
| Migration execution | < 60 seconds | Single file; all DDL is simple CREATE TABLE + policy statements |
| Seed execution | < 5 seconds | 22 INSERT rows — trivially fast |
| Type generation | < 30 seconds | Single schema query via Supabase CLI |
| Player sticker lookup | < 20 ms p99 | Explicit index on `player_stickers(player_id)` |
| Quiz history lookup | < 20 ms p99 | Explicit index on `quiz_history(player_id)` |
| Quiz history ordered by date | < 20 ms p99 | Explicit index on `quiz_history(completed_at DESC)` |

### Indexes to Create

```sql
-- player_stickers: fast lookup of all stickers for a player
CREATE INDEX idx_player_stickers_player_id ON player_stickers(player_id);

-- quiz_history: fast lookup of history for a player, ordered by date
CREATE INDEX idx_quiz_history_player_id ON quiz_history(player_id);
CREATE INDEX idx_quiz_history_completed_at ON quiz_history(completed_at DESC);
```

`creative_canvas.player_id` is already the primary key — no additional index needed.
`players.id` is a primary key — auto-indexed.
`stickers.id` is a primary key — auto-indexed.

---

## Reliability

| Requirement | Approach |
|---|---|
| Migration idempotency | Supabase tracks applied migrations in `supabase_migrations` table; each file runs at most once |
| Seed idempotency | `INSERT ... ON CONFLICT (id) DO NOTHING` — safe to run multiple times |
| Migration rollback | No automatic rollback; rollback requires a new migration that reverses changes (standard Supabase practice) |
| Data integrity | 7 DB-level invariants enforced via CHECK constraints and FK cascades (see business-rules.md) |

---

## Availability

| Requirement | Value | Source |
|---|---|---|
| Database uptime SLA | 99.9% | Supabase cloud platform — not configurable by this unit |
| Automatic backups | Daily (Supabase Pro) | Platform-managed |
| Point-in-time recovery | Available on Pro plan | Platform-managed |

This unit does not introduce any availability risk — it runs once (migration) and has no runtime component.

---

## Maintainability

| Requirement | Approach |
|---|---|
| Schema versioning | Single `0001_initial_schema.sql` — entire schema visible in one file; future changes get new numbered files |
| Type safety | `lib/database.types.ts` generated from live schema; re-run after any migration |
| Documentation | `domain-entities.md` is the canonical entity reference; inline SQL comments for non-obvious decisions |
| Schema evolution | New migrations always additive (no DROP in `0001`); breaking changes get their own migration file |

---

## Compliance Summary (Security Baseline)

| Rule | Verdict | Rationale |
|---|---|---|
| SECURITY-01 | Compliant | Supabase cloud enforces encryption at rest and in transit |
| SECURITY-02 | N/A | No load balancer or API gateway managed by this unit |
| SECURITY-03 | N/A | No application logging in this unit (DB infra only) |
| SECURITY-04 | Compliant | HTTP security headers added to `next.config.ts` in this unit |
| SECURITY-05 | N/A | No API endpoints in this unit |
| SECURITY-06 | Compliant | RLS policies enforce least-privilege per player |
| SECURITY-07 | N/A | Network managed by Supabase platform |
| SECURITY-08 | N/A | No application endpoints in this unit |
| SECURITY-09 | Compliant | No default credentials; no sample PII data |
| SECURITY-10 | Compliant | Lock file committed; CLI version pinned |
| SECURITY-11 | N/A | No application design patterns in this unit |
| SECURITY-12 | N/A | No authentication logic in this unit |
| SECURITY-13 | N/A | No deserialization or CI pipeline in this unit |
| SECURITY-14 | N/A | No alerting configuration in this unit |
| SECURITY-15 | N/A | No application error handling in this unit |
