# Business Logic Model — Grade2MathFeature

## Overview

Three pure generator functions produce randomised quiz questions. Each returns a `Question` object (the existing type used by `QuizModal`). All functions are stateless and side-effect-free, making them directly testable with property-based tests.

---

## Shared Output Type

```
Question {
  question    : string   // display text shown to the child
  options     : string[] // always exactly 3 elements
  correctIndex: number   // 0 | 1 | 2
}
```

This type is already defined in `components/quiz-modal.tsx` and is reused without modification.

---

## Function 1: generateAdditionQuestion()

### Algorithm

```
1. Pick a = random integer in [1, 100]
2. Pick b = random integer in [1, 100]
3. correct = a + b                         // may exceed 100
4. distractors = generateDistractors(correct, "mixed", "arithmetic")
5. [option0, option1, option2], correctIndex = insertAtRandom(correct, distractors)
6. return { question: `${a} + ${b} = ?`, options, correctIndex }
```

### Testable Properties (PBT-01)

| Property Category | Property | Formal Statement |
|---|---|---|
| **Invariant** | Operands in range | `a ∈ [1,100]` and `b ∈ [1,100]` for all generated questions |
| **Invariant** | Correct answer is arithmetically exact | `parseInt(options[correctIndex]) === a + b` for all (a, b) |
| **Invariant** | Exactly 3 options | `options.length === 3` always |
| **Invariant** | correctIndex is valid | `correctIndex ∈ {0, 1, 2}` always |
| **Invariant** | All options are distinct | No two elements in `options` are equal |
| **Invariant** | All options are non-negative strings | `parseInt(opt) >= 0` for every `opt` in `options` |
| **Invariant** | Options are numeric strings | Every element in `options` parses to a finite integer |
| **Commutativity** | Addition is commutative | `generateAdditionQuestion` with (a, b) and (b, a) produce the same correct answer value |

---

## Function 2: generateSubtractionQuestion()

### Algorithm

```
1. Pick a = random integer in [1, 100]
2. Pick b = random integer in [1, 100]
3. [minuend, subtrahend] = [max(a,b), min(a,b)]  // ensures result ≥ 0
4. correct = minuend - subtrahend                  // always ≥ 0
5. distractors = generateDistractors(correct, "mixed", "arithmetic")
6. [option0, option1, option2], correctIndex = insertAtRandom(correct, distractors)
7. return { question: `${minuend} - ${subtrahend} = ?`, options, correctIndex }
```

### Edge Case
If `a === b`, both operands are equal and `correct = 0`. Zero is a valid answer. Distractors must not include zero in this case (enforced by BR-08).

### Testable Properties (PBT-01)

| Property Category | Property | Formal Statement |
|---|---|---|
| **Invariant** | Result non-negative | `minuend - subtrahend >= 0` always |
| **Invariant** | Correct answer is arithmetically exact | `parseInt(options[correctIndex]) === minuend - subtrahend` |
| **Invariant** | minuend ≥ subtrahend | `max(a,b) - min(a,b)` ordering is always applied |
| **Invariant** | Exactly 3 distinct non-negative options | Same as Addition invariants |
| **Invariant** | correctIndex valid | `correctIndex ∈ {0, 1, 2}` |
| **Oracle** | Subtraction inverse of addition | `subtrahend + correct === minuend` (addition can verify subtraction) |

---

## Function 3: generateTimesTableQuestion(language)

### Algorithm

```
1. Pick multiplier  = random integer in [2, 9]
2. Pick multiplicand = random integer in [1, 10]
3. correct = multiplier × multiplicand
4. distractors = generateDistractors(correct, "mixed", "multiply", multiplier, multiplicand)
5. [option0, option1, option2], correctIndex = insertAtRandom(correct, distractors)
6. format = random pick from ["symbol", "word"]  // 50/50
7. question = format === "symbol"
     ? `${multiplier} × ${multiplicand} = ?`
     : (language === "vi"
         ? `${multiplier} nhân ${multiplicand} bằng mấy?`
         : `${multiplier} times ${multiplicand} equals?`)
8. return { question, options, correctIndex }
```

### Note on word format
The word-format template uses plain number literals embedded in a sentence — no number-to-word translation is required. The template strings live in `data/translations.ts` as parameterised templates and are filled at call time.

### Testable Properties (PBT-01)

| Property Category | Property | Formal Statement |
|---|---|---|
| **Invariant** | Multiplier in curriculum range | `multiplier ∈ {2,3,4,5,6,7,8,9}` always |
| **Invariant** | Multiplicand in range | `multiplicand ∈ {1,...,10}` always |
| **Invariant** | Correct answer is arithmetically exact | `parseInt(options[correctIndex]) === multiplier * multiplicand` |
| **Invariant** | Exactly 3 distinct positive options | `options.length === 3`, all distinct, all > 0 |
| **Oracle** | Known multiplication table | Result matches the deterministic multiplication table (brute-force oracle: `multiplier * multiplicand`) |
| **Invariant** | format is exactly one of two values | `format ∈ {"symbol", "word"}` |
| **Invariant** | correctIndex valid | `correctIndex ∈ {0, 1, 2}` |

---

## Function 4: generateDistractors(correct, strategy, context, multiplier?, multiplicand?)

### Purpose
Generates exactly 2 distinct distractor values that are different from `correct` and from each other. Used by all three question generators.

### Strategy: "mixed"
Randomly selects one of two sub-strategies per call:

#### Sub-strategy A — Offset
```
delta1 = random integer in [1, 15]
delta2 = random integer in [1, 15], delta2 ≠ delta1
candidate1 = correct + (random sign) * delta1
candidate2 = correct + (random sign) * delta2
// Re-roll if candidate equals correct, is negative, or equals the other candidate
```

#### Sub-strategy B — Adjacent Value
- **Arithmetic context** (`context === "arithmetic"`):
  ```
  candidate1 = correct + 10   // simulates carry/borrow boundary mistake
  candidate2 = correct - 10   // clamp to ≥ 1 if result < 0
  // Re-roll offset fallback if candidates collide with correct or each other
  ```
- **Multiplication context** (`context === "multiply"`):
  ```
  candidate1 = multiplier × (multiplicand + 1)   // adjacent row in table
  candidate2 = multiplier × (multiplicand - 1)   // adjacent row in table
  // If multiplicand = 10: use (multiplicand - 1) and (multiplicand - 2)
  // If multiplicand = 1:  use (multiplicand + 1) and (multiplicand + 2)
  // Re-roll offset fallback if candidates collide with correct
  ```

### Shared Distractor Invariants (PBT-01)

| Property Category | Property |
|---|---|
| **Invariant** | Exactly 2 distractors returned |
| **Invariant** | Neither distractor equals `correct` |
| **Invariant** | The two distractors are distinct from each other |
| **Invariant** | All distractors are positive integers (≥ 1) |
| **Invariant** | For multiplication: distractors are products from valid table entries (adjacent strategy) |

---

## Function 5: insertAtRandom(correct, [d1, d2])

### Algorithm
```
correctIndex = random integer in {0, 1, 2}
options = [d1, d2]                            // start with distractors
options.splice(correctIndex, 0, String(correct))  // insert correct at random position
return { options, correctIndex }
```

### Testable Properties (PBT-01)

| Property Category | Property |
|---|---|
| **Invariant** | `options.length === 3` always |
| **Invariant** | `options[correctIndex] === String(correct)` always |
| **Invariant** | `correctIndex ∈ {0, 1, 2}` always |
| **Invariant** | The other two positions contain the distractors |
