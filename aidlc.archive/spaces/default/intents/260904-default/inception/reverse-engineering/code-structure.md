# Code Structure

## Build System
- **Type**: npm / pnpm
- **Framework**: Next.js 16 (App Router)
- **Key Build Files**:
  - `package.json` — dependencies, scripts (dev/build/start/lint)
  - `pnpm-lock.yaml` — lockfile
  - `tsconfig.json` — TypeScript configuration
  - `components.json` — shadcn/ui component registry configuration
  - `next.config.*` — (not present, using defaults)

## Key Classes/Modules

### Context Layer (Global State)

```
CoinContext (coin-context.tsx)
  - State: coins, childName, ownedStickers[], isLoaded
  - Operations: addCoins(), spendCoins(), buySticker(), hasSticker()
  - Persistence: localStorage (kidCoins, kidName, kidStickers)

LanguageContext (language-context.tsx)
  - State: language ("vi" | "en")
  - Operations: setLanguage(), t(section, key) -> string
  - Persistence: localStorage (kids-app-language)

ThemeContext (theme-context.tsx)
  - State: theme ("forest" | "pink" | "ocean")
  - Operations: setTheme()
  - Persistence: localStorage (kids-theme)
  - Side Effect: applies CSS class to document.documentElement
```

### Page Layer

```
Home (app/page.tsx)
  - State: name (string|null), showDashboard (boolean)
  - Routes: WelcomeForm -> Dashboard
  - Wraps: ThemeProvider > LanguageProvider > CoinProvider > HomeContent
```

### Feature Components

```
Dashboard (components/dashboard.tsx)
  - State: showFireworks (boolean), currentView ("dashboard"|"shop"|"creative"|"learning")
  - Routes: Dashboard -> StickerShop | CreativeRoom | LearningZone
  - Triggers: handleQuizComplete -> addCoins(10) + showFireworks

LearningZone (components/learning-zone.tsx)
  - State: activeQuiz (string|null), activeTab ("preschool"|"grade1")
  - Data: quizData (static), mathQuestions (generated via useMemo)
  - Routes: category card click -> QuizModal

QuizModal (components/quiz-modal.tsx)
  - State: currentQuestion, selectedAnswer, isCorrect, score, isFinished
  - Flow: question -> answer -> feedback -> next -> ... -> results -> onComplete()

StickerShop (components/sticker-shop.tsx)
  - State: activeTab (category), purchaseAnimation (string|null)
  - Source: data/stickers.ts

CreativeRoom (components/creative-room.tsx)
  - State: selectedCharacter, placedStickers[], draggingSticker, selectedPlacedSticker
  - Engine: Framer Motion for drag-and-drop
  - Characters: 6 inline SVG avatars (boy/girl/panda/fox/unicorn/bunny)
```

### Data Layer

```
data/translations.ts
  - Type: Static lookup object
  - Structure: translations[section][key][language] -> string
  - Sections: common, welcome, dashboard, categories, quiz, quizShapes,
              quizColors, quizAnimals, quizMath, quizVietnamese,
              quizEnglish, shop, creative, stickers, themes, language

data/stickers.ts
  - allStickers: StickerItem[] (22 items across 4 categories)
  - StickerItem: { id, name, category, emoji, price }
  - Categories: hat (6), glasses (5), bow (5), toy (6)
  - Price range: 10–40 coins
  - Utility: getStickersByCategory(), getStickerById()
```

### Existing Files Inventory

**Application Pages**
- `app/layout.tsx` — Root Next.js layout, global font + analytics
- `app/page.tsx` — Home page, provider composition, session routing

**Contexts**
- `contexts/coin-context.tsx` — Virtual economy state + localStorage persistence
- `contexts/language-context.tsx` — Bilingual i18n state + translation function
- `contexts/theme-context.tsx` — Visual theme state + CSS class application

