# Code Structure

## Build System

- **Type**: npm/Bun (package.json, bun.lock present; scripts use next)
- **Configuration**: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config` (PostCSS)
- **Test Runner**: Vitest (unit), Playwright (e2e)

## Key Files Inventory

### App Router (app/)
- `app/layout.tsx` — Root layout with context providers
- `app/page.tsx` — Main entry page (renders dashboard/login flow)
- `app/globals.css` — Global CSS
- `app/api/auth/` — Auth API routes (signup, login, logout)
- `app/api/players/` — Player API routes (me, coins, stickers, migrate)
- `app/api/quiz/history/route.ts` — Quiz history GET/POST endpoint
- `app/api/stickers/route.ts` — Sticker catalog endpoint

> **Refresh 2026-09-09**: The `grade2-subjects-coin-rewards` initiative shipped since this
> inventory was written. New files: `components/grade2-subject-view.tsx` (two-level Grade 2
> nav), `lib/coin-rewards.ts` (difficulty → coin calc), `automation_tests/unit/coin-rewards.test.ts`,
> `automation_tests/api/quiz-history.api.test.ts`, `automation_tests/e2e/grade2-subjects.spec.ts`,
> `automation_tests/e2e/smoke.spec.ts`. `learning-zone.tsx` now imports `grade2-subject-view`
> and `coin-rewards`; `quiz-modal.tsx` renders a difficulty badge. `data/translations.ts`
> gained `quizVietnameseGrade2` / `quizEnglishGrade2` (15 Q each). See
> `subject-content-findings.md` for the full picture this initiative targets.

### Components (components/)
- `components/learning-zone.tsx` — **PRIMARY TARGET**: Grade tabs, category cards, quiz launch. Builds `quizData` inline from `t()` calls (per-question `correctIndex` literals); `handleQuizCompleteInternal` now computes coins via `calculateSessionCoins`
- `components/grade2-subject-view.tsx` — Grade 2 subject cards (Math drill-down; Vietnamese/English route straight to `grade2Vietnamese` / `grade2English` quizzes)
- `components/quiz-modal.tsx` — Quiz question display, answer selection, completion screen
- `components/dashboard.tsx` — Main dashboard with feature navigation
- `components/coin-display.tsx` — Coin balance display widget
- `components/login-view.tsx` — Login form
- `components/register-view.tsx` — Registration form
- `components/creative-room.tsx` — Canvas-based sticker placement
- `components/fireworks.tsx` — Celebration animation
- `components/floating-elements.tsx` — Decorative background elements
- `components/language-switcher.tsx` — EN/VI toggle
- `components/theme-switcher.tsx` — Theme selection

### Contexts (contexts/)
- `contexts/auth-context.tsx` — Authentication state, player profile
- `contexts/coin-context.tsx` — **RELEVANT**: addCoins function called after quiz completion
- `contexts/language-context.tsx` — i18n with t() helper
- `contexts/theme-context.tsx` — Theme state

### Data (data/)
- `data/translations.ts` — **TARGET**: All UI strings in VI/EN. Contains categories, quiz labels
- `data/stickers.ts` — Static sticker metadata (client-side catalog)

### Library (lib/)
- `lib/database.types.ts` — **TARGET**: TypeScript types for Supabase schema. quiz_history.category enum includes addition/subtraction/timesTable but NOT subject-level groupings
- `lib/services/quiz.ts` — recordHistory, getHistory functions
- `lib/services/player.ts` — Player fetch/update functions
- `lib/services/stickers.ts` — Sticker purchase logic
- `lib/services/canvas.ts` — Canvas save/load
- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client (cookie-based)
- `lib/supabase/admin.ts` — Admin Supabase client
- `lib/api-response.ts` — Standardized API response helpers
- `lib/utils.ts` — Tailwind cn() utility
- `lib/validation/api.ts` — **TARGET**: Zod schemas. QuizHistorySchema has category enum

### Database (supabase/)
- `supabase/migrations/0001_initial_schema.sql` — Full schema with RLS policies
- `supabase/seed.sql` — Sticker catalog seed data
- `supabase/config.toml` — Supabase project config

### Tests (automation_tests/)
- `automation_tests/unit/learning-zone.test.ts` — Unit tests for question generators
- `automation_tests/unit/learning-zone.pbt.test.ts` — Property-based tests
- `automation_tests/e2e/smoke.spec.ts` — Playwright smoke tests

## Design Patterns

### Context + Custom Hook Pattern
- **Location**: All files under `contexts/`
- **Purpose**: Global state shared across components without prop drilling
- **Implementation**: React createContext + Provider + useX() hook

### Service Layer Pattern
- **Location**: `lib/services/`
- **Purpose**: Separates data access from UI components
- **Implementation**: Pure async functions accepting Supabase client as first argument

### API Route + Validation Pattern
- **Location**: `app/api/*/route.ts`
- **Purpose**: Type-safe, validated server-side endpoints
- **Implementation**: Zod schema parse → service call → apiSuccess/apiError response

## Critical Dependencies

### next@16.2.0
- **Usage**: Core framework — App Router, API Routes, SSR
- **Purpose**: Full-stack React framework

### @supabase/ssr@^0 + @supabase/supabase-js@^2
- **Usage**: Database and auth client throughout lib/supabase/
- **Purpose**: Backend-as-a-service: auth, PostgreSQL, RLS

### zod@^3.24.1
- **Usage**: lib/validation/api.ts
- **Purpose**: Runtime type validation for API requests

### tailwindcss@^4.2.0
- **Usage**: All component className strings
- **Purpose**: Utility-first CSS styling

### vitest@^3.0.0 + @playwright/test@1.63.0
- **Usage**: automation_tests/
- **Purpose**: Unit testing and E2E testing
