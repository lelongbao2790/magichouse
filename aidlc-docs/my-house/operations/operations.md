# Operations — my-house

**Status**: PLACEHOLDER — the AI-DLC workflow ends after Build and Test. No automated
deployment/monitoring stage exists yet.

## Release runbook (manual)

Ordered steps — do them in this order so the new tables exist before the UI that references
them goes live:

1. **Merge** the branch to `main`.
   - CI `unit` job: lint + unit + api tests must be green.
   - CI `e2e` job (push to main only, `continue-on-error`): may be red for one cycle — the new
     spec needs the DB migration + deploy first.
2. **No new environment variables** to set — this feature reuses the existing Supabase
   connection only.
3. **Apply the database migration** to `eoelyqphaixgqlkyoxau`:
   ```bash
   supabase db push        # applies 0004_house_items_schema.sql
   ```
   This creates `rooms`, `house_items`, `player_house_items`, `house_layout`, seeds 4 rooms +
   6 Bedroom items, and creates the `purchase_house_item` `SECURITY DEFINER` function.
4. **Deploy** the frontend (Vercel auto-deploys from `main`).
5. **Manual verification** — work through the new items in `MANUAL-TEST-CHECKLIST.md`:
   - TC-M006 content review of the 6 seeded Bedroom items (best done pre-merge)
   - TC-M007 drag-and-drop feel on a real mobile screen size (post-deploy, on a preview/staging
     URL)
   - TC-M008 migration applied correctly (row counts, RLS policies enabled)

## Rollback

- **Frontend**: redeploy the previous Vercel build (Vercel Instant Rollback, per Resiliency
  R4=A). The old build has no `"house"` `ViewType` branch and no 4th dashboard card, so it
  simply won't reference the new tables — safe.
- **DB**: `rooms`/`house_items`/`player_house_items`/`house_layout` are entirely new,
  additive tables — nothing existing references them, so leaving them in place after a
  frontend-only rollback is safe. A full schema rollback (dropping the tables) was
  intentionally not authored as part of this migration (NFR-8, forward-only) — write one
  manually if ever needed.
- **Per-unit rollback detail**: `inception/application-design/unit-of-work-dependency.md`.

## Monitoring (ad hoc)

- Vercel function logs: `[GET /api/house-items]`/`[POST /api/players/house-items]`/
  `[GET /api/players/house-layout]`/`[PUT /api/players/house-layout]`/`[GET /api/rooms]`
  errors -> a content/DB problem for that route.
- Supabase: watch for `purchase_house_item` RPC errors distinct from the expected
  `insufficient_funds` case (any other error there is unexpected and worth investigating,
  given the function's `SECURITY DEFINER` privilege).
- Supabase: watch for `house_layout` upsert failures (would surface as a `PUT
  /api/players/house-layout` 500, since the client's debounced save swallows errors silently
  per the accepted UX decision — a persistent failure would only be visible server-side).

## Known follow-ups (out of scope for this initiative)

- **Resiliency DR test plan** (`construction/house-schema-and-service/nfr-design/
  nfr-design-patterns.md`): a restore drill, RLS policy check, and purchase-guard chaos check
  were proposed (RESILIENCY-14=B) but not yet scheduled/executed — this is Operations-phase
  work per the rule's own framing ("execution of chaos experiments and DR drills is an
  Operations-phase activity").
- **Vitest coverage**: the global `lines: 80` threshold remains unmet (pre-existing,
  ~30%, not CI-enforced) — unchanged by this initiative, which added dedicated test files for
  every new module but didn't address the legacy gap.
- **`SECURITY DEFINER` function precedent**: `purchase_house_item` is the first stored
  procedure in this codebase (every other feature uses plain PostgREST calls). If a future
  feature needs a similar atomic-guard pattern, this function is the reference implementation
  — worth a short design note if the pattern gets reused a second time.
- **Dependency vulnerabilities** (`next`/`postcss`/`sharp`, pre-existing, not introduced by
  this initiative): 6 vulnerabilities per `npm audit --omit=dev`, unaddressed here — see
  `construction/build-and-test/security-test-instructions.md`.
