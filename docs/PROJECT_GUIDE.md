# 🗺️ Project Intelligence & Architecture Guide

## 1. Project Identity
- **Name:** Magic House
- **Core Purpose:** An interactive educational web app for children, teaching coding and knowledge through games, quizzes, and creative activities.
- **Primary Stack:** Next.js (React 19), TypeScript, Tailwind CSS, Radix UI, pnpm
- **Target Environment:** Localhost (Node.js), deployable to Vercel or similar

## 2. Directory Structure (The Map)
| Directory      | Responsibility / Content                                 |
|:-------------- |:--------------------------------------------------------|
| app/           | Main Next.js app entry, layouts, and pages               |
| components/    | UI components (dashboard, shop, creative room, etc.)     |
| contexts/      | React Contexts for coins, language, and theme            |
| data/          | Static data (stickers, translations)                     |
| lib/           | Utility functions                                        |
| public/        | Static assets (images, icons)                            |
| styles/        | Global CSS (Tailwind, custom styles)                     |

## 3. Architecture & Data Flow
- **Architecture Style:** Modular React with Context Providers
- **Data Flow:**
  - App loads with `RootLayout` (app/layout.tsx), wrapping children in context providers.
  - `Home` (app/page.tsx) manages user state (name, dashboard view) and renders the main dashboard or welcome form.
  - Contexts (`coin-context`, `language-context`, `theme-context`) manage global state (coins, language, theme) and persist to localStorage.
  - Components consume context and update UI or trigger actions (e.g., earning coins, switching language/theme).
  - Data (stickers, translations) is imported from `data/` and used in UI and logic.
- **Naming Conventions:** PascalCase for components, camelCase for variables/functions, kebab-case for CSS classes.

## 4. Development Workflow & Rules
- Use async/await for I/O and effects.
- Error handling via React error boundaries and context checks.
- Follow existing patterns in `app/` and `components/`.
- No new features without corresponding tests (see `.github/docs/05_TESTING_GUIDE.md`).
