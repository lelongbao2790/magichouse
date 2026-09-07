# Domain Entities — Unit 1: SupabaseDBLayer

## Entity: Player

Maps to table: `players`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| name | text | NOT NULL |
| coins | integer | NOT NULL DEFAULT 0, CHECK (coins >= 0) |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**Relationships**:
- Has many `PlayerSticker` (via player_id)
- Has one `CreativeCanvas` (via player_id)
- Has many `QuizHistory` (via player_id)

**Invariants**:
- `coins` can never be negative (enforced by both DB constraint and application logic)
- `id` always equals the corresponding `auth.users.id` — created at signup
- `updated_at` is automatically refreshed by DB trigger on every UPDATE

---

## Entity: Sticker (Catalog)

Maps to table: `stickers`

| Column | Type | Constraints |
|---|---|---|
| id | text | PRIMARY KEY (e.g., "hat-crown", "glasses-sun") |
| name | text | NOT NULL |
| category | text | NOT NULL, CHECK (category IN ('hat','glasses','bow','toy')) |
| emoji | text | NOT NULL |
| price | integer | NOT NULL, CHECK (price > 0) |

**Relationships**:
- Referenced by `PlayerSticker` (via sticker_id)

**Invariants**:
- `id` is a stable human-readable slug — used as FK in `player_stickers`
- `price` must be strictly positive
- `category` is constrained to the 4 known values
- Populated via seed.sql — not mutated by application at runtime

**Seed rows (22 total)**:

| id | name | category | emoji | price |
|---|---|---|---|---|
| hat-crown | Vuong mien | hat | 👑 | 30 |
| hat-wizard | Mu phu thuy | hat | 🎩 | 25 |
| hat-party | Mu tiec | hat | 🥳 | 15 |
| hat-cowboy | Mu cao boi | hat | 🤠 | 20 |
| hat-cap | Mu luoi trai | hat | 🧢 | 10 |
| hat-santa | Mu Noel | hat | 🎅 | 25 |
| glasses-sun | Kinh mat | glasses | 🕶️ | 15 |
| glasses-nerd | Kinh can | glasses | 🤓 | 10 |
| glasses-star | Kinh ngoi sao | glasses | ⭐ | 20 |
| glasses-heart | Kinh trai tim | glasses | 💖 | 20 |
| glasses-3d | Kinh 3D | glasses | 👓 | 15 |
| bow-ribbon | No hong | bow | 🎀 | 15 |
| bow-flower | Hoa cai dau | bow | 🌸 | 20 |
| bow-butterfly | Buom | bow | 🦋 | 25 |
| bow-star | Sao | bow | ✨ | 15 |
| bow-rainbow | Cau vong | bow | 🌈 | 30 |
| toy-balloon | Bong bay | toy | 🎈 | 10 |
| toy-teddy | Gau bong | toy | 🧸 | 25 |
| toy-rocket | Ten lua | toy | 🚀 | 30 |
| toy-ball | Qua bong | toy | ⚽ | 15 |
| toy-magic | Gay phep | toy | 🪄 | 35 |
| toy-robot | Robot | toy | 🤖 | 40 |

---

## Entity: PlayerSticker (Ownership)

Maps to table: `player_stickers`

| Column | Type | Constraints |
|---|---|---|
| player_id | uuid | NOT NULL, REFERENCES players(id) ON DELETE CASCADE |
| sticker_id | text | NOT NULL, REFERENCES stickers(id) |
| purchased_at | timestamptz | NOT NULL DEFAULT now() |

**Primary Key**: (player_id, sticker_id) — composite; prevents duplicate ownership

**Relationships**:
- Belongs to `Player`
- References `Sticker`

**Invariants**:
- A player can own each sticker at most once (composite PK enforces uniqueness)
- Purchasing is idempotent at DB level (INSERT ... ON CONFLICT DO NOTHING safe to use)
- Deleted automatically when parent `players` row is deleted (CASCADE)

---

## Entity: CreativeCanvas

Maps to table: `creative_canvas`

| Column | Type | Constraints |
|---|---|---|
| player_id | uuid | PRIMARY KEY, REFERENCES players(id) ON DELETE CASCADE |
| canvas_data | jsonb | NOT NULL DEFAULT '[]'::jsonb |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**Relationships**:
- Belongs to exactly one `Player` (1:1)

**canvas_data JSONB schema** (array of placed sticker objects):
```json
[
  {
    "id": "hat-crown",
    "emoji": "👑",
    "x": 120,
    "y": 85,
    "scale": 1.2,
    "rotation": 0
  }
]
```

**Invariants**:
- At most one canvas row per player (player_id is PK)
- Empty canvas is represented as `[]`, not NULL
- Row created on first save (UPSERT); not pre-created at signup

---

## Entity: QuizHistory

Maps to table: `quiz_history`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() |
| player_id | uuid | NOT NULL, REFERENCES players(id) ON DELETE CASCADE |
| category | text | NOT NULL, CHECK (category IN ('shapes','colors','animals','math','vietnamese','english','addition','subtraction','timesTable')) |
| score | integer | NOT NULL, CHECK (score >= 0) |
| total_questions | integer | NOT NULL, CHECK (total_questions > 0) |
| coins_earned | integer | NOT NULL, CHECK (coins_earned >= 0) |
| completed_at | timestamptz | NOT NULL DEFAULT now() |

**Relationships**:
- Belongs to `Player`

**Invariants**:
- `score` cannot exceed `total_questions` (enforced at application layer; consider adding `CHECK (score <= total_questions)`)
- `category` is constrained to the 9 known quiz categories
- Records are append-only (never updated or deleted by the application)
- Deleted automatically when parent `players` row is deleted (CASCADE)

---

## Entity Relationship Summary

```
auth.users (Supabase-managed)
     |
     | 1:1 (id = auth.users.id)
     v
  players
     |
     |--< player_stickers >-- stickers (catalog, immutable)
     |
     |-- creative_canvas (1:1)
     |
     |--< quiz_history
```
