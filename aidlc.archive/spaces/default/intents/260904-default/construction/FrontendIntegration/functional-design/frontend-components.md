# Frontend Components — Unit 4: FrontendIntegration

## contexts/coin-context.tsx

### State Changes

| State | Old | New |
|---|---|---|
| `coins` | `number` | `number` (unchanged) |
| `childName` | `string` | **REMOVED** |
| `ownedStickers` | `string[]` | `string[]` (unchanged) |
| `isLoaded` | `boolean` | `boolean` (unchanged) |
| `isCacheFallback` | — | **ADDED**: `boolean` |

### Interface Changes

| Member | Old | New |
|---|---|---|
| `addCoins` | `(amount: number) => void` | `(amount: number) => void` (unchanged, but now async internally) |
| `buySticker` | `(sticker: StickerItem) => boolean` | `(sticker: StickerRow) => Promise<boolean>` |
| `hasSticker` | `(id: string) => boolean` | `(id: string) => boolean` (unchanged) |
| `spendCoins` | `(amount: number) => boolean` | **REMOVED** |
| `childName` | `string` | **REMOVED** |
| `setChildName` | `(name: string) => void` | **REMOVED** |
| `isLoaded` | `boolean` | **ADDED** to interface |
| `isCacheFallback` | — | **ADDED**: `boolean` |

### Removed Exports
- `export interface StickerItem` — replaced by `StickerRow` from `@/lib/database.types`

### New Imports
- `import { useAuth } from '@/contexts/auth-context'`
- `import type { StickerRow } from '@/lib/database.types'`

---

## app/page.tsx

### Removed
- `WelcomeForm` import and usage
- `import { WelcomeForm } from "@/components/welcome-form"`
- Local `name` state and all handlers: `handleStart`, `handleBack`, `handleReset`
- `localStorage.getItem("kidName")` reads
- "Welcome back" screen (name-based routing)

### Added
- `import { AuthProvider } from '@/contexts/auth-context'`
- `import { WelcomeScreen } from '@/components/welcome-screen'`
- `useAuth()` in `HomeContent`
- `AuthProvider` wrapper in `Home()`

### Provider Tree Change

```tsx
// OLD:
<ThemeProvider><LanguageProvider><CoinProvider><HomeContent /></CoinProvider></LanguageProvider></ThemeProvider>

// NEW:
<ThemeProvider><LanguageProvider><AuthProvider><CoinProvider><HomeContent /></CoinProvider></AuthProvider></LanguageProvider></ThemeProvider>
```

### Routing Logic

```tsx
// OLD: routes on local name state
// NEW: routes on isAuthenticated from AuthContext
if (showDashboard && isAuthenticated) return <Dashboard onBack={handleBack} />
return <WelcomeScreen />
```

### data-testid changes
- `data-testid="welcome-back-screen"` — **REMOVED** (entire welcome-back section removed)
- `data-testid="continue-button"` — **REMOVED**
- `data-testid="reset-button"` — **REMOVED**

---

## components/dashboard.tsx

### Props Change (Q3=A)

```typescript
// OLD:
interface DashboardProps { name: string; onBack: () => void }

// NEW:
interface DashboardProps { onBack: () => void }
```

### Internal Changes
- Added: `const { player } = useAuth()`
- All `{name}` references → `{player?.name ?? ''}`
- `handleQuizComplete` signature: `() => void` → `(category: string, score: number, totalQuestions: number) => void`
- Fires `POST /api/quiz/history` inline (fire-and-forget)
- `onQuizComplete` prop passed to `LearningZone` changes type

### LearningZone prop update

```tsx
// OLD:
<LearningZone onQuizComplete={handleQuizComplete} ... />
// handleQuizComplete: () => void

// NEW:
<LearningZone onQuizComplete={handleQuizComplete} ... />
// handleQuizComplete: (category, score, totalQuestions) => void
```

### New Imports
- `import { useAuth } from '@/contexts/auth-context'`

---

## components/sticker-shop.tsx

### Props Unchanged
`{ name, onBack, onGoToCreative }` — `name` prop removed from Dashboard propagation but StickerShop still receives it for display.

Actually: `name` prop in StickerShop is NOT used in the component body (checked) — it was only required by interface. Remove `name` from StickerShop props as well.

```typescript
// OLD: interface StickerShopProps { name: string; onBack: () => void; onGoToCreative: () => void }
// NEW: interface StickerShopProps { onBack: () => void; onGoToCreative: () => void }
```

