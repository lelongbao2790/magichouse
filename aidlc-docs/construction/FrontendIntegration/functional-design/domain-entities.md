# Domain Entities — Unit 4: FrontendIntegration

## Refactored Type Shapes

### CoinContext (refactored)

```typescript
// Removed: StickerItem interface, childName, setChildName, spendCoins
// Changed: buySticker now async; addCoins now fire-and-forget API
// Added: isLoaded, isCacheFallback

interface CoinContextType {
  coins: number
  ownedStickers: string[]       // array of owned sticker IDs
  isLoaded: boolean             // true once API data received (or fallback applied)
  isCacheFallback: boolean      // true if using localStorage due to API failure
  addCoins: (amount: number) => void       // optimistic + background POST
  buySticker: (sticker: StickerRow) => Promise<boolean>  // loading state, returns success
  hasSticker: (stickerId: string) => boolean
}
```

### PlacedSticker (creative-room.tsx) — aligned to CanvasItem (Q2=A)

```typescript
// OLD: { id: string; stickerId: string; x: number; y: number; scale: number }
// NEW: aligned to CanvasItem from database.types.ts

interface PlacedSticker {
  id: string        // unique instance ID, e.g. "item-1234567890"
  emoji: string     // emoji character stored directly (no stickerId lookup)
  x: number
  y: number
  scale: number
  rotation: number  // default 0 for new placements
}
// CanvasItem === PlacedSticker — no transform needed on load/save
```

### StickerShop catalog state

```typescript
// Fetched from GET /api/stickers on mount; replaces allStickers static import
const [catalog, setCatalog] = useState<StickerRow[]>([])
const [catalogLoading, setCatalogLoading] = useState(true)
const [purchasingStickerId, setPurchasingStickerId] = useState<string | null>(null)
```

### Dashboard (Q3=A — name prop removed)

```typescript
// OLD: interface DashboardProps { name: string; onBack: () => void }
// NEW:
interface DashboardProps {
  onBack: () => void
}
// Dashboard reads: const { player } = useAuth()  →  player.name
```

### LearningZone → Dashboard quiz completion thread

```typescript
// QuizModal.onComplete signature change:
// OLD: onComplete: () => void
// NEW: onComplete: (score: number, totalQuestions: number) => void

// LearningZone.onQuizComplete stays unchanged: () => void
// LearningZone intercepts score internally, fires POST /api/quiz/history
```

---

## API Call Contracts Per Component

### contexts/coin-context.tsx

| Action | Endpoint | When |
|---|---|---|
| Load player coins | `GET /api/players/me` | On player auth state → non-null |
| Load owned stickers | `GET /api/players/stickers` | On player auth state → non-null (parallel) |
| Add coins | `POST /api/players/coins` | After optimistic update (background) |
| Buy sticker | `POST /api/players/stickers` | During loading state (awaited) |
| Migrate | `POST /api/players/migrate` | First login if localStorage has data |

### components/sticker-shop.tsx

| Action | Endpoint | When |
|---|---|---|
| Fetch catalog | `GET /api/stickers` | On mount |

### components/creative-room.tsx

| Action | Endpoint | When |
|---|---|---|
| Load canvas | `GET /api/players/canvas` | On mount |
| Save canvas | `PUT /api/players/canvas` | On placedStickers change (300ms debounce) |

### components/learning-zone.tsx

| Action | Endpoint | When |
|---|---|---|
| Record quiz history | `POST /api/quiz/history` | After quiz complete (fire-and-forget) |

---

## localStorage Cache Keys (unchanged for migration compatibility)

| Key | Value | Written by |
|---|---|---|
| `kidCoins` | number (string) | CoinContext after API success |
| `kidStickers` | JSON string[] | CoinContext after API success |
| `migrationDone` | `"true"` | CoinContext after successful migration |
| `kidName` | string | Removed — no longer written; old value read for migration only |

---

## Provider Nesting Order (page.tsx)

```
ThemeProvider
  └── LanguageProvider
        └── AuthProvider          ← NEW (wraps everything)
              └── CoinProvider    ← moved inside AuthProvider
                    └── HomeContent
```

`CoinProvider` is nested inside `AuthProvider` so it can call `useAuth()` to watch player state.
