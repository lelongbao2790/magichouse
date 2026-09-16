# Tech Stack Decisions — U2: my-house-ui

**Status**: Draft (NFR Requirements)
**Last updated**: 2026-09-14

Brownfield unit — no new technology introduced.

---

## Drag-and-Drop

Framer Motion (`framer-motion`, already a dependency) — identical usage pattern to
`creative-room.tsx` (`drag`, `dragMomentum={false}`, `dragElastic={0}`, `onDragEnd` computing
percentage-of-canvas-rect position). No new library.

## Data Fetching

Plain `fetch` via two dedicated hooks (`useHouseItems`, `useRooms`, both module-cached) plus one
direct `fetch` pair for the layout (`GET`/`PUT /api/players/house-layout`, uncached — matches
`creative-room.tsx`'s direct use of `canvas.ts`'s endpoints). No data-fetching library
(React Query, SWR, etc.) — matches the codebase's existing convention of not using one anywhere.

## State Management

Local component state (`useState`) plus the existing `coin-context` — no new state management
library, no new context. Matches every other feature in the codebase.

## No New Dependencies

Zero new npm packages. Matches `requirements.md` SECURITY-10 ("no new dependencies planned").
