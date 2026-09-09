# Tech Stack Decisions — U1 content-schema-and-service

No new runtime dependencies. All choices reuse what the repo already has.

| Concern | Decision | Rationale |
|---|---|---|
| Database | Supabase Postgres (existing project `eoelyqphaixgqlkyoxau`) | Same DB the app already uses (Q1=B of Requirements) |
| Schema management | Supabase CLI migrations in `supabase/migrations/` (`0002` schema, `0003` seed) | Existing convention; user applies via `supabase db push` (Q7=A) |
| ID generation | `gen_random_uuid()` (pgcrypto — already enabled in `0001`) | Existing |
| Idempotency | `ON CONFLICT (key)` / `ON CONFLICT (subject_id, source_key)` `DO UPDATE` | FD Q5=B + Q6=B reconciliation |
| Row-level security | Postgres RLS, `auth.role() = 'authenticated'` SELECT policy | Mirrors the `stickers` catalog |
| Mode-coverage integrity | `BEFORE INSERT OR UPDATE` trigger (plpgsql) `subject_questions_mode_check()` | A CHECK can't reference the parent `subjects` row |
| Covering index | btree `(subject_id, is_active, sort_order) INCLUDE (content cols)` | Index-only scan for the one hot read (NFR Q2=B) |
| Service layer | `lib/services/subject-content.ts` — pure async fns taking `SupabaseClient<Database>` | Existing `lib/services/*` pattern |
| Pure logic | `lib/subject-content/resolve.ts` — no deps | Testability |
| Validation | `zod` (existing) — `LocaleSchema` added to `lib/validation/api.ts` | Existing |
| Types | Hand-maintained `lib/database.types.ts` additions | Existing practice (repo doesn't run codegen in CI) |

## PBT-09 — Property-Based Testing framework (BLOCKING rule)

| Item | Decision |
|---|---|
| Framework | **fast-check** |
| Version | `^3.22.0` — **already present** in `devDependencies` (added by the prior initiative) |
| Test runner integration | Vitest (existing) — `automation_tests/unit/**` glob |
| Custom generators | Yes — `automation_tests/unit/_arbitraries.ts` (domain arbitraries per PBT-07: `questionRowArb`, `fixedSubjectArb`, `localizedSubjectArb`, `optionTripleArb`, `difficultyArb`) |
| Shrinking | fast-check default (enabled, not overridden) — PBT-08 |
| Reproducibility | fast-check prints the failing seed; CI unit-test step logs it — finalized in Build & Test (PBT-08) |
| Applicable rules for U1 | PBT-01 ✅, PBT-02 ✅ (TP-3), PBT-03 ✅ (TP-1/2/4), PBT-07 ✅, PBT-08 ✅, PBT-09 ✅, PBT-10 ✅ |
| N/A for U1 | PBT-04 (no idempotency claim in app logic), PBT-05 (no oracle), PBT-06 (no stateful component) — rationale in `business-logic-model.md` §7 |

No dependency changes required — `package.json` is untouched by U1.
