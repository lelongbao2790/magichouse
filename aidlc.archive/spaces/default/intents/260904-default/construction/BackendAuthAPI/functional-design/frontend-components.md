# Frontend Components — Unit 2: BackendAuthAPI

## Component: WelcomeScreen

**File**: `components/welcome-screen.tsx` (refactored from current implementation)

### State
```typescript
type AuthView = 'login' | 'register'
const [view, setView] = useState<AuthView>('login')  // Q3=A: login first
```

### Props
None — driven entirely by `AuthContext` and local view state.

### Rendering Logic
```
if (isAuthenticated) → render nothing (parent routes to Dashboard)

if view === 'login'    → <LoginView    onNavigateToRegister={() => setView('register')} />
if view === 'register' → <RegisterView onNavigateToLogin={() => setView('login')} />
```

### Session Check Behaviour (Q2=B)
- WelcomeScreen renders immediately on mount — no loading spinner
- `AuthContext.useEffect` runs `GET /api/auth/session` in background
- If session found, `isAuthenticated` becomes `true` → parent replaces WelcomeScreen with Dashboard
- No visible loading state during this background check

### data-testid attributes
- `data-testid="welcome-screen"`

---

## Component: LoginView

**File**: `components/login-view.tsx` (new file)

### Props
```typescript
interface LoginViewProps {
  onNavigateToRegister(): void
}
```

### State
```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState<string | null>(null)
const { signIn, isLoading } = useAuth()
```

### Form Fields
| Field | Type | Validation (client-side) |
|---|---|---|
| Email | `<input type="email">` | Browser native email validation |
| Password | `<input type="password">` | Non-empty |

### Submit Flow
```
handleSubmit(e):
  e.preventDefault()
  setError(null)
  const result = await signIn(email, password)
  if result.error:
    setError(result.error)   // "Email not registered" or "Wrong password"
  // on success: AuthContext updates → WelcomeScreen replaced by Dashboard automatically
```

### Error Display
- Show `error` string below the form if non-null
- Clear error on next submit attempt

### data-testid attributes
- `data-testid="login-form"`
- `data-testid="login-email-input"`
- `data-testid="login-password-input"`
- `data-testid="login-submit-button"`
- `data-testid="login-error-message"` (conditional)
- `data-testid="login-navigate-register"` (link/button to RegisterView)

---

## Component: RegisterView

**File**: `components/register-view.tsx` (new file)

### Props
```typescript
interface RegisterViewProps {
  onNavigateToLogin(): void
}
```

### State
```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [name, setName] = useState('')
const [error, setError] = useState<string | null>(null)
const { signUp, isLoading } = useAuth()
```

### Form Fields
| Field | Type | Client-side Validation |
|---|---|---|
| Child's name | `<input type="text">` | Non-empty, max 50 chars |
| Email | `<input type="email">` | Browser native email validation |
| Password | `<input type="password">` | Min 8 chars (show hint text) |

### Submit Flow
```
handleSubmit(e):
  e.preventDefault()
  setError(null)
  // Client-side guard
  if name.trim().length === 0: setError("Please enter your child's name"); return
  if password.length < 8: setError("Password must be at least 8 characters"); return
  const result = await signUp(email, password, name.trim())
  if result.error:
    setError(result.error)
  // on success: AuthContext updates → WelcomeScreen replaced by Dashboard automatically
```

### data-testid attributes
- `data-testid="register-form"`
- `data-testid="register-name-input"`
- `data-testid="register-email-input"`
- `data-testid="register-password-input"`
- `data-testid="register-submit-button"`
- `data-testid="register-error-message"` (conditional)
- `data-testid="register-navigate-login"` (link/button to LoginView)

---

## Context: AuthContext

**File**: `contexts/auth-context.tsx` (new file)

### Provided Values
```typescript
interface AuthContextType {
  session: Session | null
  player: Player | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp(email: string, password: string, name: string): Promise<{ error: string | null }>
  signIn(email: string, password: string): Promise<{ error: string | null }>
  signOut(): Promise<void>
}
```

### Provider Behaviour
- `AuthProvider` wraps the app root
- On mount: calls `GET /api/auth/session` to restore session (Q2=B: no loading state during this)
- `isLoading` is only `true` during explicit auth actions (signIn, signUp, signOut)
- `isAuthenticated` is a computed boolean: `session !== null && player !== null`

### Hook
```typescript
export function useAuth(): AuthContextType
// Throws if used outside <AuthProvider>
```

---

## Integration Points

| Component | API Call | When |
|---|---|---|
| AuthContext (mount) | `GET /api/auth/session` | Once on app load |
| LoginView (submit) | via `AuthContext.signIn` → `POST /api/auth/login` | On form submit |
| RegisterView (submit) | via `AuthContext.signUp` → `POST /api/auth/signup` | On form submit |
| (Any component) | via `AuthContext.signOut` → `POST /api/auth/logout` | On logout action |