### State Added
```typescript
const [catalog, setCatalog] = useState<StickerRow[]>([])
const [catalogLoading, setCatalogLoading] = useState(true)
const [purchasingStickerId, setPurchasingStickerId] = useState<string | null>(null)
```

### Removed
- `import { allStickers, getStickersByCategory } from "@/data/stickers"`
- `const currentStickers = getStickersByCategory(activeTab)` → replaced by `catalog.filter(...)`
- `const totalCount = allStickers.length` → `catalog.length`
- `StickerItem` type references → `StickerRow`

### New Imports
- `import { useEffect } from "react"` (added to existing import)
- `import type { StickerRow } from "@/lib/database.types"`

### handleBuy becomes async
```typescript
// OLD: const handleBuy = (sticker: typeof allStickers[0]) => { if (buySticker(sticker)) {...} }
// NEW: const handleBuy = async (sticker: StickerRow) => {
//   setPurchasingStickerId(sticker.id)
//   const success = await buySticker(sticker)
//   setPurchasingStickerId(null)
//   if (success) { ... animation ... }
// }
```

### Buy button state (loading state per Q1=A)
```tsx
disabled={owned || purchasingStickerId === sticker.id || !canAfford}
// Loading indicator when purchasingStickerId === sticker.id
```

### data-testid additions
- `data-testid="catalog-loading"` — on loading skeleton/spinner while fetching catalog

---

## components/creative-room.tsx

### PlacedSticker Type Change (Q2=A)

```typescript
// OLD:
interface PlacedSticker {
  id: string
  stickerId: string
  x: number
  y: number
  scale: number
}

// NEW (aligned to CanvasItem):
interface PlacedSticker {
  id: string
  emoji: string
  x: number
  y: number
  scale: number
  rotation: number
}
```

### State Added
- No new state variables; uses existing `placedStickers` with new type

### Removed Imports
- `getStickerById` from `@/data/stickers` (no longer needed for render)
- Note: `allStickers` import KEPT for collection panel (`ownedStickerItems` filter)

### Removed Dependency
- `getStickerById(placed.stickerId)` calls — replaced by `placed.emoji` directly

### New canvas save effect
```typescript
useEffect(() => {
  // Skip on initial mount (prevent saving empty canvas before load)
  if (!canvasLoaded) return
  const timer = setTimeout(() => {
    fetch('/api/players/canvas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasData: placedStickers })
    }).catch(() => {})
  }, 300)
  return () => clearTimeout(timer)
}, [placedStickers])
```

### State Added
```typescript
const [canvasLoaded, setCanvasLoaded] = useState(false)
```

### New sticker placement (collection panel drag)

```typescript
// OLD: { id: `${stickerId}-${Date.now()}`, stickerId, x, y, scale: 1 }
// NEW: { id: `item-${Date.now()}`, emoji: sticker.emoji, x, y, scale: 1, rotation: 0 }
```

Note: `sticker.emoji` here comes from `ownedStickerItems` (still from `allStickers` static lookup).

---

## components/learning-zone.tsx

### Props Change

```typescript
// OLD:
interface LearningZoneProps {
  onQuizComplete: () => void
  // ...
}

// NEW:
interface LearningZoneProps {
  onQuizComplete: (category: string, score: number, totalQuestions: number) => void
  // ...
}
```

### handleQuizCompleteInternal Change

```typescript
// OLD: const handleQuizCompleteInternal = () => { setActiveQuiz(null); onQuizComplete() }

// NEW:
const handleQuizCompleteInternal = (score: number, totalQuestions: number) => {
  fetch('/api/quiz/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: activeQuiz, score, totalQuestions, coinsEarned: 10 })
  }).catch(() => {})

  setActiveQuiz(null)
  onQuizComplete(activeQuiz!, score, totalQuestions)
}
```

### QuizModal prop update

```tsx
// OLD: onComplete={handleQuizCompleteInternal}   // () => void
// NEW: onComplete={handleQuizCompleteInternal}   // (score, totalQuestions) => void
```

---

## components/quiz-modal.tsx

### onComplete signature

```typescript
// OLD: onComplete: () => void
// NEW: onComplete: (score: number, totalQuestions: number) => void

// Call site change:
// OLD: onComplete()
// NEW: onComplete(score, questions.length)
// score is already in local state as useState<number>(0)
```

---

## .env.local.example (new file)

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anon Key (safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role Key (server-only — NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
