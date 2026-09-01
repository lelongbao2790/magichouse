# Business Rules — Grade2MathFeature

## Addition Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-ADD-01 | Both operands `a` and `b` must be integers in the closed range [1, 100] | Generator pre-condition |
| BR-ADD-02 | The correct answer is `a + b`; it may exceed 100 (no upper bound on result) | Arithmetic, no clamping |
| BR-ADD-03 | The question string format is `"${a} + ${b} = ?"` | String template |

## Subtraction Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-SUB-01 | Both operands must be integers in [1, 100] | Generator pre-condition |
| BR-SUB-02 | The result must always be ≥ 0 — the larger operand is always the minuend | `max(a,b) - min(a,b)` ordering enforced before subtraction |
| BR-SUB-03 | A result of 0 (when `a === b`) is a valid answer | No special-casing needed |
| BR-SUB-04 | The question string format is `"${minuend} - ${subtrahend} = ?"` | String template |

## Times Table Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-TT-01 | The multiplier must be an integer in {2, 3, 4, 5, 6, 7, 8, 9} (Vietnamese Grade 2 curriculum) | Generator range constraint |
| BR-TT-02 | The multiplicand must be an integer in {1, 2, …, 10} | Generator range constraint |
| BR-TT-03 | The correct answer is `multiplier × multiplicand` | Arithmetic |
| BR-TT-04 | Question format is randomly selected 50/50 between symbol format and word format, independently per question | `Math.random() < 0.5` |
| BR-TT-05 | Symbol format: `"${multiplier} × ${multiplicand} = ?"` | String template |
| BR-TT-06 | Word format (vi): `"${multiplier} nhân ${multiplicand} bằng mấy?"` | i18n template |
| BR-TT-07 | Word format (en): `"${multiplier} times ${multiplicand} equals?"` | i18n template |

## Distractor Rules (all question types)

| ID | Rule | Enforcement |
|---|---|---|
| BR-DIS-01 | Exactly 2 distractors are generated per question | Fixed count |
| BR-DIS-02 | Neither distractor may equal the correct answer | Re-roll on collision |
| BR-DIS-03 | The two distractors must be distinct from each other | Re-roll on collision |
| BR-DIS-04 | All distractors must be positive integers (≥ 1) | Clamp / re-roll |
| BR-DIS-05 | Distractor strategy is randomly selected per question: offset or adjacent-value | `Math.random() < 0.5` |
| BR-DIS-06 | Offset strategy: delta values in [1, 15], applied with random sign; re-roll if result ≤ 0 or collides | Clamp + re-roll loop |
| BR-DIS-07 | Adjacent-value strategy (arithmetic): candidates are `correct ± 10`; fall back to offset if collision or result ≤ 0 | Fallback logic |
| BR-DIS-08 | Adjacent-value strategy (multiplication): candidates are `multiplier × (multiplicand ± 1)`; clamped for boundary multiplicand values (1 or 10) | Boundary handling |

## Answer Placement Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-OPT-01 | Each question has exactly 3 options | Fixed array length |
| BR-OPT-02 | The correct answer is inserted at a uniformly random position (0, 1, or 2) | `Math.floor(Math.random() * 3)` |
| BR-OPT-03 | All 3 options are string representations of non-negative integers | `String(value)` conversion |
| BR-OPT-04 | `correctIndex` always points to the element equal to the correct answer | Enforced by `insertAtRandom` |

## Quiz Session Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-SES-01 | Each Grade 2 quiz session contains exactly 10 questions | `Array.from({ length: 10 }, generator)` |
| BR-SES-02 | Questions in a session are generated independently — no de-duplication required | Each call is independent |
| BR-SES-03 | Questions are generated once per session mount via `useMemo` — they do not regenerate mid-session | `useMemo([], [...])` pattern |
| BR-SES-04 | Session questions are not persisted after the modal closes | In-component state only |

## Reward Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-REW-01 | Completing any Grade 2 quiz awards exactly 10 coins | `addCoins(10)` in Dashboard.handleQuizComplete |
| BR-REW-02 | Coins are awarded regardless of score (not per correct answer) | Existing QuizModal onComplete callback pattern |
| BR-REW-03 | Fireworks animation is triggered on quiz completion | Existing `showFireworks` mechanism |

## Answer Interaction Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-ANS-01 | A child may select only one answer per question — selection is final | `disabled={selectedAnswer !== null}` in QuizModal |
| BR-ANS-02 | No retry is permitted — after selecting an answer the Next button appears | Existing QuizModal flow |
| BR-ANS-03 | The correct answer is always revealed regardless of whether the child answered correctly | Existing QuizModal highlight logic |
| BR-ANS-04 | Free-text input is not supported — answer input is button-tap only | Multiple-choice UI only |
