# NFR Requirements — coin-rewards-difficulty

## Testing Requirements

### Unit Tests (Vitest)

**Target**: `lib/coin-rewards.ts` — all three exported functions

| Function | Test Cases |
|---|---|
| `randomDifficulty()` | Returns one of 'easy', 'medium', 'hard' (run N times to confirm all three occur) |
| `dominantDifficulty()` | See table below |
| `calculateSessionCoins()` | See PBT properties below |

**`dominantDifficulty()` deterministic cases**:

| Input | Expected Output |
|---|---|
| `[]` | `'easy'` |
| `['easy']` | `'easy'` |
| `['medium']` | `'medium'` |
| `['hard']` | `'hard'` |
| `['easy','easy','easy']` | `'easy'` |
| `['easy','medium','hard']` | `'hard'` (each count=1, hard tie-break wins) |
| `['easy','easy','medium','medium','hard']` | `'medium'` (easy=2, medium=2, hard=1 → medium≥easy, hard<medium) |
| `['easy','hard','medium','hard','easy']` | `'hard'` (easy=2, medium=1, hard=2 → hard≥medium AND hard≥easy) |
| `['easy','easy','medium']` | `'medium'` (medium=1 > easy=2? No — medium=1, easy=2 → easy wins) |
| `['easy','easy','medium','medium']` | `'medium'` (equal counts, medium beats easy tie-break) |

**Clarification on last two rows**: tie-break applies only when counts are equal.  
- `['easy','easy','medium']` → easy=2, medium=1 → easy wins (no tie)  
- `['easy','easy','medium','medium']` → easy=2, medium=2 → tie → medium wins  

### Property-Based Tests (fast-check) — Partial Opt-In

**Scope**: `dominantDifficulty()` and `calculateSessionCoins()` only.  
`randomDifficulty()` is excluded from PBT (it is inherently non-deterministic; sampling tests suffice).

---

#### Properties for `dominantDifficulty(difficulties: Difficulty[])`

| ID | Property | Rationale |
|---|---|---|
| P-D1 | Output is always one of `{'easy', 'medium', 'hard'}` | Type invariant |
| P-D2 | Empty array always returns `'easy'` | BR-3 edge case |
| P-D3 | Singleton array returns the same difficulty | Identity property |
| P-D4 | All-same array returns that difficulty | Idempotence |
| P-D5 | If hard count ≥ medium count AND hard count ≥ easy count → returns `'hard'` | BR-2 tie-break |
| P-D6 | If hard count < max(medium, easy) AND medium count ≥ easy count → returns `'medium'` | BR-2 tie-break |
| P-D7 | Adding a `'hard'` element never changes result from `'hard'` to something lower | Monotonicity |

**Arbitrary generators needed**:
- `fc.array(fc.constantFrom('easy', 'medium', 'hard'))` — arbitrary Difficulty[]
- `fc.constantFrom('easy', 'medium', 'hard')` — arbitrary single Difficulty

---

#### Properties for `calculateSessionCoins(difficulties: Difficulty[])`

| ID | Property | Rationale |
|---|---|---|
| P-C1 | Output is always an integer (no fractional part) | BR-4 formula |
| P-C2 | Output is always ≥ 5 | Minimum possible (easy lower bound) |
| P-C3 | Output is always ≤ 30 | Maximum possible (medium/hard upper bound) |
| P-C4 | Empty array → output ∈ [5, 10] | BR-3 defaults to easy |
| P-C5 | If dominant is `'easy'` → output ∈ [5, 10] | BR-4 easy range |
| P-C6 | If dominant is `'medium'` → output ∈ [10, 30] | BR-4 medium range |
| P-C7 | If dominant is `'hard'` → output ∈ [10, 30] | BR-4 hard range |

**Note on P-C5/P-C6/P-C7**: Test by constructing inputs where dominant is known.  
Example for P-C5: input = array of all `'easy'` → dominantDifficulty = 'easy' → coins ∈ [5,10].

---

## Performance Requirements

- **Response time**: Not applicable — `calculateSessionCoins` is a synchronous pure function called once per quiz completion. Execution time is negligible (microseconds).
- **Bundle size**: `lib/coin-rewards.ts` adds minimal bundle weight (< 1 KB).

---

## Reliability Requirements

- **Defensive default**: BR-3 guarantees `calculateSessionCoins([])` returns a valid result in [5,10]. No throws, no undefined.
- **Type safety**: `Difficulty` union type enforced at compile time via TypeScript. Invalid difficulty values cannot be passed through typed callsites.

---

## Maintainability Requirements

- **Pure functions**: `dominantDifficulty` and `calculateSessionCoins` are pure (no side effects, no global state). This enables isolated unit testing and PBT.
- **TypeScript**: Strict `Difficulty` union type — adding or removing difficulty levels triggers compile errors at all call sites.
- **Test coverage**: All pure exported functions in `lib/coin-rewards.ts` must have unit test coverage. PBT covers the two primary algorithmic functions.
