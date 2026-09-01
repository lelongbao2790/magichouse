# Tech Stack Decisions — Unit 2: BackendAuthAPI

## New Dependencies to Install

| Package | Version | Type | Purpose |
|---|---|---|---|
| `@supabase/supabase-js` | `^2` (latest stable) | production | Supabase JS client — auth, DB access |
| `@supabase/ssr` | `^0` (latest stable) | production | Cookie-based session management for Next.js App Router |
| `zod` | `^3` (latest stable) | production | Schema validation for all API inputs |

```bash
npm install @supabase/supabase-js @supabase/ssr zod
```

These are installed in Unit 2 because this is the first unit that requires them. Unit 4
consumes them from the browser side but does not add additional packages.

---

## Supabase Client Strategy

### Server Client — `lib/supabase/server.ts`

| Decision | Choice | Rationale |
|---|---|---|
| Package | `@supabase/ssr` `createServerClient` | Designed for Next.js App Router; handles cookie read/write via `next/headers` |
| Instance lifetime | Per-request (new instance each route call) | Required by `@supabase/ssr` — cookies() is per-request in Next.js |
| Keys used | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key + RLS for user-context calls; service role key used selectively for admin ops |
| Cookie handling | Automatic via `cookieStore` from `next/headers` | `@supabase/ssr` reads/writes `sb-<ref>-auth-token` cookie |

### Browser Client — `lib/supabase/client.ts`

| Decision | Choice | Rationale |
|---|---|---|
| Package | `@supabase/ssr` `createBrowserClient` | Consistent with server client; handles token refresh in browser |
| Instance lifetime | Singleton (module-level) | One client per browser tab; reused across AuthContext calls |
| Keys used | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public keys only — never expose service role key to browser |

---

## Cookie Security (Managed by @supabase/ssr)

`@supabase/ssr` sets session cookies with these properties by default:

| Property | Value | Notes |
|---|---|---|
| `HttpOnly` | `true` | Cookie not accessible from JavaScript |
| `Secure` | `true` in production | Requires HTTPS |
| `SameSite` | `Lax` | Allows navigation links; blocks cross-site POST (CSRF protection) |
| `Path` | `/` | Available to all routes |
| `Max-Age` | Access token: 3600s; Refresh: 7 days | Supabase defaults; refresh rotates automatically |

No custom cookie configuration needed — `@supabase/ssr` defaults are appropriate.

---

## Validation Framework

| Decision | Choice | Rationale |
|---|---|---|
| Library | Zod v3 | TypeScript-native; schema-first; `z.infer<>` gives free type derivation |
| Schema location | `lib/validation/api.ts` | Single file for all API schemas across Units 2–3 |
| Parse strategy | `schema.safeParse(body)` | Returns `{ success, data, error }` — no thrown exceptions for invalid input |
| Error format | `error.errors[0].message` → `apiError(message, 400)` | First error message is sufficient for this API scale |

### Auth Schemas (Unit 2 scope)

```typescript
// lib/validation/api.ts
import { z } from 'zod'

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(50),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
```

Remaining schemas (coins, stickers, canvas, quiz, migrate) are added in Unit 3.

---

## Not Used (and Why)

| Alternative | Reason Not Used |
|---|---|
| Application-level rate limiting (Q2=A) | Supabase platform rate limiting is sufficient; adding a package adds complexity |
| Password complexity rules (Q1=A) | Min 8 chars is appropriate for a parent-created account in a children's app |
| `@supabase/auth-helpers-nextjs` | Deprecated in favour of `@supabase/ssr` — do not use |
| Manual JWT verification | `supabase.auth.getUser()` handles this; no manual JWT parsing needed |
| `next-auth` / `auth.js` | Adds unnecessary abstraction over Supabase Auth which already manages sessions |
