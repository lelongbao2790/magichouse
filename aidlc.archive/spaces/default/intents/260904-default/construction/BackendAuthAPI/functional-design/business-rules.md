# Business Rules — Unit 2: BackendAuthAPI

## Signup Rules

| Rule | Description |
|---|---|
| BR-AUTH-01 | Email must be a valid email format (Zod `z.string().email()`) |
| BR-AUTH-02 | Password must be at least 8 characters |
| BR-AUTH-03 | Name must be 1–50 characters (non-empty, trimmed) |
| BR-AUTH-04 | On successful signup, Supabase Auth creates `auth.users` row and sets session cookie automatically (no email verification — disabled in `supabase/config.toml`) |
| BR-AUTH-05 | On successful signup, route calls `upsertPlayer(userId, name)` to create the `players` row |
| BR-AUTH-06 | Signup response returns the new `Player` object (auto-logged in, no separate login step required) |
| BR-AUTH-07 | If email already registered, return `{ data: null, error: "An account with this email already exists" }` with HTTP 409 |

---

## Login Rules

| Rule | Description |
|---|---|
| BR-AUTH-08 | Email and password are required fields (validated by Zod LoginSchema) |
| BR-AUTH-09 | On success, Supabase Auth sets session cookie; route loads `players` row and returns Player |
| BR-AUTH-10 | **Q1=B decision**: Return specific error messages by failure type (see below) |
| BR-AUTH-11 | If email is not registered: return `{ data: null, error: "Email not registered" }` with HTTP 401 |
| BR-AUTH-12 | If password is wrong: return `{ data: null, error: "Wrong password" }` with HTTP 401 |

> **SECURITY-12 trade-off (Q1=B)**: Specific error messages were chosen by the project
> owner over the generic "Invalid email or password" approach. This reveals account
> existence but is an accepted UX trade-off for this children's app context. Document
> this decision for future security reviews.

---

## Logout Rules

| Rule | Description |
|---|---|
| BR-AUTH-13 | Logout calls `supabase.auth.signOut()` which clears the session cookie |
| BR-AUTH-14 | Logout always returns 200 — even if no session exists (idempotent) |
| BR-AUTH-15 | After logout, AuthContext resets `session` and `player` to `null` |

---

## Session Rules

| Rule | Description |
|---|---|
| BR-AUTH-16 | `GET /api/auth/session` reads the session cookie via `@supabase/ssr` |
| BR-AUTH-17 | If valid session exists: call `getPlayer(userId)`, return `{ data: Player, error: null }` with HTTP 200 |
| BR-AUTH-18 | If no session or invalid session: return `{ data: null, error: null }` with HTTP 200 (null signals unauthenticated — not an error) |
| BR-AUTH-19 | Session check is called once on `AuthContext` mount via `useEffect` |

---

## Player Creation Rules

| Rule | Description |
|---|---|
| BR-AUTH-20 | `upsertPlayer` uses `INSERT ... ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name` (safe to re-call) |
| BR-AUTH-21 | Player `id` always equals the Supabase Auth `user.id` |
| BR-AUTH-22 | Player name is set from the signup form; it cannot be changed after creation |

---

## Initial Load Behaviour (Q2=B)

| Rule | Description |
|---|---|
| BR-AUTH-23 | On app load, AuthContext initialises with `{ session: null, player: null, isLoading: false }` |
| BR-AUTH-24 | WelcomeScreen renders immediately (no loading spinner) |
| BR-AUTH-25 | `useEffect` fires after mount, calls `GET /api/auth/session`; if Player returned, AuthContext updates and parent routes to Dashboard |
| BR-AUTH-26 | No loading state is shown during the background session check — only during explicit user actions (signIn, signUp, signOut) |

---

## Input Validation Rules (Zod Schemas)

| Schema | Fields | Rules |
|---|---|---|
| `SignupSchema` | email | Valid email format |
| | password | min 8 characters |
| | name | min 1, max 50 chars |
| `LoginSchema` | email | Valid email format |
| | password | Non-empty string |

Validation failures return HTTP 400 with `{ data: null, error: "<field> is invalid" }`.

---

## Security Rules (SECURITY-12, SECURITY-05, SECURITY-08)

| Rule | Requirement | Implementation |
|---|---|---|
| SECURITY-05 | All inputs validated before processing | Zod schemas on every route handler |
| SECURITY-08 | Session validated server-side | `supabase.auth.getUser()` called in each authenticated route |
| SECURITY-12 | Auth hardening | Password min 8 chars; Supabase handles rate limiting + bcrypt hashing |
