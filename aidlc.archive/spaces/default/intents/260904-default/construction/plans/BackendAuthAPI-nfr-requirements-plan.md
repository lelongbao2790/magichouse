# NFR Requirements Plan — Unit 2: BackendAuthAPI

## Artifacts to Generate
- [x] nfr-requirements.md — security, performance, reliability NFRs for auth routes
- [x] tech-stack-decisions.md — @supabase/ssr, Zod, cookie strategy

---

## NFR Category Assessment

| Category | Applicable? | Rationale |
|---|---|---|
| Security | **Yes** | Auth routes are the highest-security surface; SECURITY-05, 08, 12, 15 all apply |
| Performance | **Yes** | Auth response time affects perceived app start-up speed |
| Scalability | N/A | Supabase Auth handles scaling; this app has low concurrent user count |
| Availability | N/A | Supabase cloud SLA covers this; no additional config needed |
| Tech Stack | **Yes** | @supabase/supabase-js + @supabase/ssr need to be installed; Zod version to pin |
| Reliability | Resolved | try/catch in every route handler; Supabase handles session refresh |
| Maintainability | Resolved | Shared apiSuccess/apiError helpers, Zod schemas in single file |

---

## Questions

### Question 1
Should the signup route enforce password complexity beyond the 8-character minimum?

The `SignupSchema` currently requires `password.min(8)`. The account is created by
a parent (not the child), so usability vs. security trade-off applies.

A) Minimum 8 characters only — straightforward for parents; consistent with the current
   schema definition

B) Add complexity rules: must include at least one uppercase letter and one digit
   (stronger security; parents can handle this)

[Answer]: A

---

### Question 2
Should auth routes have application-level rate limiting in addition to Supabase's
built-in rate limiting?

Supabase already rate-limits auth endpoints at the platform level (login, signup).
Adding Next.js middleware rate limiting would be defense-in-depth but adds a dependency.

A) Rely on Supabase's built-in rate limiting only — sufficient for this app scale; no
   additional package needed

B) Add application-level rate limiting via Next.js middleware (e.g., `@upstash/ratelimit`
   or simple in-memory counter) as defense-in-depth

[Answer]: A
