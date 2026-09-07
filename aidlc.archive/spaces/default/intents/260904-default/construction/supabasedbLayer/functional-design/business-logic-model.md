# Business Logic Model — Unit 1: SupabaseDBLayer

## Overview

SupabaseDBLayer is a pure infrastructure unit. Its "business logic" is the sequence of operations
that transforms the project from a schema-less state to a fully migrated, seeded, and type-safe
database foundation that all other units depend on.

---

## Process 1: Migration Execution

**Trigger**: Developer runs `supabase db push` (remote) or `supabase db reset` (local)

```
Step 1: Enable pgcrypto extension (for gen_random_uuid())
Step 2: Create players table
  - Columns: id, name, coins (CHECK >= 0), created_at, updated_at
  - FK: id REFERENCES auth.users(id) ON DELETE CASCADE
Step 3: Create stickers table
  - Columns: id (text PK), name, category (CHECK enum), emoji, price (CHECK > 0)
Step 4: Create player_stickers table
  - Columns: player_id (FK → players CASCADE), sticker_id (FK → stickers)
  - PK: (player_id, sticker_id)
Step 5: Create creative_canvas table
  - Columns: player_id (PK, FK → players CASCADE), canvas_data (jsonb DEFAULT '[]'), updated_at
Step 6: Create quiz_history table
  - Columns: id (uuid PK), player_id (FK → players CASCADE),
             category (CHECK enum), score (CHECK >= 0),
             total_questions (CHECK > 0), coins_earned (CHECK >= 0), completed_at
Step 7: Create update_updated_at_column() trigger function
Step 8: Attach trigger to players table (BEFORE UPDATE)
Step 9: Enable RLS on all 5 tables
Step 10: Create RLS policies (see business-rules.md)
```

**Outcome**: Database is ready to accept application data. No existing data is affected if migration is additive.

---

## Process 2: Seed Execution

**Trigger**: Developer runs `supabase db seed` or `supabase db reset` (which also runs seed)

```
Step 1: INSERT 22 rows into stickers
  - Each row: (id, name, category, emoji, price)
  - ON CONFLICT (id) DO NOTHING  [idempotent]
Step 2: Verify row count = 22 (manual check, not enforced by SQL)
```

**Outcome**: Sticker catalog is populated. Running seed twice is safe.

---

## Process 3: TypeScript Type Generation

**Trigger**: Developer runs type generation command after migration is applied

```
Step 1: supabase gen types typescript
        --project-id eoelyqphaixgqlkyoxau
        --schema public
        > lib/database.types.ts
Step 2: Commit lib/database.types.ts to version control
Step 3: Import Database type in service files:
        import type { Database } from "@/lib/database.types"
```

**Outcome**: All Supabase client calls are fully typed. TypeScript catches column name errors at compile time.

---

## Process 4: Security Headers Configuration

**Trigger**: Applied during Code Generation; takes effect when Next.js server starts

```
Step 1: Add headers() function to next.config.ts
Step 2: Configure 5 required headers on all routes (pattern: "/(.*)")
Step 3: Verify headers present in browser DevTools Network tab
```

**Outcome**: All HTML responses include SECURITY-04 required headers.

---

## Data Integrity Invariants

The migration enforces these invariants at the database level, independently of application code:

1. A player's coin balance is always >= 0
2. Sticker prices are always > 0
3. Quiz scores are always >= 0 and total_questions > 0
4. A player can own each sticker at most once
5. Deleting a player removes all their associated data (cascade)
6. The sticker catalog contains only known categories (hat/glasses/bow/toy)
7. Quiz history references only known categories (9 values)
