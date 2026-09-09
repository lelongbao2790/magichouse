# U3 NFR Requirements Plan — admin-content-api

**Status**: Awaiting user answers
**Last updated**: 2026-09-09

Light stage. Security is the main topic (this is a write API); most of it is already set in
U3 Functional Design. No new dependencies.

---

## Answers — all A
1=A log 403s (`console.warn`) · 2=A rely on platform rate limiting · 3=A no other concern

## Plan — DONE
- [x] `nfr-requirements/nfr-requirements.md`
- [x] `nfr-requirements/tech-stack-decisions.md`

---

## Questions

### Q1 — Failed admin-access attempts (403s)

A) **Log them** — `console.warn('[admin] 403 <email> <path>')` on every rejected request, so
   the deploy logs show attempts. No blocking, no lockout. *(Recommended — cheap visibility)*

B) **Don't log** — a 403 is unremarkable; keep the logs quiet

C) Other (describe after [Answer]: tag)

[Answer]:A

### Q2 — Rate limiting / brute-force protection on the admin routes

A) **Rely on the platform** (Vercel / Supabase edge limits) — the gate is an env-var
   allowlist, not a password, so there's nothing to brute-force. Document this and move on.
   *(Recommended)*

B) Add an in-route limiter (describe after [Answer]: tag)

[Answer]:A

### Q3 — Anything else (payload size, response caching, etc.)

A) **No new concern.** Admin writes are tiny single-row operations; no caching (writes);
   responses are small. *(Recommended)*

B) I have a concern (describe after [Answer]: tag)

[Answer]:A
