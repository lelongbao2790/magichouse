# Technology Stack

## Programming Languages

| Language | Version | Usage |
|---|---|---|
| TypeScript | 5.7.3 | Primary language for all source files |
| TSX (React JSX) | — | All React component files |
| CSS | — | Tailwind utility classes + globals.css |

## Frameworks

| Framework | Version | Purpose |
|---|---|---|
| Next.js | 16.2.0 | App Router, server/client rendering, font optimization, build system |
| React | 19.2.4 | Core UI library, hooks, context API |
| React DOM | 19.2.4 | DOM rendering |
| Tailwind CSS | ^4.2.0 | Utility-first styling framework |
| Framer Motion | ^11.15.0 | Drag-and-drop animations (Creative Room) |

## UI Component Libraries

| Library | Version | Purpose |
|---|---|---|
| Radix UI (various) | 1.x – 2.x | Accessible headless UI primitives (via shadcn/ui) |
| shadcn/ui | via components.json | Pre-built component library built on Radix |
| Lucide React | ^0.564.0 | Icon library (SVG-based) |
| next-themes | ^0.4.6 | Dark/light mode support (partially integrated) |

## Form & Validation

| Library | Version | Purpose |
|---|---|---|
| React Hook Form | ^7.54.1 | Form state management (in UI library, not actively used in features) |
| @hookform/resolvers | ^3.9.1 | Schema-based form validation (unused in current features) |
| Zod | ^3.24.1 | Schema validation (unused in current features) |

## Data & State

| Mechanism | Type | Purpose |
|---|---|---|
| React Context API | Built-in | Global state (coins, language, theme) |
| localStorage | Browser API | State persistence across sessions |

## Animation & Effects

| Library | Version | Purpose |
|---|---|---|
| Framer Motion | ^11.15.0 | Drag-and-drop in Creative Room |
| Tailwind CSS animations | ^4.2.0 | Bounce, pulse, float, scale-pop CSS animations |
| tw-animate-css | 1.3.3 | Extended Tailwind animation utilities |

## Internationalization

| Mechanism | Type | Purpose |
|---|---|---|
| Custom `t()` function | Internal | Key-based bilingual string lookup (vi/en) |
| data/translations.ts | Static data | Complete string table for both languages |

## Infrastructure

| Service | Purpose |
|---|---|
| Vercel | Hosting and deployment (inferred) |
| Vercel Analytics | Page view and event telemetry |

## Build Tools

| Tool | Version | Purpose |
|---|---|---|
| npm / pnpm | — | Package management |
| TypeScript Compiler | 5.7.3 | Type checking and transpilation |
| PostCSS | ^8.5 | CSS processing for Tailwind |
| @tailwindcss/postcss | ^4.2.0 | Tailwind PostCSS integration |
| ESLint | — | Linting (via `next lint`) |

## Testing Tools

| Tool | Version | Purpose |
|---|---|---|
| — | — | **None configured** |

Note: Components contain `data-testid` attributes indicating future test intent, but no testing framework (Jest, Vitest, Playwright, Cypress) is installed.

## Utility Libraries

| Library | Version | Purpose |
|---|---|---|
| clsx | ^2.1.1 | Conditional class names |
| tailwind-merge | ^3.3.1 | Merging Tailwind classes without conflicts |
| class-variance-authority | ^0.7.1 | Component variant definitions (used in shadcn/ui) |
| date-fns | 4.1.0 | Date utilities (in UI library, not actively used in features) |
| recharts | 2.15.0 | Chart library (in UI library, not actively used) |
| embla-carousel-react | 8.6.0 | Carousel (in UI library, not actively used) |
| react-day-picker | 9.13.2 | Date picker (in UI library, not actively used) |
| react-resizable-panels | ^2.1.7 | Resizable panels (in UI library, not actively used) |
| vaul | ^1.1.2 | Drawer component (in UI library) |
| sonner | ^1.7.1 | Toast notifications (in UI library) |
| cmdk | 1.1.1 | Command palette (in UI library) |
| input-otp | 1.4.2 | OTP input (in UI library) |
