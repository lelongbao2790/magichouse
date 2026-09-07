# Integration Test Instructions — Magic House (SupabaseBackendIntegration)

## Purpose

Test the full request path: React client → Next.js API route → Supabase database. These are the primary verification mechanism for this feature since all four units are tightly coupled.

---

## Prerequisites

- `.env.local` configured with real Supabase credentials
- Database migration applied (`npx supabase db push`)
- Sticker seed data present in `stickers` table (16 rows)
- Dev server running: `npm run dev` (port 3000)

---

## Scenario 1: Authentication Flow

**Purpose**: Verify sign-up → session persistence → sign-in → sign-out.

```bash
# Sign up (creates player row in DB)
curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Tester"}' \
  -c cookies.txt
# Expected: { "data": { "id": "...", "name": "Tester", "coins": 0 }, "error": null }

# Verify session persists (cookie-based)
curl -s http://localhost:3000/api/auth/session -b cookies.txt
# Expected: { "data": { "id": "...", "name": "Tester", "coins": 0 }, "error": null }

# Sign out
curl -s -X POST http://localhost:3000/api/auth/signout -b cookies.txt
# Expected: { "data": null, "error": null }

# Session should be gone
curl -s http://localhost:3000/api/auth/session -b cookies.txt
# Expected: { "data": null, "error": null }
```

**Database verify** (Supabase Studio → Table Editor → `players`):
- [ ] Row exists with `name = "Tester"` and `coins = 0`

---

## Scenario 2: Coin Earning Flow

**Purpose**: Verify quiz history recording and coin addition.

```bash
# Sign in to get session
curl -s -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}' \
  -c cookies.txt

# Record quiz history
curl -s -X POST http://localhost:3000/api/quiz/history \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"category":"shapes","score":8,"totalQuestions":10,"coinsEarned":10}'
# Expected: { "data": null, "error": null }

# Add coins (optimistic path — backend call)
curl -s -X POST http://localhost:3000/api/players/coins \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount":10}'
# Expected: { "data": { "id": "...", "name": "Tester", "coins": 10 }, "error": null }

# Verify balance
curl -s http://localhost:3000/api/players/me -b cookies.txt
# Expected: { "data": { "coins": 10, ... }, "error": null }
```

**Database verify**:
- [ ] `players.coins = 10`
- [ ] `quiz_history` has one row with `category = "shapes"`, `score = 8`

---

## Scenario 3: Sticker Purchase Flow

**Purpose**: Verify atomic coin deduction and sticker ownership.

```bash
# Ensure player has enough coins (add more if needed)
curl -s -X POST http://localhost:3000/api/players/coins \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount":20}'

# View catalog
curl -s http://localhost:3000/api/stickers -b cookies.txt
# Expected: array of 16 sticker objects

# Buy a sticker (crown costs 20 coins per seed data)
curl -s -X POST http://localhost:3000/api/players/stickers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"stickerId":"crown"}'
# Expected: { "data": { "newCoinBalance": 10 }, "error": null }

# Verify ownership
curl -s http://localhost:3000/api/players/stickers -b cookies.txt
# Expected: { "data": ["crown"], "error": null }

# Try buying again (duplicate — should succeed idempotently or error gracefully)
curl -s -X POST http://localhost:3000/api/players/stickers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"stickerId":"crown"}'
# Expected: 400 or idempotent success — must NOT double-charge
```

**Insufficient funds test**:
```bash
# Buy expensive sticker when broke
curl -s -X POST http://localhost:3000/api/players/stickers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"stickerId":"rocket"}'
# Expected (if rocket costs more than current balance):
# HTTP 400 { "error": "Insufficient funds" }
```

---

## Scenario 4: Canvas Persistence Flow

**Purpose**: Verify canvas save and reload.

```bash
# Save canvas state
curl -s -X PUT http://localhost:3000/api/players/canvas \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"canvasData":[{"id":"item-1","emoji":"🎩","x":50,"y":50,"scale":1,"rotation":0}]}'
# Expected: { "data": null, "error": null }

# Retrieve canvas
curl -s http://localhost:3000/api/players/canvas -b cookies.txt
# Expected: { "data": [{"id":"item-1","emoji":"🎩","x":50,"y":50,"scale":1,"rotation":0}], "error": null }

# Save empty canvas (clear)
curl -s -X PUT http://localhost:3000/api/players/canvas \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"canvasData":[]}'

# Verify cleared
curl -s http://localhost:3000/api/players/canvas -b cookies.txt
# Expected: { "data": [], "error": null }
```

---

## Scenario 5: localStorage Migration Flow

**Purpose**: Verify one-time migration of pre-auth localStorage data.

1. In browser devtools console (before signing in):
   ```javascript
   localStorage.setItem("kidCoins", "75")
   localStorage.setItem("kidStickers", JSON.stringify(["balloon"]))
   // Do NOT set "migrationDone"
   ```
2. Sign up / sign in with a fresh account (DB coins = 0)
3. **Expected**: `POST /api/players/migrate` fires in background (visible in Network tab)
4. **Database verify**: `players.coins = 75`; `player_stickers` contains `balloon`
5. **Browser verify**: `localStorage.getItem("migrationDone") === "true"` after migration resolves

**Migration idempotency** (second login should not re-migrate):
1. Sign out, sign back in
2. **Expected**: No `/api/players/migrate` request (guarded by `migrationDone` in localStorage)

---

## Scenario 6: Auth Guard Verification

**Purpose**: Confirm all data routes require authentication.

```bash
# Without cookies (unauthenticated)
curl -s http://localhost:3000/api/players/me
# Expected: HTTP 401 { "error": "Unauthorized" }

curl -s http://localhost:3000/api/stickers
# Expected: HTTP 401 { "error": "Unauthorized" }

curl -s http://localhost:3000/api/players/canvas
# Expected: HTTP 401 { "error": "Unauthorized" }
```

---

## Scenario 7: Input Validation Rejection

**Purpose**: Verify Zod schemas reject malformed input at API boundary.

```bash
# Invalid amount
curl -s -X POST http://localhost:3000/api/players/coins \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount":-5}'
# Expected: HTTP 400 { "error": "Invalid input" }

# Invalid category in quiz history
curl -s -X POST http://localhost:3000/api/quiz/history \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"category":"unknown","score":5,"totalQuestions":10,"coinsEarned":10}'
# Expected: HTTP 400 { "error": "Invalid input" }
```

---

## Test Cleanup

After integration testing, remove test data:

```sql
-- Run in Supabase Studio → SQL Editor
DELETE FROM quiz_history WHERE player_id IN (
  SELECT id FROM players WHERE name = 'Tester'
);
DELETE FROM player_stickers WHERE player_id IN (
  SELECT id FROM players WHERE name = 'Tester'
);
DELETE FROM player_canvas WHERE player_id IN (
  SELECT id FROM players WHERE name = 'Tester'
);
DELETE FROM players WHERE name = 'Tester';
-- Then delete from Supabase Studio → Authentication → Users
```

---

## Local Supabase (CI Option)

For automated CI pipelines (requires Docker):

```bash
# Start local Supabase instance
npx supabase start

# Apply migration to local instance
npx supabase db push --local

# Run dev server against local instance
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(npx supabase status --output json | jq -r '.anonKey') \
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status --output json | jq -r '.serviceRoleKey') \
npm run dev

# Stop local Supabase after tests
npx supabase stop
```
