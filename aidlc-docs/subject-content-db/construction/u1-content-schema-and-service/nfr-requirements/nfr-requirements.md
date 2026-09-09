# NFR Requirements — U1 content-schema-and-service

**Status**: Approved (user, 2026-09-09)
Light stage — inherits `requirements.md` §5; only U1-specific points below.

## Performance
- **P-1** One quiz open = **two** indexed reads (`subjects` by `key` UNIQUE; then
  `subject_questions` by the covering index). Both are single-subject lookups over ≤ ~50
  rows. Target: < 50 ms server-side each; not measured formally (Q3=A — small scale).
- **P-2** A **covering index**
  `idx_subject_questions_subject_active (subject_id, is_active, sort_order)
  INCLUDE (prompt_vi, prompt_en, options_vi, options_en, correct_index, difficulty)`
  supports an index-only scan for "active questions for a subject, ordered" (Q2=B).
- **P-3** No pagination, no server-side session subsetting (client does it). Response
  payload ≤ ~50 questions × ~4 short strings ≈ a few KB.
- **P-4** No caching in the service layer; the client hook caches per session (U2).

## Availability / Reliability
- **A-1** No new failure modes for existing features — `subjects`/`subject_questions` are
  additive; `quiz_history` CHECK change only widens the allowed set.
- **A-2** `getSubjectContent` fails **loudly** (throws → 500) on an incomplete active row
  (BR-3.1) rather than serving a degraded quiz.
- **A-3** Migrations are idempotent and reversible (prior `quiz_history` CHECK text kept in
  a comment). If `0003` is interrupted, re-running completes it (`ON CONFLICT DO UPDATE`).

## Security
- **S-1** RLS: authenticated `SELECT` only on both tables (BR-5). No client write path.
- **S-2** No secrets, no PII in the new tables (public educational content).
- **S-3** The trigger and CHECKs prevent malformed rows regardless of the writer.
- **S-4** `Difficulty` / `Locale` / `ContentMode` constrained by CHECK — no free-text enums.

## Maintainability
- **M-1** `resolve.ts` is pure and fully unit + property tested — the bug-fix logic is
  isolated and regression-proof.
- **M-2** Content lives in one seed migration with stable `source_key`s — diffs are
  reviewable (TC-M001).
- **M-3** `database.types.ts` hand-maintained to match the migration (project already does
  this — see the file header note about `supabase gen types`).

## Testability
- **T-1** Blocking PBT per `business-logic-model.md` §7 (TP-1..TP-5).
- **T-2** Service reads tested with a mocked `SupabaseClient` (project pattern).
- **T-3** `TC-A030` statically asserts the migration extends the `quiz_history` CHECK.

## Explicitly not addressed (out of scope / N/A for U1)
- Rate limiting (Supabase/Vercel platform defaults).
- Multi-region, DR, RTO/RPO (Resiliency extension declined — Q13=B).
- Observability beyond `console.warn`/`console.error` (matches existing routes).
