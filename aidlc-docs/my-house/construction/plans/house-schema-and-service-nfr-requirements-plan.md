# NFR Requirements Plan — U1: house-schema-and-service

**Status**: No open questions — all categories resolved from existing decisions/precedent
**Last updated**: 2026-09-13

---

## Purpose

Determine U1's non-functional requirements and tech stack choices. Per
`overconfidence-prevention.md`, every category below is evaluated explicitly rather than
skipped — but for this unit, an unusually large share was already locked at Requirements
Analysis (which ran full Security Baseline and Resiliency Baseline compliance passes across 15
rules each) or is directly derivable from an exact, unambiguous precedent already in this
codebase. Where that's true, no question is posed — inventing a multiple-choice question with
only one defensible answer would be padding, not genuine clarification (per
`question-format-guide.md`: "don't make up options just to fill slots").

---

## Category-by-Category Evaluation

### Scalability Requirements — Resolved, no question
Catalog is ≤ ~10 rows per room (NFR-2); ownership/layout rows are one-per-player(-per-room).
Vercel serverless functions auto-scale by platform default (RESILIENCY-09, already "N/A" in
`requirements.md` §7). Nothing about U1 changes this — same conclusion applies unchanged.

### Performance Requirements — Resolved, no question
Small payloads, no pagination (NFR-2, already locked). One new decision *is* made here (not a
question, a direct precedent match — see Tech Stack Selection below): indexing strategy for the
4 tables.

### Availability Requirements — Resolved, no question
RTO/RPO = hours / Backup & Restore (R1=A), already decided and required by
`resiliency-baseline.md` to propagate unchanged to NFR Requirements — restated in
`nfr-requirements.md` below, not re-asked.

### Security Requirements — Re-verified, no new question
Security Baseline is full/blocking for this initiative (Q10=A). The 15-rule compliance table
from `requirements.md` §6 is re-checked against U1's Functional Design output (which added the
`rooms` table and `GET /api/rooms` route, not present when that table was first written) — see
the re-verification in `nfr-requirements.md` below. No new blocking finding: the new
table/route follow the exact same compliant patterns (auth-required, Zod-validated, SELECT-only
RLS for a non-player-specific catalog-shaped table) as the four routes already assessed.

### Tech Stack Selection — Resolved directly (precedent match, no question)
- **Indexing**: `house_items` gets a composite index on `(room, is_active)`, matching
  `subject_questions`' exact precedent (`idx_subject_questions_subject_active`) for the
  identical query shape (`WHERE <fk> = ? AND is_active = ?`). `player_house_items` and
  `house_layout` need no additional index beyond their composite primary keys — both have
  `player_id` as the PK's leading column already, matching `player_stickers`' precedent
  (which also gets no extra index, unlike `quiz_history`, whose PK does *not* lead with
  `player_id`). `rooms` is a 4-row table; no index needed beyond its PK.
- **PBT framework**: `fast-check` (already a dependency, per PBT-09's requirement that
  framework selection be recorded here — this is a restatement of Assumption A-2, not a new
  choice).
- Everything else (Next.js 16, Supabase client, Zod, TypeScript) is the existing, unchanged
  stack — brownfield, no tech choice being made.

### Reliability Requirements — Resolved, no question
Error handling is already fully specified at the business-rule level (`business-rules.md`
BR-3/BR-4/BR-6/BR-7 — fail-closed validation, no partial writes). Monitoring/alerting remains
N/A per RESILIENCY-05 (existing Vercel/Supabase logs, no new observability infra proposed or
required). Circuit breaking remains "partially compliant" per RESILIENCY-10 — a pre-existing,
accepted codebase-wide gap this unit doesn't change or need to fix.

### Maintainability Requirements — Resolved, no question
Testing is already fully specified in `test-case-design.md` (TC-A031-037, PBT-D/G, unit tests).
Code quality follows the existing lint/tsc/eslint conventions uniformly applied across the
codebase — no unit-specific maintainability decision to make.

### Usability Requirements — N/A
U1 is backend-only (no UI). Covered under U2's NFR Requirements instead.

---

## Conclusion

No `[Answer]:` tags in this plan — every category resolved above without needing user input.
Proceeding directly to generating `nfr-requirements.md` and `tech-stack-decisions.md`.
