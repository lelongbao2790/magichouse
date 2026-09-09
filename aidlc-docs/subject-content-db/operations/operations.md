# Operations — subject-content-db

**Status**: PLACEHOLDER — the AI-DLC workflow ends after Build and Test. No automated
deployment/monitoring stage exists yet.

## Release runbook (manual)

Ordered steps — do them in this order to avoid a window where the app 500s on content
subjects:

1. **Merge** the branch to `main`.
   - CI `unit` job: lint + unit + api tests must be green.
   - CI `e2e` job (push to main only, `continue-on-error`): may be red for one cycle —
     the new specs need the DB migration + deploy first.
2. **Set `ADMIN_EMAILS`** in the Vercel project environment (Production + Preview).
   Comma-separated admin emails. Leaving it unset keeps the admin API disabled (403).
3. **Apply the database migrations** to `eoelyqphaixgqlkyoxau`:
   ```bash
   supabase db push        # applies 0002_subject_content_schema.sql, 0003_subject_content_seed.sql
   ```
4. **Deploy** the frontend (Vercel auto-deploys from `main`).
5. **Manual verification** — work through every item in `MANUAL-TEST-CHECKLIST.md`:
   - TC-M001 content review of the ~100 authored Grade 2 questions (best done pre-merge)
   - TC-M002 migration applied + row counts
   - TC-M003 admin allowlist gate + CRUD on the deployed env
   - TC-M004 Vietnamese subject renders in Vietnamese with UI in English (deployed)
   - TC-M005 coins + `quiz_history` for all quiz types (incl. the `grade2*` constraint fix)

## Rollback

- **Frontend**: redeploy the previous Vercel build. (The old build reads
  `data/translations.ts`, which no longer has quiz content — so a full frontend rollback
  also needs the `translations.ts` revert. Prefer forward-fix.)
- **DB**: `subjects` / `subject_questions` are additive (safe to leave). To revert the
  `quiz_history` CHECK, re-apply the 9-value constraint (original text is in the `0002`
  header comment).
- **Per-unit** rollback detail: `inception/application-design/unit-of-work-dependency.md`.

## Monitoring (ad hoc)

- Vercel function logs: `[GET /api/subjects/[key]/questions]` errors → a content/DB problem;
  `[admin] 403 …` → a rejected admin attempt; `[admin] POST|PATCH|DELETE …` → admin writes.
- Supabase: watch for `quiz_history` insert errors (should be zero after step 3).

## Known follow-ups (out of scope for this initiative)

- Vitest coverage: the global `lines: 80` threshold is unmet (~30%, pre-existing) and not
  CI-enforced. Extending the coverage `include` globs to the new `lib/` dirs + addressing
  the legacy gap would make it meaningful.
- Re-running the `0003` seed reverts admin edits to **seeded** questions (`source_key`
  rows). Accepted (FD Q6=B); noted in `.env.local.example` and the checklist.
