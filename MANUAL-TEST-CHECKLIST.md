# Manual Test Checklist

Work through every item after each push to `main`, before marking the deploy done.
Do not delete entries from previous initiatives.

---

## Initiative: subject-content-db

### TC-M001 — Content review of the seeded Grade 2 Vietnamese & English questions

**When**: Before merging the content migration PR.
**Source**: `supabase/migrations/0003_subject_content_seed.sql` (rows `grade2Vietnamese-*`
and `grade2English-*`).
**Steps**:
1. Read every question and its 3 options.
2. Confirm the `correct_index` (0-based) actually points at the correct option.
3. Confirm language purity — `grade2Vietnamese` fully Vietnamese with correct diacritics;
   `grade2English` fully English.
4. Confirm age-appropriateness for Grade 1–2 (~6–8 yrs); no near-duplicate questions.
5. Sanity-check the `difficulty` tag; confirm the ~40% easy / ~40% medium / ~20% hard
   spread across `grade2Vietnamese-016..050` and `grade2English-016..050` (trim/retag as
   needed).
**Specifically check**: any question where two options are both defensible; any Vietnamese
option missing tone marks; any English question that slipped in a Vietnamese word.

### TC-M002 — Migration applied to the live Supabase project

**When**: Immediately after `supabase db push`, before the frontend deploy is marked done.
**Steps**:
1. `supabase db push` (or `supabase migration up`) against project `eoelyqphaixgqlkyoxau`.
2. SQL editor: `select key, count(*) from subject_questions sq join subjects s on s.id = sq.subject_id group by key order by key;`
3. `select pg_get_constraintdef(oid) from pg_constraint where conname = 'quiz_history_category_check';`
**Expected**:
- `shapes` 10, `colors` 10, `animals` 10, `vietnamese` 3, `english` 10,
  `grade2Vietnamese` 50, `grade2English` 50.
- No subject with 0 rows.
- The `quiz_history` category CHECK lists `grade2Vietnamese` and `grade2English`.

### TC-M003 — Admin API allowlist gate on the deployed environment

**When**: After deploy, once `ADMIN_EMAILS` is set in the hosting env.
**Preconditions**: `ADMIN_EMAILS` contains your admin email; you have one allowlisted login
and one ordinary login; the `0002`/`0003` migrations are applied.
**Steps**:
1. Signed in as the **allowlisted** user: `GET /api/admin/subjects` → expect `200` + the
   subject list.
2. `POST /api/admin/subject-questions` with a valid new question for `grade2English`
   (e.g. `{ "subjectKey":"grade2English", "promptEn":"Test?", "optionsEn":["a","b","c"],
   "correctIndex":0, "difficulty":"easy" }`) → expect `2xx`; note the returned `id`.
3. Open the Grade 2 English quiz in the app enough times to confirm the new question can
   appear (or `GET /api/subjects/grade2English/questions` and find its `id`).
4. `PATCH /api/admin/subject-questions` `{ "id":"<id>", "isActive":false }` → `2xx`; confirm
   it no longer appears in a gameplay session.
5. `DELETE /api/admin/subject-questions?id=<id>` → `2xx`.
6. Send an invalid payload (2 options, or `correctIndex: 5`) → expect `400`.
7. Send a `fixed`-subject payload that also sets the other locale → expect `400` with a
   mode-coverage message.
8. Signed in as the **ordinary** user: `GET /api/admin/subjects` → expect `403`.
9. With no auth cookie: → expect `401`.
**Specifically check**: step 8 returns `403` (not `200`, not `500`); step 2's new row is
actually served by `/api/subjects/grade2English/questions`; the deploy logs show the
`[admin] 403 …` line from step 8.

### TC-M004 — Deployed app: Vietnamese subject renders in Vietnamese with UI in English

**When**: After the frontend deploy + `supabase db push`.
**Preconditions**: Production URL, a test login.
**Steps**:
1. Open the deployed app, log in, go to the Learning Zone.
2. Switch the UI language to English (menus/buttons become English).
3. Grade 2 tab → open the **Vietnamese** subject.
4. Read 3–4 questions using "Next".
**Expected**: every question and option is in Vietnamese; the surrounding UI (progress,
difficulty badge, buttons) is in English.
**Specifically check**: no question shows the old English translation
("Which word names a color?" etc.); the loading state is brief, not stuck; toggling the
language mid-quiz does not change the question text.

### TC-M005 — Deployed app: quiz history + coins recorded for all quiz types

**When**: After deploy.
**Preconditions**: Production URL, a test login; note the starting coin balance.
**Steps**:
1. Complete one quiz of each kind: a Preschool subject, a Math practice, Grade 2
   Vietnamese, Grade 2 English.
2. After each, note the coin balance.
3. Check `GET /api/quiz/history` (or the history UI) for the four new rows.
**Expected**: the coin balance increases after each; `quiz_history` has a row for each of
the four categories, **including `grade2Vietnamese` and `grade2English`** (no silent
constraint failure).
**Specifically check**: the `grade2Vietnamese` / `grade2English` history rows exist — this
is the `0002` CHECK-constraint fix verification.
