# Domain Entities — U1 content-schema-and-service

## Value types

```
Locale        = 'vi' | 'en'
Difficulty    = 'easy' | 'medium' | 'hard'          # reused from lib/coin-rewards.ts
ContentMode   = 'fixed' | 'localized'
Grade         = 'preschool' | 'grade1' | 'grade2'
```

---

## Entity: Subject

Persisted as table `subjects`. One row per content-backed quiz category.

| Field | Type | Rule |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `key` | text | UNIQUE, NOT NULL. Equals the app category id. Enum in practice: `shapes`, `colors`, `animals`, `vietnamese`, `english`, `grade2Vietnamese`, `grade2English` |
| `title_vi` | text | NOT NULL, non-empty |
| `title_en` | text | NOT NULL, non-empty |
| `grade` | text | NOT NULL, ∈ Grade |
| `target_language` | text | NOT NULL, ∈ Locale. The language a `fixed` subject teaches / is authored in. For `localized` subjects it is informational (defaults to `vi`). |
| `content_mode` | text | NOT NULL, ∈ ContentMode |
| `questions_per_session` | int | NOT NULL, DEFAULT 10, > 0 |
| `sort_order` | int | NOT NULL, DEFAULT 0 |
| `created_at` / `updated_at` | timestamptz | NOT NULL, DEFAULT now(); `updated_at` via `update_updated_at_column()` trigger |

**Seed rows (7)**

| key | title_vi | title_en | grade | target_language | content_mode |
|---|---|---|---|---|---|
| shapes | Quiz Hình dạng | Shapes Quiz | preschool | vi | localized |
| colors | Quiz Màu sắc | Colors Quiz | preschool | vi | localized |
| animals | Quiz Con vật | Animals Quiz | preschool | vi | localized |
| vietnamese | Quiz Tiếng Việt | Vietnamese Quiz | grade1 | vi | fixed |
| english | Quiz Anh Văn | English Quiz | grade1 | en | fixed |
| grade2Vietnamese | Quiz Tiếng Việt Lớp 2 | Grade 2 Vietnamese Quiz | grade2 | vi | fixed |
| grade2English | Quiz Tiếng Anh Lớp 2 | Grade 2 English Quiz | grade2 | en | fixed |

---

## Entity: SubjectQuestion

Persisted as table `subject_questions`.

| Field | Type | Rule |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `subject_id` | uuid | NOT NULL, FK → `subjects(id)` ON DELETE CASCADE |
| `source_key` | text | NULL. Stable identifier for a seeded row (e.g. `grade2Vietnamese-012`); NULL for admin-created rows. UNIQUE `(subject_id, source_key)` — NULLs are distinct in Postgres, so admin rows never collide. |
| `prompt_vi` | text | NULL. Non-empty when present. |
| `prompt_en` | text | NULL. Non-empty when present. |
| `options_vi` | jsonb | NULL. When present: array of exactly 3 non-empty strings. |
| `options_en` | jsonb | NULL. When present: array of exactly 3 non-empty strings. |
| `correct_index` | int | NOT NULL, 0 ≤ x ≤ 2. Shared across locales (option order identical). |
| `difficulty` | text | NOT NULL, ∈ Difficulty |
| `is_active` | boolean | NOT NULL, DEFAULT true |
| `sort_order` | int | NOT NULL, DEFAULT 0. Session order (ascending), then `created_at`. |
| `created_at` / `updated_at` | timestamptz | NOT NULL, DEFAULT now(); `updated_at` trigger |

**Mode-coverage invariant** (enforced by trigger `subject_questions_mode_check()`, which
reads the parent subject):
- parent `content_mode = 'fixed'`, `target_language = L`:
  `prompt_L` and `options_L` **NOT NULL**; the **other** locale's `prompt_*` / `options_*`
  **must be NULL** (Q2=A).
- parent `content_mode = 'localized'`:
  all four of `prompt_vi`, `prompt_en`, `options_vi`, `options_en` **NOT NULL**.
- `correct_index` must be a valid index into whichever `options_*` arrays are present
  (0..2, and `< jsonb_array_length`).

**Difficulty assignment (seed)**
- Migrated rows (preschool 30, grade1 vietnamese 3, grade1 english 10-new, existing grade2
  VN 15 + EN 15) → `medium` (Q3 migrated = F).
- Newly authored grade2 rows (~35 VN + ~35 EN) → ~40% `easy`, ~40% `medium`, ~20% `hard`
  (Q3 authored = A).

---

## DTOs (service output — not persisted)

```
QuestionDto {
  id: string
  question: string          # resolved for the effective language
  options: string[]         # length 3, resolved
  correctIndex: number      # 0..2
  difficulty: Difficulty
}

SubjectContentDto {
  key: string
  title: string             # resolved for the UI locale
  questionsPerSession: number
  questions: QuestionDto[]   # ALL active rows, resolved, in (sort_order, created_at) order
}
```

---

## Relationships

```
subjects 1 ──< subject_questions        (subject_id FK, CASCADE delete)
subjects.key ── (logical) ── app category id ── quiz_history.category
```

`quiz_history` is not modified structurally by U1 except its `category` CHECK constraint
(FR-6): the allowed set becomes
`shapes,colors,animals,math,vietnamese,english,addition,subtraction,timesTable,grade2Vietnamese,grade2English`.
