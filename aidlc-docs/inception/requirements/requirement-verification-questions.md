# Requirements Verification Questions — Supabase Backend Integration

Please answer each question by filling in the letter after the `[Answer]:` tag.
If none of the options fit, choose the last option (X = Other) and describe your preference after the tag.

---

## Question 1
How should a player be identified in the database?

Currently the app stores only the child's name in localStorage with no login system.
Your choice determines how all player data (coins, stickers, progress) is linked in Supabase.

A) Anonymous Supabase session — Supabase auto-creates an anonymous auth token stored in the browser. No login needed. Each new browser/device = new player. Simple, no passwords.

B) Name-only with auto UUID — Player identified by name + a UUID generated on first visit and stored in localStorage. Same name can exist for different players (no conflict). Data tied to device.

C) Supabase email/password auth — Parents create a real account. Supports cross-device login. More setup but proper user management.

D) Other (please describe after [Answer]: tag below)

[Answer]: c

---

## Question 2
Should the Creative Room canvas (placed stickers on a character) be saved to the database?

Currently placed stickers on the canvas are in-memory only and reset on every page refresh.

A) Yes — save each player's Creative Room canvas to the database so it persists across sessions

B) No — keep Creative Room as session-only (in-memory), no persistence needed

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
Where should the sticker catalog (22 stickers with names, prices, categories) live?

A) Static file only — keep it in `data/stickers.ts`. No DB table needed for the catalog.

B) Database-driven — move the catalog to a Supabase table so stickers can be added or changed without a code deployment

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
How should existing localStorage data be handled when the app switches to Supabase?

A) Start fresh — ignore localStorage data. Players start a new profile when the new version launches.

B) Migrate on first load — read localStorage data on first visit and import coins + sticker list into the player's new DB profile, then clear localStorage.

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
Should quiz completion history be tracked in the database?

A) Full history — store each quiz attempt: player, category, score, coins earned, timestamp

B) Coins only — only track total coin balance; no detailed quiz history

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
Security: The new backend API will expose player data (coins, stickers, profile) over HTTP.
Should the Security Baseline extension be enforced (API input validation, Supabase Row-Level Security, safe error handling)?

A) Yes — enforce security baseline as blocking constraints (recommended for any backend with real data)

B) No — skip security baseline (acceptable for internal/prototype projects)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
What should happen if the Supabase API is temporarily unavailable (network error)?

A) Show an error and block interaction until reconnected

B) Fall back to cached localStorage data silently, sync when back online

C) Show a brief "connecting..." state and retry automatically

D) Other (please describe after [Answer]: tag below)

[Answer]: B
