# Technology Stack

## Programming Languages
- TypeScript 5.7.3 — All source code
- SQL — Database migrations and seed data

## Frameworks
- Next.js 16.2.0 — Full-stack React framework (App Router)
- React 19.2.4 — UI library
- Tailwind CSS 4.2.0 — Utility-first CSS

## Backend / Infrastructure
- Supabase (hosted) — PostgreSQL database, Auth, Row-Level Security
- Vercel — Deployment target (inferred from @vercel/analytics)

## UI Libraries
- Radix UI — Headless accessible component primitives
- Lucide React 0.564.0 — Icon library
- Framer Motion 11.15.0 — Animation
- next-themes 0.4.6 — Theme switching

## Validation
- Zod 3.24.1 — Runtime schema validation

## Build Tools
- Bun — Package manager (bun.lock present)
- npm — Alternative (package-lock.json also present)
- Webpack — Bundler (configured via next dev --webpack)
- PostCSS — CSS processing

## Testing Tools
- Vitest 3.0.0 — Unit and integration test runner
- @playwright/test 1.63.0 — End-to-end tests
- @vitest/coverage-v8 — Code coverage
- fast-check 3.22.0 — Property-based testing library
- jsdom — DOM simulation for unit tests
