# Unit of Work Story Map — Supabase Backend Integration

## Feature-to-Unit Mapping

| Feature / Requirement | Unit | Deliverable(s) |
|---|---|---|
| **DATABASE FOUNDATION** | | |
| Create `players` table | Unit 1 | `0001_initial_schema.sql` |
| Create `stickers` table | Unit 1 | `0001_initial_schema.sql` |
| Create `player_stickers` table | Unit 1 | `0001_initial_schema.sql` |
| Create `creative_canvas` table | Unit 1 | `0001_initial_schema.sql` |
| Create `quiz_history` table | Unit 1 | `0001_initial_schema.sql` |
| RLS policies (player owns own rows) | Unit 1 | `0001_initial_schema.sql` |
| Seed 22 stickers | Unit 1 | `seed.sql` |
| TypeScript DB types | Unit 1 | `lib/database.types.ts` |
| HTTP security headers | Unit 1 | `next.config.ts` |
| **AUTHENTICATION** | | |
| Supabase server client | Unit 2 | `lib/supabase/server.ts` |
| Supabase browser client | Unit 2 | `lib/supabase/client.ts` |
| API response envelope helper | Unit 2 | `lib/api-response.ts` |
| POST /api/auth/signup | Unit 2 | `app/api/auth/signup/route.ts` |
| POST /api/auth/login | Unit 2 | `app/api/auth/login/route.ts` |
| POST /api/auth/logout | Unit 2 | `app/api/auth/logout/route.ts` |
| GET /api/auth/session | Unit 2 | `app/api/auth/session/route.ts` |
| Player upsert on signup | Unit 2 | `lib/services/player.ts` (partial) |
| AuthContext (signUp/signIn/signOut/session) | Unit 2 | `contexts/auth-context.tsx` |
| Login view (email + password) | Unit 2 | `components/login-view.tsx` |
| Register view (email + password + name) | Unit 2 | `components/register-view.tsx` |
| WelcomeScreen as auth view switcher | Unit 2 | `components/welcome-screen.tsx` |
| **BACKEND DATA API** | | |
| GET /api/players/me | Unit 3 | `app/api/players/me/route.ts` |
| POST /api/players/coins | Unit 3 | `app/api/players/coins/route.ts` |
| POST /api/players/migrate | Unit 3 | `app/api/players/migrate/route.ts` |
| GET /api/players/stickers | Unit 3 | `app/api/players/stickers/route.ts` |
| POST /api/players/stickers (buy) | Unit 3 | `app/api/players/stickers/route.ts` |
| GET /api/players/canvas | Unit 3 | `app/api/players/canvas/route.ts` |
| PUT /api/players/canvas | Unit 3 | `app/api/players/canvas/route.ts` |
| GET /api/stickers (catalog) | Unit 3 | `app/api/stickers/route.ts` |
| POST /api/quiz/history | Unit 3 | `app/api/quiz/history/route.ts` |
| GET /api/quiz/history | Unit 3 | `app/api/quiz/history/route.ts` |
| Player service (addCoins, migrate) | Unit 3 | `lib/services/player.ts` (completed) |
| Sticker service (catalog, owned, purchase) | Unit 3 | `lib/services/stickers.ts` |
| Canvas service (get, save) | Unit 3 | `lib/services/canvas.ts` |
| Quiz service (record, history) | Unit 3 | `lib/services/quiz.ts` |
| Zod schemas (all data routes) | Unit 3 | `lib/validation/api.ts` (completed) |
| Session auth check in all routes | Unit 3 | All route handlers |
| **FRONTEND INTEGRATION** | | |
| Install @supabase/supabase-js + @supabase/ssr | Unit 4 | `package.json` |
| AuthProvider wrapping app | Unit 4 | `app/page.tsx` |
| Session-gated routing (unauth → WelcomeScreen) | Unit 4 | `app/page.tsx` |
| CoinContext: load coins + stickers from API | Unit 4 | `contexts/coin-context.tsx` |
| CoinContext: addCoins via API | Unit 4 | `contexts/coin-context.tsx` |
| CoinContext: buySticker via API | Unit 4 | `contexts/coin-context.tsx` |
| CoinContext: write-through localStorage cache | Unit 4 | `contexts/coin-context.tsx` |
| CoinContext: silent localStorage fallback | Unit 4 | `contexts/coin-context.tsx` |
| localStorage migration trigger on first login | Unit 4 | `contexts/coin-context.tsx` |
| Dashboard: child name from AuthContext | Unit 4 | `components/dashboard.tsx` |
| StickerShop: catalog from API | Unit 4 | `components/sticker-shop.tsx` |
| StickerShop: buy via CoinContext | Unit 4 | `components/sticker-shop.tsx` |
| CreativeRoom: load canvas on mount | Unit 4 | `components/creative-room.tsx` |
| CreativeRoom: debounced canvas save | Unit 4 | `components/creative-room.tsx` |
| LearningZone: fire-and-forget quiz history | Unit 4 | `components/learning-zone.tsx` |
| .env.local template | Unit 4 | `.env.local.example` |

---

## Coverage Summary

| Unit | Requirement(s) Covered |
|---|---|
| Unit 1 | FR-04 (DB catalog), FR-10 (all via API — schema foundation), NFR-01 SECURITY-01/06 (RLS + encryption) |
| Unit 2 | FR-01 (email/password auth), FR-02 (player profile), FR-11 (auth-gated access), NFR-01 SECURITY-08/12 |
| Unit 3 | FR-03 (coins via API), FR-04 (catalog API), FR-05 (sticker ownership), FR-06 (canvas), FR-07 (quiz history), FR-10 (all via API), NFR-01 SECURITY-05/09/15 |
| Unit 4 | FR-08 (migration), FR-09 (offline fallback), FR-10 (frontend calls API), NFR-03 (reliability) |
