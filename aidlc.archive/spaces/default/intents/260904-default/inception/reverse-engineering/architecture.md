# System Architecture

## System Overview

Magic House is a single-page Next.js 16 application using the App Router paradigm. It is a fully client-side React 19 application with no backend API — all state is persisted to browser localStorage. The UI is built with Tailwind CSS v4 and Radix UI primitives. It is deployed on Vercel (indicated by `@vercel/analytics` integration).

## Architecture Diagram

```
+----------------------------------------------------------+
|                   BROWSER (Client-Side Only)             |
|                                                          |
|  +----------------------------------------------------+  |
|  |             Next.js 16 App Router                  |  |
|  |                  app/layout.tsx                    |  |
|  |          (Nunito font, Vercel Analytics)           |  |
|  |                                                    |  |
|  |  +----------------------------------------------+ |  |
|  |  |            app/page.tsx (Home)                | |  |
|  |  |                                               | |  |
|  |  |  +------------------------------------------+| |  |
|  |  |  |         Context Providers                 || |  |
|  |  |  |  ThemeProvider > LanguageProvider >       || |  |
|  |  |  |  CoinProvider > HomeContent               || |  |
|  |  |  +------------------------------------------+| |  |
|  |  |                                               | |  |
|  |  |  +------------------+  +------------------+  | |  |
|  |  |  |  WelcomeScreen   |  |    Dashboard     |  | |  |
|  |  |  |  (name entry)    |  |  (nav hub)       |  | |  |
|  |  |  +------------------+  +--+---+---+-------+  | |  |
|  |  |                           |   |   |           | |  |
|  |  |          +----------------+   |   +--------+  | |  |
|  |  |          v                    v            v   | |  |
|  |  |  +-----------+  +----------+  +----------+    | |  |
|  |  |  | Learning  |  | Sticker  |  | Creative |    | |  |
|  |  |  | Zone      |  | Shop     |  | Room     |    | |  |
|  |  |  +-----------+  +----------+  +----------+    | |  |
|  |  |       |                                        | |  |
|  |  |       v                                        | |  |
|  |  |  +-----------+                                 | |  |
|  |  |  | Quiz      |                                 | |  |
|  |  |  | Modal     |                                 | |  |
|  |  |  +-----------+                                 | |  |
|  |  +-----------------------------------------------+ |  |
|  +----------------------------------------------------+  |
|                           |                              |
|            +--------------+-----------+                  |
|            |         localStorage     |                  |
|            |  kidName / kidCoins /    |                  |
|            |  kidStickers / theme /   |                  |
|            |  language preference     |                  |
|            +-------------------------+                   |
+----------------------------------------------------------+
                            |
            +---------------+---------------+
            v                               v
   +----------------+             +------------------+
   | Vercel Hosting |             | Vercel Analytics |
   | (Static/SSR)   |             | (Telemetry)      |
   +----------------+             +------------------+
```

## Component Descriptions

### app/layout.tsx
- **Purpose**: Root layout for Next.js App Router
- **Responsibilities**: Apply global font (Nunito), include Vercel Analytics, set HTML lang="vi"
- **Dependencies**: next/font/google, @vercel/analytics
- **Type**: Application

### app/page.tsx (HomeContent + Home)
- **Purpose**: Root page component; orchestrates context providers and top-level navigation state
- **Responsibilities**: Detect existing session (localStorage), route between WelcomeScreen and Dashboard, handle name set/reset
- **Dependencies**: All three context providers, WelcomeForm, Dashboard, FloatingElements
- **Type**: Application

### contexts/coin-context.tsx (CoinProvider)
- **Purpose**: Global state for the virtual economy
- **Responsibilities**: Manage coin balance, sticker ownership, child name; persist all to localStorage; expose addCoins, spendCoins, buySticker, hasSticker
- **Dependencies**: localStorage
- **Type**: Application (State Management)

### contexts/language-context.tsx (LanguageProvider)
- **Purpose**: Bilingual (vi/en) internationalization system
- **Responsibilities**: Track selected language, provide translation function `t(section, key)`, persist to localStorage
- **Dependencies**: data/translations.ts, localStorage
- **Type**: Application (State Management)

