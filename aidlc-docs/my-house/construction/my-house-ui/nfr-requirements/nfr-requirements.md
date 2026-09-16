# NFR Requirements — U2: my-house-ui

**Status**: Draft (NFR Requirements)
**Last updated**: 2026-09-14

---

## Scalability

Client-rendered UI; no server-side scalability characteristic distinct from U1's (unchanged
from `house-schema-and-service/nfr-requirements/nfr-requirements.md`).

## Performance

- Drag-and-drop: Framer Motion, identical mechanic to `creative-room.tsx` already in
  production — no new performance profile.
- Data fetching: `useHouseItems`/`useRooms` module-cached per session (Application Design
  Q4=B); layout is a direct `fetch` per room-switch, not cached (a layout genuinely changes
  during a session, unlike the catalog/room list).

## Availability

Inherits U1's assessment (Vercel platform posture, unchanged).

## Security (re-verified against Functional Design output)

| Rule | Status | Notes |
|---|---|---|
| SECURITY-05 (input validation) | Compliant (inherited) | No new client-submitted input shape — purchase/layout payloads are exactly what U1's Zod schemas already validate; the client just constructs them |
| SECURITY-08 (access control) | N/A for this unit | Access control is enforced server-side (U1); U2 has no server-side surface of its own |
| SECURITY-11 (secure design) | Compliant | BR-2's "no ownership cross-check on render" is explicitly a UX choice, not a security control — the actual invariant is enforced by U1's BR-4 at write time; documented as such to avoid confusion during Code Generation |
| All other rules | Unchanged from `requirements.md` §6 / U1's re-verification | U2 introduces no new data store, network intermediary, credential surface, or dependency |

**No new blocking security finding.**

## Resiliency

Unchanged from U1's assessment — directional best practices, not blocking (Q11=A). No
unit-specific resiliency concern for a client-rendered screen beyond what's already covered.

## Reliability

All failure-mode decisions already made at Functional Design (Q1=A, Q2a=A, BR-7's accepted
debounce-window risk) — restated here for completeness, not re-decided.

## Maintainability

Testing fully specified in `test-case-design.md` (TC-E018-027 E2E, the layout-clamping unit
test, PBT-E/F). No unit-specific maintainability decision beyond that.

## Usability

- No keyboard-accessible alternative to drag-and-drop for placing/repositioning items —
  matches `creative-room.tsx`'s identical, pre-existing gap; not introduced or required to be
  fixed by this unit (see `my-house-ui-nfr-requirements-plan.md` for the full reasoning).
- Touch-target sizing and mobile drag feel are covered by TC-M007's manual verification, not a
  design-time NFR decision.
