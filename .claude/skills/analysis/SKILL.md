---
name: analysis
description: Deep-dive feature/story technical design analysis for ANY Magic House Jira ticket. Fetches Jira ticket + parent, discovers the affected areas (components, contexts, API routes, Supabase schema) from context, reads referenced spreadsheets/documents, then exports a full technical analysis in English. Use when a ticket involves DB/schema design, API route changes, new components, or context/state changes — not for bug reports (use analyze-jira instead).
---

# Feature Analysis — Full Technical Design

You are a senior software engineer on **Magic House** — an interactive educational web app for children (Next.js 16 / React 19 / TypeScript / Tailwind CSS / Radix UI / Supabase / pnpm). Your job is to analyze any feature/story Jira ticket completely — discover which directories, DB tables, API routes, contexts, and formulas are involved, then export one detailed report file in English.

**Single-pass, no-gate workflow.** Gather everything first, produce the file at the end.

---

## Input

- **Jira ticket key or URL** (required)
- **User context** (optional): any extra detail the user typed — field names, data formats, calculations, related tickets, spreadsheet names, area hints, etc.

---

## Step 1 — Fetch Jira Ticket(s)

Call `jira-tools.get_jira_ticket_with_images` for the main ticket (and `jira-tools.get_jira_comments` for the full comment history). If the ticket references a **parent ticket, epic, or sibling ticket**, fetch those too (`jira-tools.get_jira_epic_issues` for an epic).

Extract from each ticket:
- `key`, `summary`, `issueType`, `status`, `priority`
- `description` — parse every table, field list, and logic column in full
- `comments` — read all; they often contain design decisions
- `imageFiles` — local image paths to read

---

## Step 2 — Read All Screenshots

Read every file in `imageFiles` using the Read tool. Extract:
- Page / dashboard / room name, tab name, section or card name
- Every visible label and its format (text, number, coins, percent, read-only, dropdown, toggle, date)
- Example input/output values shown
- Button names and their apparent actions
- Any rule or calculation hint visible in the UI (e.g. "earn 5 coins per correct answer")
- Which language is shown (vi / en) — Magic House is bilingual

---

## Step 3 — Identify Scope (Areas, Tables, Routes)

Before reading code, reason from the ticket + screenshots + user context. Use the directory map in `docs/PROJECT_GUIDE.md` §2:

| Signal in ticket | Likely area |
|-----------------|-------------|
| New screen, layout, interaction, animation | `app/`, `components/<feature>/` |
| Coins earned/spent, shop purchases | `contexts/coin-context.tsx`, `components/shop/`, `app/api/players/coins/` |
| Language / translation copy | `contexts/language-context.tsx`, `data/translations*` |
| Theme / dark mode | `contexts/theme-context.tsx` |
| Quiz questions, subjects, grades | `supabase/migrations/`, `supabase/seed.sql`, `app/api/subjects/`, `app/api/quiz/`, `components/` quiz UI |
| Admin editing of content | `app/api/admin/`, `ADMIN_EMAILS` env, RLS policies in `supabase/migrations/` |
| Stickers / rewards | `data/stickers*`, `app/api/stickers/`, `app/api/players/stickers/` |
| Login / signup / session | `app/api/auth/`, `lib/` Supabase client, middleware |
| Persisted player data (canvas, progress) | `app/api/players/`, Supabase tables |

Write down: **Primary area** and **Related areas** with your reasoning.

**Which DB tables are involved?**
- Explicit names from the ticket (`subjects`, `subject_questions`, `quiz_history`, …)
- Implicit hints ("question bank", "player progress", "reward history") → map to likely table names
- Check `supabase/migrations/` for what already exists

**Where do writes happen?**
- Client-only state that persists to `localStorage` → a React context in `contexts/`
- Server writes → a route handler under `app/api/**/route.ts` calling Supabase
- Direct Supabase calls from a client component → `lib/` helper + RLS policy

---

## Step 4 — Discover and Read Referenced Documents

Check for files related to the ticket key or parent key:

```
docs/                        ← project guides
aidlc-docs/<initiative>/      ← AI-DLC artifacts for in-flight work
features-requirement/         ← raw feature requirement notes
docs/<TICKET_KEY>/            ← ticket-specific docs, if the user added them
```

**For spreadsheet files (`.xlsx` / `.csv`):**
1. Read the `.csv` — extract input parameters (header rows), output values, example data rows.
2. If a formula is described, restate it in plain math and derive a closed form.
3. **Verify the formula** against the example values from the screenshot or Jira description. Show the step-by-step calculation. If it matches, mark ✓; if not, investigate (rounding rule, different assumption) until it matches.

**For existing analysis / requirement docs (`.md`, `.txt`):**
- Read to understand established tables, routes, component patterns, and naming.

---

## Step 5 — Read Existing DB Schema

Using the table names from Step 3, read the actual migration files under `supabase/migrations/` (they are numbered, applied in order, and written to be idempotent). Also check `supabase/seed.sql`.

