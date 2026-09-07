# NFR Design Plan — Unit 2: BackendAuthAPI

## Artifacts to Generate
- [x] nfr-design-patterns.md — security patterns, resilience patterns, session design
- [x] logical-components.md — component inventory and dependency map

---

## NFR Category Assessment

| Category | Applicable? | Rationale |
|---|---|---|
| Resilience Patterns | **Yes** | Stale cookie handling on session check needs a defined pattern |
| Scalability Patterns | N/A | Supabase Auth handles scaling; no app-level scaling config |
| Performance Patterns | N/A | No caching of auth state server-side; targets met by Supabase edge network |
| Security Patterns | **Yes** | Q1=B login error distinction requires a concrete implementation pattern |
| Logical Components | **Yes** | Enumerate all components produced by this unit |

---

## Questions

### Question 1
The functional design (Q1=B) requires returning "Email not registered" vs "Wrong password"
separately. However, Supabase's `signInWithPassword` returns the same error code
(`"invalid_credentials"`) for both cases.

To distinguish them, the login route can make a pre-check using the Supabase Admin API:
`supabase.auth.admin.getUserByEmail(email)` with the service role key — if the user
is not found, return "Email not registered"; otherwise proceed with login and return
"Wrong password" on failure.

A) Pre-check with Admin API — call `supabase.auth.admin.getUserByEmail(email)` before
   `signInWithPassword`. If not found → "Email not registered". If found and login fails
   → "Wrong password". Adds one extra Supabase call per failed login.

B) Skip the distinction — always return "Wrong password" for all `invalid_credentials`
   errors. Simpler, no extra call, but Q1=B intent is only partially fulfilled.

[Answer]: A

---

### Question 2
When `GET /api/auth/session` is called and `supabase.auth.getUser()` returns an error
(e.g., expired or tampered cookie), should the route actively clear the stale cookie?

A) Yes — call `supabase.auth.signOut()` to clear the cookie, then return
   `{ data: null, error: null }`. Prevents stale cookies accumulating in the browser.

B) No — just return `{ data: null, error: null }` and let the cookie expire naturally.
   Simpler; `@supabase/ssr` will eventually clear it on token refresh failure anyway.

[Answer]: A
