# Functional Design Plan — Unit 2: BackendAuthAPI

## Unit Context
- **Unit**: BackendAuthAPI
- **Depends on**: Unit 1 (players table, database.types.ts)
- **Produces**: Auth routes, Supabase clients, AuthContext, Login/Register UI
- **NFR Stages**: NFR Requirements + NFR Design (both EXECUTE for this unit)

## Artifacts to Generate
- [x] domain-entities.md — session shape, Player type, auth state
- [x] business-rules.md — signup rules, login rules, session rules, route contracts
- [x] business-logic-model.md — per-route logic flows, AuthContext state machine
- [x] frontend-components.md — LoginView, RegisterView, WelcomeScreen props/state/flows

---

## Questions

### Question 1
When a login attempt fails (wrong password, or email not registered), what error message
should the API route return?

Returning specific messages ("email not found" vs "wrong password") leaks account
existence, which violates SECURITY-12 (authentication hardening — must not reveal
whether an account exists).

A) Generic message: `"Invalid email or password"` for all auth failures (SECURITY-12
   compliant — does not reveal whether the email exists)

B) Specific messages: `"Email not registered"` vs `"Wrong password"` (better UX for
   debugging, but reveals account existence)

[Answer]: B

---

### Question 2
While the app is checking the session on initial page load (before it knows if the user
is logged in), what should be shown?

A) Loading spinner — render nothing until the session check resolves (prevents any flash
   of the WelcomeScreen for already-logged-in users)

B) WelcomeScreen immediately — show the login/register form right away; if session is
   confirmed, redirect silently without a spinner

[Answer]: B

---

### Question 3
When an unauthenticated user opens the app, which view should appear by default inside
WelcomeScreen?

A) Login form first — most returning users will log in, not register

B) Register form first — new users are the expected landing state

[Answer]: A