For each relevant table, extract:
- Every column: name, type, `NOT NULL`, default, `CHECK` constraint
- PK, FK (`REFERENCES ... ON DELETE ...`), `UNIQUE` constraints
- Indexes (note any covering / `INCLUDE` index)
- Triggers (e.g. `updated_at`)
- RLS: is row-level security enabled? which policies exist?

If no table matches → it's new and must be created in a new migration.

---

## Step 6 — Read Existing Code

Read only what's relevant. Do not scan whole directories.

**API routes (`app/api/**/route.ts`):**
- Exported HTTP handlers (`GET`, `POST`, `PATCH`, `DELETE`)
- Request parsing + validation (zod or manual)
- Auth check (Supabase session, `ADMIN_EMAILS` allowlist)
- The Supabase query it runs and the response shape

**Contexts (`contexts/*.tsx`):**
- State shape, the provider, the `use*` hook
- What is persisted to `localStorage` and the key name
- Hydration guard (SSR — `useEffect` on mount)

**Components (`components/<feature>/*.tsx`):**
- Props, which context(s) it consumes
- Radix primitives used, conditional rendering, edit/view modes

**Types & data (`lib/`, `data/`):**
- Shared TypeScript types / interfaces
- Static data files (translations, stickers) and their shape

---

## Step 7 — Analyze Everything

**DB Design:**
- What does the feature need that the schema doesn't have — new table, new columns, new FK, new index, new RLS policy?
- If extending an existing table: are new columns nullable? backfill concern for existing rows? does the seed migration need updating?
- If a new table: FK relationships, `UNIQUE` constraints, `updated_at` trigger, RLS policies, seed data.
- Decision rationale: extend vs new table — reference existing patterns and blast radius.

**API Design:**
- What operation does the feature need that no existing route covers?
- Route path + method following the existing convention (`app/api/<resource>/<...>/route.ts`, RESTful verbs).
- Validation rules; which fields the server computes vs trusts from the client (never trust the client for coin math or correctness scoring).
- Auth: public, any signed-in player, or admin-only?
- Error responses (400 / 401 / 403 / 404 + message).

**State / Context Design:**
- Does an existing context need a new field or action, or is a new context warranted?
- What persists to `localStorage` vs what comes from Supabase?
- SSR/hydration considerations.

**UI Design:**
- Which screen / dashboard / room / card does this live in?
- Layout, edit vs view mode, conditional rendering by selector/mode.
- Bilingual: which strings need `vi` + `en`? go in `data/translations*` or DB columns (`*_vi` / `*_en`)?
- What is computed client-side (immediate feedback) vs server-side (trust boundary)?
- Accessibility (Radix handles most; note focus/keyboard needs).

**Formula Analysis (if applicable):**
- State the formula in math notation and in pseudocode.
- State which inputs are user-provided vs derived.
- State validation (e.g. denominator ≠ 0).

**Implementation Order:**
- Standard order: DB migration → API route → context/hook → component → tests.
- What can be parallelized; any in-flight ticket that could conflict.

---

## Step 8 — Export the Report

Create the output folder if it doesn't exist:

```
docs/<TICKET_KEY>/
```

Write `docs/<TICKET_KEY>/<TICKET_KEY>_analysis_EN.md` using the format below.

---

## English Report Format (`<TICKET_KEY>_analysis_EN.md`)

```
# <TICKET_KEY> — <Jira Summary>
## Technical Design Analysis

**Ticket:** [<TICKET_KEY>](<URL>)
**Parent:** [<PARENT_KEY>](<URL>) — <Parent Summary>   (omit if no parent)
**Type:** <Issue Type> | **Status:** <Status> | **Priority:** <Priority>
**Analysis Date:** <today's date>
**Primary area:** <directory / layer>
**Related areas:** <list or "None">

---

## 1. Ticket Summary
### Jira Summary
(key, summary, type, status, priority — one line each)
### Purpose
(1–3 paragraphs: what the feature does, who uses it, why it exists, how it fits the app)

## 2. Feature Requirements — Field by Field
(Reproduce every table from the Jira description. For each field/option: name, input type
(user input / read-only / calculated), format, the rule or formula if calculated, whether it
changes based on a mode/grade/language selector.)

## 3. Screenshot Reference
(State: Screenshots used / No screenshots / Screenshots unclear.)
If used: page/section visible, labels and formats observed, example values, language shown, notes.

## 4. Referenced Documents
(One sub-section per document found. Omit if none. Source path, input parameters, formulas in
readable form, closed form, numerical verification table, important notes.)

## 5. Current Database Structure
(One sub-section per relevant table.)
### `<table_name>`
Source: supabase/migrations/00NN_*.sql
(condensed schema — column | type | null | default | check/constraint)
Indexes: ...
RLS: enabled? policies?
Existing columns relevant to this feature: [list]
Missing for this feature: [list]

## 6. Database Gap Analysis
| Requirement | Current State | Gap |
|-------------|--------------|-----|
| ... | ... | ✅ Exists / ❌ Missing / ⚠️ Partial |
Decision: [Extend existing table(s) / New table(s) / No DB change]
Rationale: [why — existing patterns, risk, seed impact]

## 7. Recommended Database Changes
### New migration: `supabase/migrations/00NN_<slug>.sql`
```sql
-- Adding columns:
ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <col> <type> [NOT NULL DEFAULT ...];  -- purpose

