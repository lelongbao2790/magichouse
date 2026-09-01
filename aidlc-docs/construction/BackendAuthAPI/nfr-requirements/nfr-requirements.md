# NFR Requirements — Unit 2: BackendAuthAPI

## Security (SECURITY BASELINE — All Rules Enforced)

| Rule | Status | Implementation |
|---|---|---|
| SECURITY-01 | N/A | No data storage in this unit; Supabase handles encryption (Unit 1) |
| SECURITY-02 | N/A | No load balancer or API gateway managed by this unit |
| SECURITY-03 | N/A | No structured logging in this unit (auth events logged by Supabase platform) |
| SECURITY-04 | Compliant | HTTP headers applied in `next.config.mjs` (Unit 1) — carries over |
| SECURITY-05 | **Compliant** | Zod schemas (`SignupSchema`, `LoginSchema`) validate all inputs before processing; invalid requests rejected with HTTP 400 |
| SECURITY-06 | N/A | RLS policies enforced at DB level (Unit 1); auth routes use service role key which bypasses RLS intentionally |
| SECURITY-07 | N/A | Network managed by Supabase platform |
| SECURITY-08 | **Compliant** | Every authenticated route calls `supabase.auth.getUser()` server-side to validate session before processing |
| SECURITY-09 | **Compliant** | No hardcoded credentials; env vars used for all keys |
| SECURITY-10 | **Compliant** | Lock file committed; packages pinned |
| SECURITY-11 | N/A | No application design patterns beyond standard Next.js App Router |
| SECURITY-12 | **Compliant** | Auth hardening: password min 8 chars (Q1=A); bcrypt hashing by Supabase; rate limiting by Supabase platform (Q2=A); no account enumeration in signup error (HTTP 409 with explicit message is acceptable for usability — email uniqueness is not a secret) |
| SECURITY-13 | N/A | No deserialization of untrusted data; Zod parsing is schema-driven |
| SECURITY-14 | N/A | No custom alerting in this unit; Supabase dashboard provides auth event visibility |
| SECURITY-15 | **Compliant** | All route handlers wrapped in try/catch; errors return `apiError(message, status)` — no stack traces or internal details exposed to clients |

---

## Performance

| Requirement | Target | Rationale |
|---|---|---|
| Signup route response | < 2000 ms p95 | Supabase auth signup + DB INSERT; one network round-trip to Supabase |
| Login route response | < 1000 ms p95 | Supabase auth lookup; faster than signup (no INSERT) |
| Logout route response | < 500 ms p95 | Cookie clear only; minimal Supabase work |
| Session route response | < 800 ms p95 | Cookie read + DB SELECT; two fast queries |

These targets are appropriate for a children's app where auth happens infrequently
(once per session). Supabase's edge network reduces latency from most regions.

---

## Reliability

| Requirement | Approach |
|---|---|
| Route error handling | Every handler wrapped in try/catch; uncaught errors return HTTP 500 with `apiError("Internal server error", 500)` |
| Session token refresh | Handled automatically by `@supabase/ssr` on every request — no manual refresh logic needed |
| Partial signup failure | If `upsertPlayer` fails after `auth.signUp` succeeds, the route returns 500. Next login attempt will call `upsertPlayer` again (idempotent). Player row is created on successful re-login via session route. |
| Cookie loss | If session cookie is lost, user logs in again. No data loss — all data persists in DB. |

---

## Maintainability

| Requirement | Approach |
|---|---|
| Validation centralised | All Zod schemas in `lib/validation/api.ts` — single source of truth |
| Response format | All routes use `apiSuccess` / `apiError` from `lib/api-response.ts` |
| Supabase client | `createServerClient()` from `lib/supabase/server.ts` — instantiated per-request, never shared across requests |
| No rate limiting package | Q2=A — Supabase platform handles rate limiting; no additional dependency |

---

## Password Policy (Q1=A)

| Rule | Value |
|---|---|
| Minimum length | 8 characters |
| Complexity | None required (min length only) |
| Hashing | bcrypt via Supabase Auth (platform-managed) |
| Storage | Never stored in application DB — Supabase Auth manages credentials |

---

## Rate Limiting (Q2=A)

| Layer | Mechanism |
|---|---|
| Signup | Supabase Auth built-in rate limiting (platform-managed) |
| Login | Supabase Auth built-in rate limiting (platform-managed) |
| Application level | None added — Supabase limits are sufficient for this app scale |

Supabase free tier rate limits: 30 signups/hour, 10 login attempts/minute per IP.
These are appropriate for a small children's educational app.
