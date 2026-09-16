# Unit of Work Dependency — my-house

**Status**: Approved (user, 2026-09-13)
**Last updated**: 2026-09-13

---

## Dependency Matrix

| Unit | Depends On | Nature of Dependency |
|---|---|---|
| **U1 — house-schema-and-service** | (none) | Foundation unit; no dependency on U2 |
| **U2 — my-house-ui** | **U1** | Contract-level only: U2's client code calls U1's 5 API routes (added `GET /api/rooms` 2026-09-13, per U1 Functional Design) and consumes U1's response shapes (`HouseItemRow`, `PlacedHouseItem`, `RoomTab`, etc.) |

**No circular dependency**: U1 has zero awareness of U2; the relationship is strictly
U2 -> U1.

---

## Build-Order Note (per Q2=B)

The dependency above is a **contract** dependency, not a **build-schedule** dependency. Per the
approved Unit of Work Plan, U1 and U2 are built **in parallel**:

- U2 starts immediately against hand-written stub types that mirror U1's planned shapes
  (already sketched in `component-methods.md` / `services.md` — e.g. `HouseItemRow`,
  `PlacedHouseItem`).
- A **reconciliation step** happens once both units are code-complete and before Build and
  Test: U2's stub types are checked/replaced against U1's real `lib/database.types.ts`
  additions and actual API response shapes.
- If reconciliation surfaces a mismatch (e.g. a field name or shape difference between the stub
  and the real API), U2's affected code is corrected — this is expected, low-risk integration
  work given both units are designed from the same Application Design artifacts.

```
+-------------------+
| U2 -- my-house-ui |
+-------------------+
          |
            depends on (API contract + types)
          v
+--------------------------------+
| U1 -- house-schema-and-service |
+--------------------------------+
```

### Text Alternative

```
U2 (my-house-ui) depends on U1 (house-schema-and-service) at the API-contract/type level.
Both units are built in parallel against stub types; reconciled once both are code-complete.
U1 has no dependency on U2.
```

---

## Shared-File Touch Points (per Q3=A — no unit conflict)

| File | Touched By | Nature of Edit |
|---|---|---|
| `lib/database.types.ts` | U1 only | Additive — 3 new table Row/Insert/Update types |
| `lib/validation/api.ts` | U1 only | Additive — 4 new Zod schemas |
| `data/translations.ts` | U2 only | Additive — UI-chrome keys only (no item names) |
| `contexts/coin-context.tsx` | U2 only | Additive — `ownedHouseItems`/`buyHouseItem()`/`hasHouseItem()` |
| `components/dashboard.tsx` | U2 only | Additive — 4th card + `ViewType` branch |

No file requires a merge between U1 and U2's edits — each shared file is touched by exactly one
unit.

---

## Deployment Note (per Q4=A)

U1 and U2 ship together in a single release. The forward-only migration and the 3 new tables
exist without being deployed as a partial/staged rollout — matches the `subject-content-db`
precedent and carries no user-facing risk (unreferenced tables until U2's code also ships).