-- Or a new table:
CREATE TABLE IF NOT EXISTS <table> (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
  <fk_col>   uuid NOT NULL REFERENCES <other>(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- + updated_at trigger, + indexes, + RLS enable & policies
```
Seed impact: [does supabase/seed.sql or a seed migration need updating?]

## 8. Table Relationship Diagram   (include when 2+ tables are involved)
```
subjects (1)
  └── subject_questions (1:many)   ← <purpose>
```

## 9. Existing API Routes
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| ... | app/api/... | public / player / admin | ... |
Gap: [what operation is needed that no route covers]

## 10. Required New / Modified API
### <METHOD> /api/<path>
File: `app/api/<path>/route.ts` (NEW / MODIFIED)
Auth: [public / signed-in player / admin (`ADMIN_EMAILS`)]
Request body:
```json
{ "field1": "type and example", "field2": 0 }
```
| Field | Type | Required | Notes |
|-------|------|----------|-------|
Response body:
```json
{ "field1": "...", "computedField": 0 }
```
Validation: [rules]
Server-computed fields: [which values the server derives and why the client is not trusted]
Supabase writes: table, identifying column, fields set
Error cases:
| Scenario | Status |
|----------|--------|
| Not signed in | 401 |
| Not an admin | 403 |
| Not found | 404 |
| Validation failure | 400 + message |

## 11. Calculation Formulas   (omit if none)
### <Formula Name>
Source: [document / Jira / screenshot]
Readable formula → closed form → verification table (input → expected → computed ✓)
Validation rule + error message if violated.

## 12. State / Context Changes   (omit if none)
Context: `contexts/<name>-context.tsx` (NEW / MODIFIED)
New state fields / actions:
localStorage key + shape:
Hydration note:
Components that must consume the change:

## 13. UI Changes   (omit if none)
Location: [Screen → Section → Card]
### Layout
```
┌───────────────────────────────┐
│  <Card title>          [Btn]  │
├───────────────────────────────┤
│  <field>   <field>   <field>  │
└───────────────────────────────┘
```
### Behaviour by mode / grade / language (if conditional)
| Field | Mode A | Mode B |
### Edit / Save flow
1. ...
### Bilingual strings
| Key | vi | en | Location (data/translations* or DB column) |
### Files changed
| File | NEW/MODIFIED | Description |
| `components/<feature>/<Component>.tsx` | ... | ... |
| `data/translations*` | ... | ... |

## 14. Complete File Change List
| File | Change | Why |
|------|--------|-----|

## 15. Implementation Order
```
[migration] → [api route] → [context/hook] → [component] → [tests]
```
Coordination notes: [in-flight tickets that could conflict; who to sync with]

## 16. Risks and Regression Areas
| Risk | Severity | Detail |
|------|----------|--------|

## 17. Open Questions / Gaps
| # | Question | Where to find the answer | Status |
|---|----------|--------------------------|--------|
| 1 | ... | seed data / PM / design doc | ⏳ Open |

---
*Analysis generated by Claude Code. Verify all table columns, enum/CHECK values, and route
auth rules against the live source (`supabase/migrations/`, `app/api/`) before implementation.*
```

---

## Omission Rules

Skip any section that does not apply. Re-number the output so sections are consecutive (no gaps), and don't mention a skipped section.

| Section | Include when |
|---------|-------------|
| 4. Referenced Documents | spreadsheet / doc files exist for the ticket |
| 8. Table Relationship Diagram | 2+ tables are involved |
| 11. Calculation Formulas | the feature involves non-trivial computation |
| 12. State / Context Changes | a React context is added or changed |
| 13. UI Changes | UI changes are in scope |

---

## Critical Rules

- **No gating.** Gather all context and produce the file in one pass. Don't ask for approval mid-analysis.
- **Read actual files.** Never guess a column type, a `CHECK` value, a route path, or an auth rule. Read the migration, the `route.ts`, the context file.
- **Verify formulas numerically** against the example numbers from the ticket or a screenshot.
- **Respect the trust boundary.** Coin math, correctness scoring, and reward grants are server-side; the client is never trusted for them.
- **Keep sections proportional** — short when there's nothing interesting, detailed when there is. Don't pad.
- **Do not write implementation code.** Show structure (SQL shape, route signature, request/response schema, context state shape) — not full function bodies.
- **Create `docs/<TICKET_KEY>/`** if it doesn't exist, and **export the file** before finishing. Final message: confirm the file path.

---

## Export Checklist (run before finishing)

- [ ] `docs/<TICKET_KEY>/<TICKET_KEY>_analysis_EN.md` written and complete
- [ ] No section left over from a different ticket
- [ ] All formulas verified against example numbers
- [ ] All DB columns confirmed from actual `supabase/migrations/*.sql` (not assumed)
- [ ] All existing routes confirmed from actual `app/api/**/route.ts` (not assumed)
- [ ] Bilingual strings identified (vi + en) where UI copy is involved
- [ ] Open questions list marks confirmed items ✅ and unknown items ⏳
