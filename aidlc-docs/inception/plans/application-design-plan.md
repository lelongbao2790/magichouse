# Application Design Plan — Supabase Backend Integration

## Artifacts to Generate
- [x] components.md — all components with responsibilities
- [x] component-methods.md — method signatures for all components and service modules
- [x] services.md — service layer definitions and orchestration patterns
- [x] component-dependency.md — dependency graph and data flow
- [x] application-design.md — consolidated design document

---

## Design Questions

Please fill in each `[Answer]:` tag with the letter of your choice.
If no option fits, choose the last option and describe your preference.

---

### Question 1
How should the Login/Register UI be presented on the Welcome Screen?

The current Welcome Screen (`components/welcome-screen.tsx`) is a simple name-entry form.
With email/password auth, it needs to handle both new registrations and returning logins.

A) Single screen with a toggle — one form that switches between "Login" and "Register" modes (simpler, less navigation)

B) Two separate views — a "Welcome" landing that shows Login by default, with a "Create account" link that navigates to a separate Register view

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2
Should Supabase send an email verification link before a new account can log in?

A) Yes — require email confirmation before first login (more secure, but adds friction for children's accounts)

B) No — auto-confirm on signup, no email verification needed (simpler flow for family/parent-managed app)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 3
After login, how should the child's display name work?

Currently the app shows a "What is your name?" prompt on first visit.
With auth, the parent enters the child's name during registration.

A) Name comes from registration only — no name prompt after login; child's name is locked to what was entered at signup

B) Name can be changed after login — show a small "Edit name" option in the Dashboard or profile area

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4
What API response format should all routes use?

A) Raw + HTTP status — API routes return the data directly as JSON (e.g., `{ coins: 50 }`) and use HTTP status codes (200/400/401/500) to signal errors

B) Envelope format — all responses use `{ data: ..., error: string | null }` wrapper regardless of success or failure (HTTP always 200)

C) Other (please describe after [Answer]: tag below)

[Answer]: B
