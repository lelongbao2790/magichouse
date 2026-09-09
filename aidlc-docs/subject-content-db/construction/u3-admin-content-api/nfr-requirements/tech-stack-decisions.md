# Tech Stack Decisions — U3 admin-content-api

**No new dependencies.**

| Concern | Decision |
|---|---|
| Admin identity | `ADMIN_EMAILS` env var (comma-separated), checked by pure `isAdminEmail` (`lib/admin-auth.ts`). No `players.is_admin` column, no Supabase custom claim (C3=A). |
| Auth client | existing `createServerClient` (anon+cookies) for `auth.getUser()`; existing `createAdminClient` (service role) for writes after the gate. |
| Validation | `zod` (existing) — new schemas added to `lib/validation/api.ts` (additive to U1's block). |
| Data access | U1's `lib/services/subject-content.ts` write fns + 3 small read helpers added in U3. |
| Rate limiting | platform-provided (Vercel/Supabase). None in-route (Q2=A). |
| Logging | `console.warn` / `console.log` (matches existing routes). No logging library. |
| Coverage | `vitest.config.ts` `include` gains `"!app/api/admin/**"` (CL2=C). |
| PBT (PBT-09) | fast-check (unchanged). U3 pure logic gets example-based tests + one fast-check pass over `validateModeCoverage`. |

`package.json` is unchanged by U3.