**Feature Components**
- `components/dashboard.tsx` — Main navigation hub with 3 activity zones
- `components/learning-zone.tsx` — Quiz category browser with preschool/Grade1 tabs
- `components/quiz-modal.tsx` — Interactive multiple-choice quiz modal
- `components/sticker-shop.tsx` — Coin-based sticker storefront
- `components/creative-room.tsx` — Drag-and-drop character decoration canvas
- `components/welcome-form.tsx` — Name entry form for session initialization
- `components/welcome-screen.tsx` — Welcome screen display component
- `components/coin-display.tsx` — Header coin balance display widget
- `components/theme-switcher.tsx` — Visual theme selection UI
- `components/language-switcher.tsx` — Language selection UI
- `components/floating-elements.tsx` — Decorative animated background elements
- `components/fireworks.tsx` — Celebration particle animation effect
- `components/theme-provider.tsx` — next-themes integration (separate from custom ThemeContext)

**Data**
- `data/translations.ts` — Complete bilingual string table (vi/en)
- `data/stickers.ts` — Sticker catalog with IDs, emojis, categories, prices

**Hooks**
- `hooks/use-mobile.ts` — Mobile breakpoint detection hook
- `hooks/use-toast.ts` — Toast notification hook (shadcn/ui)

**Utilities**
- `lib/utils.ts` — Tailwind class merge utility (cn())

**Shadcn/UI Components** (`components/ui/`)
- 40+ pre-built UI primitives (accordion, button, card, dialog, form, input, etc.)
- Not all are actively used in the current feature set

**Config / Types**
- `next-env.d.ts` — Next.js TypeScript type declarations
- `tsconfig.json` — TypeScript configuration
- `components.json` — shadcn/ui registry

## Design Patterns

### Context + Provider Pattern
- **Location**: All three context files
- **Purpose**: Global state management without external state libraries
- **Implementation**: React.createContext + Provider component + custom hook (useCoins, useLanguage, useTheme)

### View Router via State
- **Location**: `app/page.tsx` (name/showDashboard), `components/dashboard.tsx` (currentView)
- **Purpose**: SPA navigation without Next.js routing for sub-views
- **Implementation**: useState + conditional rendering of feature components

### Static Data Module
- **Location**: `data/translations.ts`, `data/stickers.ts`
- **Purpose**: Centralized content/data outside of components
- **Implementation**: Typed const objects exported and consumed directly

### Inline SVG Avatar Generation
- **Location**: `components/creative-room.tsx` (getCharacterSVG function)
- **Purpose**: Avoid dependency on external image files for character avatars
- **Implementation**: Switch-style conditional SVG element rendering

## Critical Dependencies

### framer-motion
- **Version**: ^11.15.0
- **Usage**: CreativeRoom drag-and-drop sticker placement and movement
- **Purpose**: Provides smooth, physics-based drag interaction

### next
- **Version**: 16.2.0
- **Usage**: App Router, font optimization, build system
- **Purpose**: Core framework

### react / react-dom
- **Version**: 19.2.4
- **Usage**: All components
- **Purpose**: Core UI library

### tailwindcss
- **Version**: ^4.2.0
- **Usage**: All styling
- **Purpose**: Utility-first CSS framework

### @radix-ui (various)
- **Version**: Various (1.x-2.x)
- **Usage**: shadcn/ui component library base
- **Purpose**: Accessible headless UI primitives (partially used)

### lucide-react
- **Version**: ^0.564.0
- **Usage**: All icons throughout the app
- **Purpose**: Icon library

### next-themes
- **Version**: ^0.4.6
- **Usage**: `components/theme-provider.tsx` (appears to be a secondary/unused theme provider alongside the custom ThemeContext)
- **Purpose**: System dark/light mode support (appears partially integrated)

### @vercel/analytics
- **Version**: 1.6.1
- **Usage**: `app/layout.tsx`
- **Purpose**: Page view and event analytics for Vercel deployment
