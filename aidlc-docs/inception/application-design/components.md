# Component Definitions — Supabase Backend Integration

## Frontend Contexts

### AuthContext (`contexts/auth-context.tsx`) — NEW
- **Purpose**: Manages Supabase authentication session and player identity across the app
- **Responsibilities**:
  - Hold current Supabase session and player profile (id, name, coins baseline)
  - Expose signUp, signIn, signOut methods that call `/api/auth/*` routes
  - On mount: call `/api/auth/session` to restore session from cookie
  - Provide `isLoading` and `isAuthenticated` flags to all consumers
- **Type**: Application (State Management)

### CoinContext (`contexts/coin-context.tsx`) — REFACTORED
- **Purpose**: Global state for coins and sticker ownership, backed by Supabase via API
- **Responsibilities**:
  - Load coins and owned stickers from `/api/players/me` and `/api/players/stickers` on auth
  - Expose addCoins (calls `/api/players/coins`), buySticker (calls `/api/players/stickers`)
  - Write-through cache: update localStorage after every successful API response
  - On API failure: fall back to localStorage cache silently (`isCacheFallback` flag)
  - Trigger localStorage migration via `/api/players/migrate` on first login
- **Type**: Application (State Management)

---

## Frontend UI Components

### LoginView (`components/login-view.tsx`) — NEW
- **Purpose**: Email + password login form shown when user is unauthenticated
- **Responsibilities**:
  - Controlled form: email, password
  - Call `AuthContext.signIn()` on submit
  - Display inline error on failure
  - Provide link to navigate to RegisterView
- **Type**: Application (UI)

### RegisterView (`components/register-view.tsx`) — NEW
- **Purpose**: Account creation form with child name, email, and password
- **Responsibilities**:
  - Controlled form: childName, email, password
  - Call `AuthContext.signUp()` on submit
  - On success: auto-logged in (no email verification), redirect to Dashboard
  - Display inline error on failure
  - Provide link to navigate back to LoginView
- **Type**: Application (UI)

### Dashboard (`components/dashboard.tsx`) — MODIFIED
- **Purpose**: Main navigation hub post-login
- **Responsibilities**:
  - Read child name from `AuthContext.player.name` (not localStorage)
  - Orchestrate quiz completion: call `CoinContext.addCoins()` + record quiz history
  - Render navigation cards: Shop, Creative Room, Learning Zone
- **Type**: Application

### StickerShop (`components/sticker-shop.tsx`) — REFACTORED
- **Purpose**: In-app store for sticker purchases
- **Responsibilities**:
  - Fetch catalog from `/api/stickers` on mount (in-memory cache after first fetch)
  - Read owned stickers from `CoinContext.ownedStickers`
  - Delegate purchase to `CoinContext.buySticker()`
- **Type**: Application

### CreativeRoom (`components/creative-room.tsx`) — REFACTORED
- **Purpose**: Character decoration canvas with persistent state
- **Responsibilities**:
  - On mount: call `/api/players/canvas` (GET) to load saved canvas
  - On canvas change: debounce 300 ms, then call `/api/players/canvas` (PUT) to save
  - Drag-and-drop sticker placement (Framer Motion, unchanged logic)
  - Read owned stickers from `CoinContext.ownedStickers`
- **Type**: Application

### LearningZone (`components/learning-zone.tsx`) — MINIMALLY MODIFIED
- **Purpose**: Educational quiz hub (unchanged quiz logic)
- **Responsibilities**:
  - On quiz complete: call `CoinContext.addCoins(10)` AND call `/api/quiz/history` (POST) directly
  - All quiz generation logic unchanged (pure functions)
- **Type**: Application

### WelcomeScreen (`components/welcome-screen.tsx`) — REFACTORED
- **Purpose**: Auth gate — renders LoginView or RegisterView based on navigation state
- **Responsibilities**:
  - Track local state: `view: "login" | "register"`
  - Render `<LoginView>` or `<RegisterView>` based on state
  - Pass `onNavigate` callback to switch between views
- **Type**: Application (Navigation Shell)

---

## Supabase Utilities (`lib/supabase/`)

### Server Client (`lib/supabase/server.ts`) — NEW
- **Purpose**: Create a Supabase client bound to the current request's session cookie
- **Responsibilities**: Used exclusively in API route handlers; reads/writes session via Next.js cookies
- **Type**: Infrastructure Utility

### Browser Client (`lib/supabase/client.ts`) — NEW
- **Purpose**: Create a singleton Supabase browser client
- **Responsibilities**: Used exclusively in AuthContext for session management (signIn, signUp, signOut, onAuthStateChange)
- **Type**: Infrastructure Utility

---

## API Response Helper (`lib/api-response.ts`) — NEW
- **Purpose**: Standardize all API route responses into `{ data, error }` envelope
- **Responsibilities**:
  - `apiSuccess<T>(data: T)` → `NextResponse` with `{ data, error: null }`
  - `apiError(message, status)` → `NextResponse` with `{ data: null, error: message }`
- **Type**: Infrastructure Utility

---

## Validation Schemas (`lib/validation/api.ts`) — NEW
- **Purpose**: Zod schemas for all API request bodies
- **Responsibilities**: Exported schemas for signup, login, addCoins, buySticker, canvas save, quiz history recording
- **Type**: Infrastructure Utility

---

## API Route Handlers (`app/api/`) — ALL NEW

| Handler | Route | HTTP |
|---|---|---|
| `auth/signup/route.ts` | `/api/auth/signup` | POST |
| `auth/login/route.ts` | `/api/auth/login` | POST |
| `auth/logout/route.ts` | `/api/auth/logout` | POST |
| `auth/session/route.ts` | `/api/auth/session` | GET |
| `players/me/route.ts` | `/api/players/me` | GET |
| `players/coins/route.ts` | `/api/players/coins` | POST |
| `players/migrate/route.ts` | `/api/players/migrate` | POST |
| `players/stickers/route.ts` | `/api/players/stickers` | GET, POST |
| `players/canvas/route.ts` | `/api/players/canvas` | GET, PUT |
| `stickers/route.ts` | `/api/stickers` | GET |
| `quiz/history/route.ts` | `/api/quiz/history` | GET, POST |

- **Shared responsibilities per handler**: validate input (Zod), verify session (server Supabase client), delegate to service layer, return `apiSuccess` or `apiError`
- **Type**: API (Next.js App Router Route Handlers)

---

## Service Layer (`lib/services/`) — ALL NEW

### player.ts
- **Purpose**: Player profile and coin CRUD against Supabase
- **Type**: Service

### stickers.ts
- **Purpose**: Sticker catalog queries and ownership management
- **Type**: Service

### canvas.ts
- **Purpose**: Creative Room canvas read/write
- **Type**: Service

### quiz.ts
- **Purpose**: Quiz history record insertion and retrieval
- **Type**: Service
