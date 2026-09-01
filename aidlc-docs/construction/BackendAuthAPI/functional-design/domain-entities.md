# Domain Entities — Unit 2: BackendAuthAPI

## Entity: Player (Application Layer)

Returned by auth routes and stored in AuthContext. Derived from the `players` DB row.

```typescript
interface Player {
  id: string       // uuid — equals auth.users.id
  name: string     // child's display name (immutable after signup)
  coins: number    // current coin balance
  createdAt: string // ISO 8601 timestamptz
}
```

**Source**: `players` table (Unit 1 schema)
**Invariants**:
- `id` always equals the Supabase Auth user's UUID
- `name` is set once at signup and never changed (FR requirement)
- `coins` reflects the DB value at time of last load

---

## Entity: AuthState (Context State)

The complete state held by `AuthContext`.

```typescript
interface AuthState {
  session: Session | null    // Supabase Session object (contains access_token, user)
  player: Player | null      // loaded player profile (null when not authenticated)
  isLoading: boolean         // true only during signIn / signUp / signOut calls
  isAuthenticated: boolean   // derived: session !== null && player !== null
}
```

**Initial state** (Q2=B — WelcomeScreen renders immediately):
```typescript
{ session: null, player: null, isLoading: false, isAuthenticated: false }
```

The session check (`GET /api/auth/session`) runs in a `useEffect` after mount. While it
runs, `isLoading` stays `false` so WelcomeScreen renders immediately. On success, state
updates and the parent component routes to Dashboard.

---

## Entity: Session Cookie

Managed entirely by `@supabase/ssr`. No manual cookie handling needed.

| Property | Value |
|---|---|
| Name | `sb-<project-ref>-auth-token` (Supabase-managed) |
| Storage | `HttpOnly` cookie (set by API route response) |
| Lifetime | Supabase default access token (1 hour); refresh token rotates automatically |
| Scope | Server-readable (API routes via `cookies()`) + browser readable for client refresh |

---

## API Response Envelope

All auth routes return `{ data: T | null, error: string | null }` (Q4=B from Application Design).

```typescript
// Success
{ data: Player, error: null }

// Error
{ data: null, error: "Invalid email or password" }
```

---

## Route Contracts

| Route | Method | Input | Success Response | Auth Required |
|---|---|---|---|---|
| `/api/auth/signup` | POST | `{ email, password, name }` | `{ data: Player, error: null }` | No |
| `/api/auth/login` | POST | `{ email, password }` | `{ data: Player, error: null }` | No |
| `/api/auth/logout` | POST | (none) | `{ data: null, error: null }` | Yes (session cookie) |
| `/api/auth/session` | GET | (none) | `{ data: Player \| null, error: null }` | No (returns null if not authenticated) |
