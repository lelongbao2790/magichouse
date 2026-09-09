# Requirements Clarification (Round 2) — subject-content-db

Thanks for the answers. A few of them interact in ways I need to pin down before writing
the requirements document. Please fill in the `[Answer]:` tags and say "done".

Your Round 1 answers (for reference):
- Q1=C — **all** static quiz content moves to the DB (preschool shapes/colors/animals + Grade 1 + Grade 2 language subjects); only the runtime math generators stay in code
- Q2=B — two normalized tables: `subjects` + `subject_questions`
- Q3=A — one fixed language per subject; UI switch never changes question text
- Q4=A — English subject is fully English (prompt + options)
- Q6=B — ~50 questions per subject bank
- Q8=B — admin read+write API gated to an admin role

---

## Clarification 1 — Fixed-language vs bilingual subjects

Q3=A ("one fixed language per subject") fits the **language-learning** subjects
(Vietnamese, English). But the **preschool** subjects (Shapes, Colors, Animals) are
genuinely bilingual today and *correctly* follow the UI language — "What shape is this?"
should still become "Đây là hình gì?" when the UI is Vietnamese.

How should the `subjects` table handle this?

A) **Per-subject content mode.** Each subject row has a `content_mode`:
   - `fixed` → questions stored once in the subject's target language, never locale-switched (Vietnamese subject, English subject)
   - `localized` → each question stores a `vi` and an `en` text, picked by the UI language (Shapes, Colors, Animals)
   *(Recommended — keeps today's correct preschool behavior, fixes the language subjects)*

B) **Everything fixed.** Preschool subjects also become single-language (choose Vietnamese as their stored language); the UI switch stops translating preschool questions too

C) **Everything localized.** Even the Vietnamese/English subjects keep `vi`+`en` columns; the bug fix is purely "the language subject always reads its own target-language column regardless of UI locale"

D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Clarification 2 — Which subjects get expanded to ~50 questions

Q6=B said "~50 per subject bank". Applying that to *every* migrated subject is a large
content-authoring + review job (7 banks). Your original request only mentioned Vietnamese
and English.

A) **Expand only the 4 language banks** (Grade 1 Vietnamese, Grade 1 English, Grade 2 Vietnamese, Grade 2 English) to ~50 each. Migrate Preschool Shapes/Colors/Animals **as-is** (~10 each), just moved into the DB. *(Recommended — matches your original ask)*

B) **Expand everything** — Preschool Shapes/Colors/Animals also grow to ~50 each

C) **Expand only Grade 2 Vietnamese + Grade 2 English** to ~50; leave Grade 1 Vietnamese (3 Q) and Grade 1 English (10 Q) at their current size, just migrated

D) Other (please describe after [Answer]: tag below)

[Answer]:C

---

## Clarification 3 — How is an "admin" identified for the write API?

Q8=B wants a write API "gated to an admin role", but the app has no admin concept today
(all authenticated users are equal).

A) **Email allowlist in an env var** (e.g. `ADMIN_EMAILS=you@example.com`) — route checks the authenticated user's email against it. Simplest, no schema change. *(Recommended)*

B) **`is_admin` boolean column on `players`** — set manually in the DB; route checks it

C) **Supabase `app_metadata.role = 'admin'`** custom claim — set via the Supabase dashboard / Admin API; route checks the JWT claim

D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Clarification 4 — Scope of the admin write API

A) **Full CRUD** on `subject_questions` (create / update / deactivate / list) + list `subjects` *(Recommended)*

B) **Read + bulk replace** — GET all questions for a subject, PUT a full replacement set for a subject (simpler, matches "SQL-file-ish" editing)

C) **Read-only for now** — build the admin GET endpoints and role gate, defer writes to a later initiative (content still seeded via SQL migration)

D) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Clarification 5 — Confirm Grade 1 English gets re-authored

Q4=A means the current Grade 1 English questions (English prompt, **Vietnamese** answer
options — "What does 'Apple' mean?" → Quả táo / Quả cam / Quả chuối) will be **rewritten**
to be fully English (options become Apple / Orange / Banana, etc.).

A) **Yes, re-author Grade 1 English to fully English** *(Recommended — consistent with your Q4 choice)*

B) **No — keep Grade 1 English as English-prompt + Vietnamese-options**, only Grade 2 English is fully English

C) Other (please describe after [Answer]: tag below)

[Answer]:A
