# Unit of Work Plan — Supabase Backend Integration

## Artifacts to Generate
- [x] unit-of-work.md — unit definitions and responsibilities
- [x] unit-of-work-dependency.md — dependency matrix and sequencing
- [x] unit-of-work-story-map.md — feature-to-unit mapping

---

## Proposed Units (from Application Design)

| # | Unit Name | Scope Summary |
|---|---|---|
| 1 | SupabaseDBLayer | SQL migration (5 tables), RLS policies, seed.sql (22 stickers), type generation |
| 2 | BackendAuthAPI | Auth route handlers, AuthContext, LoginView, RegisterView, WelcomeScreen refactor |
| 3 | BackendDataAPI | All remaining API routes (player, coins, stickers, canvas, quiz history) + service modules |
| 4 | FrontendIntegration | CoinContext refactor, StickerShop/CreativeRoom/LearningZone/Dashboard wiring, migration logic |

---

## Planning Questions

Please fill in each `[Answer]:` tag.

---

### Question 1
The 4 units above are proposed to run **sequentially** (1 → 2 → 3 → 4).
Could Unit 3 (BackendDataAPI) be started in parallel with Unit 2 (BackendAuthAPI)?

Unit 3 needs the DB schema from Unit 1, but its service modules and route handler skeletons
don't strictly depend on Unit 2's auth middleware being finished — they can be written
and tested with a placeholder session check first.

A) Keep fully sequential — complete each unit 100% before starting the next (simpler, safer)

B) Partial overlap allowed — Unit 3 can be scaffolded while Unit 2 auth is finishing
(auth middleware is slotted in as the last step of Unit 3)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2
Unit 4 (FrontendIntegration) covers refactoring all 4 frontend features at once:
CoinContext, StickerShop, CreativeRoom, LearningZone + Dashboard.
Should it stay as one unit or be split?

A) Keep as one unit — all frontend wiring done together, simpler code generation plan

B) Split into two units:
   - Unit 4a: CoinContext refactor + StickerShop + Dashboard (coin/sticker features)
   - Unit 4b: CreativeRoom canvas persistence + LearningZone quiz history

C) Other (please describe after [Answer]: tag below)

[Answer]: A
