# Component Inventory

## Application Packages

This is a single-package Next.js application. All code resides in one monorepo root.

| Module | Type | Files | Purpose |
|---|---|---|---|
| App Pages | Application | 2 | Next.js App Router pages (layout + home) |
| Contexts | State Management | 3 | Global state via React Context API |
| Feature Components | Application | 10 | Core user-facing feature screens |
| UI Library | Shared | 40+ | shadcn/ui Radix-based primitives |
| Data | Static Content | 2 | Translations + sticker catalog |
| Hooks | Utilities | 2 | Reusable React hooks |
| Utilities | Utilities | 1 | Class name utility |

## Infrastructure Packages

None. No cloud infrastructure, CDK, Terraform, or containerization.

**Deployment**: Vercel (inferred from `@vercel/analytics` dependency)

## Shared Packages

| Package | Purpose |
|---|---|
| `data/translations.ts` | Complete bilingual (vi/en) string table shared across all feature components |
| `data/stickers.ts` | Sticker catalog with type, emoji, pricing — shared by Shop and Creative Room |
| `lib/utils.ts` | `cn()` Tailwind class merge helper |
| `contexts/coin-context.tsx` | Economy state shared across Dashboard, Shop, Creative Room, Learning Zone |
| `contexts/language-context.tsx` | i18n shared across all components |
| `contexts/theme-context.tsx` | Theme state shared across all components |

## Test Packages

None. No test framework, test files, or test configuration detected.

**Note**: Components contain `data-testid` attributes throughout, indicating test readiness but no tests are currently implemented.

## Feature Component Detail

| Component | File | Key Dependencies | Status |
|---|---|---|---|
| Home (root page) | `app/page.tsx` | All 3 contexts | Active |
| Dashboard | `components/dashboard.tsx` | CoinContext, LanguageContext | Active |
| LearningZone | `components/learning-zone.tsx` | LanguageContext, translations | Active |
| QuizModal | `components/quiz-modal.tsx` | LanguageContext | Active |
| StickerShop | `components/sticker-shop.tsx` | CoinContext, LanguageContext, stickers | Active |
| CreativeRoom | `components/creative-room.tsx` | CoinContext, LanguageContext, stickers, framer-motion | Active |
| WelcomeForm | `components/welcome-form.tsx` | LanguageContext | Active |
| WelcomeScreen | `components/welcome-screen.tsx` | LanguageContext | Active (likely used by Home) |
| CoinDisplay | `components/coin-display.tsx` | CoinContext, LanguageContext | Active (header widget) |
| ThemeSwitcher | `components/theme-switcher.tsx` | ThemeContext, LanguageContext | Active |
| LanguageSwitcher | `components/language-switcher.tsx` | LanguageContext | Active |
| FloatingElements | `components/floating-elements.tsx` | None | Active (decorative) |
| Fireworks | `components/fireworks.tsx` | None | Active (animation) |
| ThemeProvider (wrapper) | `components/theme-provider.tsx` | next-themes | Partially active |

## UI Library Components (shadcn/ui)

40+ components in `components/ui/`. Not all are used by the current feature set.

**Likely used**: button, card, badge, dialog, input, label, progress, select, tabs, toast, toaster
**Likely unused**: accordion, alert-dialog, aspect-ratio, avatar, breadcrumb, calendar, carousel, chart, command, context-menu, drawer, form, hover-card, input-group, input-otp, item, kbd, menubar, navigation-menu, pagination, popover, radio-group, resizable, scroll-area, separator, sheet, sidebar, slider, sonner, spinner, switch, toggle, toggle-group, tooltip

## Total Count

| Category | Count |
|---|---|
| **Total source files** | ~80 |
| Application pages | 2 |
| Context providers | 3 |
| Feature components | 13 |
| UI library components | 40+ |
| Data modules | 2 |
| Hooks | 2 |
| Utilities | 1 |
| Config/types | 5 |
| **Infrastructure packages** | 0 |
| **Test packages** | 0 |
