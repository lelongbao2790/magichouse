# Component Methods — Supabase Backend Integration

## AuthContext

```typescript
// contexts/auth-context.tsx

interface Player {
  id: string          // = auth.users.id (uuid)
  name: string
  coins: number
  createdAt: string
}

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

- `signUp` — POST `/api/auth/signup`, auto-logged in on success (no email verification)
- `signIn` — POST `/api/auth/login`, sets session cookie, loads player from response
- `signOut` — POST `/api/auth/logout`, clears cookie, resets session + player to null

---

## CoinContext

```typescript
// contexts/coin-context.tsx

interface CoinContextType {
  coins: number
  ownedStickers: string[]
  isLoading: boolean
  isCacheFallback: boolean          // true when operating from localStorage cache
  addCoins(amount: number): Promise<void>
  buySticker(sticker: StickerItem): Promise<boolean>
  hasSticker(stickerId: string): boolean
  loadPlayerData(): Promise<void>   // called on auth, loads coins + stickers from API
}
```

- `addCoins` — POST `/api/players/coins`, updates local state + localStorage cache on success
- `buySticker` — POST `/api/players/stickers`, validates coins locally before calling, updates state on success
- `loadPlayerData` — GET `/api/players/me` + GET `/api/players/stickers`; on failure falls back to localStorage
- `isCacheFallback` — exposed so components can show a subtle "offline" indicator if desired

---

## LoginView

```typescript
// components/login-view.tsx
interface LoginViewProps {
  onNavigateToRegister(): void
}

// Internal methods:
handleSubmit(e: FormEvent): Promise<void>   // calls AuthContext.signIn()
```

---

## RegisterView

```typescript
// components/register-view.tsx
interface RegisterViewProps {
  onNavigateToLogin(): void
}

// Internal methods:
handleSubmit(e: FormEvent): Promise<void>   // calls AuthContext.signUp()
```

---

## WelcomeScreen

```typescript
// components/welcome-screen.tsx
// (No external props — driven entirely by AuthContext and local view state)

// Internal state: view: "login" | "register"
// Renders LoginView or RegisterView, passes navigation callbacks
```

---

## CreativeRoom

```typescript
// components/creative-room.tsx (additions to existing interface)

// New internal methods:
loadCanvas(): Promise<void>         // GET /api/players/canvas on mount
saveCanvas(data: PlacedSticker[]): void  // debounced PUT /api/players/canvas
```

---

## LearningZone

```typescript
// components/learning-zone.tsx (minimal change)

// Existing callback retained:
onQuizComplete(): void              // unchanged — parent (Dashboard) handles addCoins

// New internal call after quiz completion:
recordHistory(category: string, score: number, total: number, coinsEarned: number): Promise<void>
// → POST /api/quiz/history (fire-and-forget, errors swallowed silently)
```

---

## API Response Helper

```typescript
// lib/api-response.ts

function apiSuccess<T>(data: T): NextResponse<{ data: T; error: null }>
function apiError(message: string, status?: number): NextResponse<{ data: null; error: string }>
```

---

## Validation Schemas

```typescript
// lib/validation/api.ts (Zod schemas)

SignupSchema: { email: string, password: string (min 8), name: string (min 1, max 50) }
LoginSchema: { email: string, password: string }
AddCoinsSchema: { amount: number (positive integer, max 1000) }
BuyStickerSchema: { stickerId: string (non-empty) }
CanvasSchema: { canvasData: array of PlacedStickerSchema }
QuizHistorySchema: { category: string, score: integer ≥ 0, totalQuestions: integer > 0, coinsEarned: integer ≥ 0 }
MigrateSchema: { coins: integer ≥ 0, ownedStickers: string[] }
```

---

## Service Layer Methods

### lib/services/player.ts

```typescript
getPlayer(supabase: SupabaseClient, userId: string): Promise<Player>
upsertPlayer(supabase: SupabaseClient, userId: string, name: string): Promise<Player>
addCoins(supabase: SupabaseClient, userId: string, amount: number): Promise<Player>
migrateFromLocalStorage(supabase: SupabaseClient, userId: string, coins: number, stickerIds: string[]): Promise<void>
```

### lib/services/stickers.ts

```typescript
getCatalog(supabase: SupabaseClient): Promise<StickerCatalogItem[]>
getOwnedStickers(supabase: SupabaseClient, userId: string): Promise<string[]>
purchaseSticker(supabase: SupabaseClient, userId: string, stickerId: string, price: number): Promise<{ newCoinBalance: number }>
```

### lib/services/canvas.ts

```typescript
getCanvas(supabase: SupabaseClient, userId: string): Promise<PlacedSticker[]>
saveCanvas(supabase: SupabaseClient, userId: string, canvasData: PlacedSticker[]): Promise<void>
```

### lib/services/quiz.ts

```typescript
recordHistory(supabase: SupabaseClient, userId: string, record: QuizHistoryInsert): Promise<void>
getHistory(supabase: SupabaseClient, userId: string): Promise<QuizHistoryRow[]>
```

---

## Supabase Utilities

```typescript
// lib/supabase/server.ts
createServerClient(): SupabaseClient   // uses Next.js cookies() for session

// lib/supabase/client.ts
createBrowserClient(): SupabaseClient  // singleton, uses process.env public keys
```
