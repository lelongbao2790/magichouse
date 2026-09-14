# Test Case Design — QA Clarifying Questions (my-house)

Please answer each question by filling in the letter(s) after the `[Answer]:` tag (some allow
multiple selections — say so if so). If none of the options fit, choose the last option
(**Other**) and describe your choice. Let me know when you're done.

---

## Question 1 — Critical user paths (select all that MUST be verified by an automated browser test after every push)

A) Opening My House shows the Bedroom by default with the coin balance visible (AC-1/AC-2)

B) Buying an affordable item deducts coins and moves it into "My Items" (AC-3)

C) Trying to buy an item you can't afford is blocked and no coins are deducted (AC-4)

D) Dragging an owned item onto the Bedroom places it, and it can be moved/removed (AC-5)

E) Reloading My House restores previously bought items and their saved positions (AC-6)

F) All of the above

X) Other (please describe after [Answer]: tag below)

[Answer]:F

---

## Question 2 — Edge cases and error paths

Two things came up while designing this that the requirements doc didn't explicitly cover:

**2a.** What should happen if the house-items catalog or the player's layout **fails to load**
(network error, server error)? The existing Creative Room canvas just silently falls back to an
empty layout on load failure (no visible error); the newer Sticker Shop pattern from a later
initiative shows a friendly error message with a Retry button.

A) Match the **older Creative Room** behavior — fail silently, show an empty/default state, no visible error

B) Match the **newer pattern** — show a friendly error message with a Retry button *(more consistent with recent work, but more to build/test)*

X) Other (please describe after [Answer]: tag below)

[Answer]:A

**2b.** Should we add an automated test for the "no coins" empty-ish path, i.e. a player who owns zero house items opening My House for the first time (empty "My Items" strip, nothing placed in the Bedroom)?

A) Yes — add an automated test for the first-time/empty state

B) No — not worth automating, skip it

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 3 — Manual-only scenarios (things too subjective/complex to automate — pick all that should go on the developer's manual checklist)

A) Reviewing the actual emoji/name/price choices for the 6 seeded items look right and appealing to a child

B) Visually checking the drag-and-drop feels smooth and items don't overlap awkwardly on a real phone screen size

C) Confirming the migration applied correctly on the live Supabase project (row counts, RLS working)

D) All of the above

X) Other (please describe after [Answer]: tag below)

[Answer]:D

---

## Question 4 — Browser/device scope for automated E2E tests

The project's Playwright config currently runs **Chromium only** (set during the prior
`subject-content-db` initiative).

A) Keep Chromium only *(matches current project convention)*

B) Add Firefox too

C) Add a mobile viewport test as well (drag-and-drop is a touch-relevant interaction)

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 5 — Test account / data preconditions

Buying the cheapest item (Lamp, 40 coins) needs at least 40 coins; buying the Bed needs 100.

A) The E2E test account should start with a **known, sufficiently high coin balance** (e.g. top up via the existing `/api/players/coins` test helper before the test runs) *(Recommended — matches how other E2E specs seed state)*

B) The test should work with **whatever balance the shared E2E account currently has**, skipping the purchase assertion if the balance is too low

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 6 — Regression boundary (which existing flows must be explicitly re-verified after this change)

A) Sticker Shop + Creative Room still work and share the coin balance correctly with My House

B) Learning Zone quiz-completion coin rewards still work (coins earned there must be spendable in My House)

C) Dashboard navigation between all 4 sections (Shop/Creative/Learning/My House) works both ways

D) All of the above

X) Other (please describe after [Answer]: tag below)

[Answer]:D
