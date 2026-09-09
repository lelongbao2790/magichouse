# U1 NFR Requirements Plan — content-schema-and-service

**Status**: Answered — artifacts generated 2026-09-09
**Last updated**: 2026-09-09

## Answers
- Q1=A — two indexed queries (`getSubjectByKey`, then `getActiveQuestions`)
- Q2=B — add a **covering index** `(subject_id, is_active, sort_order) INCLUDE (prompt_vi,
  prompt_en, options_vi, options_en, correct_index, difficulty)` for index-only scans of
  "active questions for a subject, in order"
- Q3=A — no special load/availability concern; document small-scale single indexed read

---

## Plan — DONE
- [x] `nfr-requirements/nfr-requirements.md`
- [x] `nfr-requirements/tech-stack-decisions.md`

---

## Questions

Fill in each `[Answer]:` tag and say "done".

### Q1 — Query shape for `getSubjectContent`

A) **Two queries** — `getSubjectByKey(key)` then `getActiveQuestions(subject.id)`. Simple,
   matches the existing `lib/services/*` style, both hit indexes. *(Recommended — a quiz
   opens once; two small indexed reads are negligible)*

B) **One query** — a single `select` on `subject_questions` with an inner join to
   `subjects` filtered by `subjects.key`, mapped client-side

C) Other (describe after [Answer]: tag)

[Answer]:A

### Q2 — Index footprint

The design has `idx_subject_questions_subject_active (subject_id, is_active)` and the
`UNIQUE (subject_id, source_key)` constraint index.

A) **Just those two** — sufficient for "all active questions for one subject" *(Recommended)*

B) Also add a covering index including `sort_order` / content columns

C) Other (describe after [Answer]: tag)

[Answer]:B

### Q3 — Anything to note about expected load or availability

A) **No special concern** — a handful of authenticated kids; a quiz opens a few times per
   session; the questions API is a cache-friendly read. Document "small scale, single
   indexed read, client caches per session" and move on. *(Recommended)*

B) I have a scale/availability concern to capture (describe after [Answer]: tag)

[Answer]:A
