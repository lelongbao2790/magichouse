## Cycle 0

les. No regressions.

---

**Summary of changes:**

| File | Change |
|---|---|
| `app/page.tsx` | Added `isSessionLoading` to the `useAuth()` destructuring on line 17 — the missing variable that caused the build-time `ReferenceError`. |
| `automation_tests/unit/home-content.test.tsx` | Updated `makeAuthValue` helper to accept an optional `isSessionLoading` parameter; added two MH-9 regression tests verifying the loading guard renders `null` while loading and the welcome screen once resolved. |