### contexts/theme-context.tsx (ThemeProvider)
- **Purpose**: Visual theme management
- **Responsibilities**: Track selected theme (forest/pink/ocean), apply CSS class to `document.documentElement`, persist to localStorage
- **Dependencies**: localStorage, CSS custom properties
- **Type**: Application (State Management)

### components/dashboard.tsx
- **Purpose**: Main navigation hub post-login
- **Responsibilities**: Render navigation cards for Shop/Creative/Learning, manage currentView state, orchestrate quiz completion flow (coin award + fireworks)
- **Dependencies**: CoinContext, LanguageContext, StickerShop, CreativeRoom, LearningZone, QuizModal, Fireworks, CoinDisplay
- **Type**: Application

### components/learning-zone.tsx
- **Purpose**: Educational content hub
- **Responsibilities**: Tab-based level selection, category card grid, static quiz data generation, math question generator, pass quiz data to QuizModal
- **Dependencies**: LanguageContext, QuizModal, Fireworks, data/translations.ts
- **Type**: Application

### components/quiz-modal.tsx
- **Purpose**: Interactive quiz experience
- **Responsibilities**: Render questions with multiple-choice answers, track score, show feedback, show results, trigger coin claim callback
- **Dependencies**: LanguageContext
- **Type**: Application

### components/sticker-shop.tsx
- **Purpose**: In-app store for sticker purchases
- **Responsibilities**: Category tab browsing, display sticker grid with buy/owned state, purchase animation, collection count
- **Dependencies**: CoinContext, LanguageContext, data/stickers.ts
- **Type**: Application

### components/creative-room.tsx
- **Purpose**: Character decoration canvas
- **Responsibilities**: Character selection, drag-and-drop sticker placement (Framer Motion), sticker resize/delete, canvas clear
- **Dependencies**: CoinContext, LanguageContext, data/stickers.ts, framer-motion
- **Type**: Application

### components/welcome-form.tsx
- **Purpose**: Name entry form for new/returning sessions
- **Responsibilities**: Controlled input for child name, form submission, decorative animations
- **Dependencies**: LanguageContext
- **Type**: Application

### components/fireworks.tsx
- **Purpose**: Celebration animation overlay
- **Responsibilities**: Render particle fireworks effect on quiz completion; auto-complete after duration
- **Type**: Application (UI Effect)

### components/coin-display.tsx
- **Purpose**: Header coin balance widget
- **Responsibilities**: Display current coin count from CoinContext
- **Dependencies**: CoinContext, LanguageContext
- **Type**: Application (UI Widget)

### components/theme-switcher.tsx / language-switcher.tsx
- **Purpose**: User controls for theme and language selection
- **Responsibilities**: Render selection UI, dispatch to ThemeContext / LanguageContext
- **Type**: Application (UI Widget)

### components/floating-elements.tsx
- **Purpose**: Decorative animated background elements on the welcome screen
- **Type**: Application (UI Decoration)

## Data Flow

```
User enters name
      |
      v
localStorage.setItem("kidName")
      |
      v
Dashboard shown --> User selects Learning Zone
      |
      v
LearningZone --> User picks category --> QuizModal opens
      |
      v
Quiz completes --> onComplete() --> addCoins(10) in CoinContext
      |
      v
localStorage.setItem("kidCoins") --> Fireworks displayed
      |
      v
User goes to Sticker Shop --> buySticker(sticker)
      |
      v
CoinContext: coins -= price, ownedStickers.push(id)
      |
      v
localStorage: kidCoins + kidStickers updated
      |
      v
User goes to Creative Room --> drags owned sticker to canvas
      |
      v
placedStickers state updated (in-memory only, NOT persisted)
```

## Integration Points

- **External APIs**: None (fully client-side)
- **Databases**: Browser localStorage only
- **Third-party Services**: Vercel Analytics (telemetry/page views)

## Infrastructure Components

- **Deployment Model**: Vercel (Next.js optimized hosting)
- **CDK/Terraform**: None
- **Networking**: Standard HTTPS via Vercel CDN
