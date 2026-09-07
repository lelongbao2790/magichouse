# Functional Design Plan — Unit 1: SupabaseDBLayer

## Artifacts to Generate
- [x] domain-entities.md — 5 table schemas with all columns, types, constraints, relationships
- [x] business-rules.md — RLS policies, constraint rules, cascade behaviors, seed logic
- [x] business-logic-model.md — migration execution flow, seed flow, type generation flow

---

## Design Questions

Please fill in each `[Answer]:` tag.

---

### Question 1
If a player deletes their account (auth.users row is deleted), what should happen to all their data?

A) Cascade delete — all rows in `players`, `player_stickers`, `creative_canvas`, `quiz_history` are automatically deleted with the player

B) Soft delete — keep all data but mark the `players` row as deleted (add `deleted_at` column); data is preserved for potential recovery

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
Should a DB-level `CHECK` constraint prevent `players.coins` from going below zero?

A) Yes — add `CHECK (coins >= 0)` to the `players` table (defense in depth; prevents any rogue direct DB write from creating negative balances)

B) No — rely on application-level validation only (simpler schema; the API already validates before updating)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
Should the `stickers` catalog table be readable by unauthenticated users (anon role), or require a logged-in session?

A) Authenticated only — only logged-in players can read the sticker catalog (consistent with FR-11: all features auth-gated)

B) Public read — the `stickers` table is readable by anyone, even before login (useful if you ever want to show a preview catalog before sign-up)

C) Other (please describe after [Answer]: tag below)

[Answer]: A
