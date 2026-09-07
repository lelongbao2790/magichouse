# API Documentation

## REST APIs

**None.** Magic House has no backend REST API. It is a fully client-side application.

All data operations are performed locally against `window.localStorage`.

---

## Internal APIs (Component Interfaces)

### CoinContext API

Exposed via `useCoins()` hook — available to any component within `<CoinProvider>`.

| Method / Property | Signature | Description |
|---|---|---|
| `coins` | `number` | Current coin balance |
| `addCoins` | `(amount: number) => void` | Add coins to balance |
| `spendCoins` | `(amount: number) => boolean` | Deduct coins; returns false if insufficient balance |
| `childName` | `string` | Currently saved child name |
| `setChildName` | `(name: string) => void` | Update child name (also persists to localStorage) |
| `ownedStickers` | `string[]` | Array of owned sticker IDs |
| `buySticker` | `(sticker: StickerItem) => boolean` | Purchase sticker if affordable and not already owned |
| `hasSticker` | `(stickerId: string) => boolean` | Check if a sticker is already owned |

### LanguageContext API

Exposed via `useLanguage()` hook.

| Method / Property | Signature | Description |
|---|---|---|
| `language` | `"vi" \| "en"` | Currently active language |
| `setLanguage` | `(lang: Language) => void` | Switch language and persist |
| `t` | `(section: keyof translations, key: string) => string` | Translate a string key in the given section |

### ThemeContext API

Exposed via `useTheme()` hook.

| Method / Property | Signature | Description |
|---|---|---|
| `theme` | `"forest" \| "pink" \| "ocean"` | Currently active theme |
| `setTheme` | `(theme: ThemeType) => void` | Apply theme CSS class and persist |
| `themeName` | `string` | Human-readable theme name (in Vietnamese) |

---

## Component Props APIs

### Dashboard
```typescript
interface DashboardProps {
  name: string      // Child's display name
  onBack: () => void // Navigate back to Welcome screen
}
```

### LearningZone
```typescript
interface LearningZoneProps {
  name: string
  onBack: () => void
  onQuizComplete: () => void       // Called when any quiz finishes — triggers coin award + fireworks
  showFireworks: boolean           // Controlled by parent (Dashboard)
  onFireworksComplete: () => void  // Hide fireworks callback
}
```

### QuizModal
```typescript
interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void      // Called when user claims coins after finishing quiz
  title: string               // Displayed in modal header
  questions: Question[]       // Array of questions to present
  icon: React.ReactNode       // Icon shown next to quiz title
}

interface Question {
  question: string
  options: string[]          // Always exactly 3 options
  correctIndex: number       // 0-based index of correct option
}
```

### StickerShop
```typescript
interface StickerShopProps {
  name: string
  onBack: () => void
  onGoToCreative: () => void  // Navigate to Creative Room
}
```

### CreativeRoom
```typescript
interface CreativeRoomProps {
  name: string
  onBack: () => void
  onGoToShop: () => void  // Navigate to Sticker Shop
}
```

### WelcomeForm
```typescript
interface WelcomeFormProps {
  onStart: (name: string) => void  // Called with trimmed name on submit
}
```

### Fireworks
```typescript
interface FireworksProps {
  isActive: boolean         // Show/hide the animation
  onComplete: () => void    // Called when animation finishes
}
```

---

## Data Models

### StickerItem
```typescript
interface StickerItem {
  id: string                             // Unique identifier (e.g., "hat-crown")
  name: string                           // Display name (Vietnamese, unaccented)
  category: "hat" | "glasses" | "bow" | "toy"
  emoji: string                          // Unicode emoji character
  price: number                          // Cost in coins (range: 10-40)
}
```

### PlacedSticker (Creative Room internal state)
```typescript
interface PlacedSticker {
  id: string       // Unique instance ID (stickerId + timestamp)
  stickerId: string  // Reference to StickerItem.id
  x: number        // Position as percentage of canvas width (0-100)
  y: number        // Position as percentage of canvas height (0-100)
  scale: number    // Size multiplier (0.5 - 2.5, default 1.0)
}
```

### Translation Structure
```typescript
type Language = "vi" | "en"

// translations[section][key][language] -> string
const translations = {
  common: { back: { vi: "...", en: "..." }, ... },
  welcome: { ... },
  dashboard: { ... },
  categories: { ... },
  quiz: { ... },
  quizShapes: { ... },   // 10 questions * (question + 3 options) = 40 keys
  quizColors: { ... },   // 10 questions * 4 keys = 40 keys
  quizAnimals: { ... },  // 10 questions * 4 keys = 40 keys
  quizMath: { ... },     // Title only (questions generated dynamically)
  quizVietnamese: { ... }, // 3 questions
  quizEnglish: { ... },  // 10 questions
  shop: { ... },
  creative: { ... },
  stickers: { ... },     // 16 sticker name translations
  themes: { ... },
  language: { ... },
}
```

---

## localStorage Schema

| Key | Type | Description |
|---|---|---|
| `kidName` | `string` | Child's display name |
| `kidCoins` | `string` (number) | Coin balance (stored as string) |
| `kidStickers` | `string` (JSON array) | Array of owned sticker IDs |
| `kids-theme` | `"forest" \| "pink" \| "ocean"` | Selected theme |
| `kids-app-language` | `"vi" \| "en"` | Selected language |
