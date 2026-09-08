# Domain Entities — coin-rewards-difficulty

## Difficulty

```
Difficulty = 'easy' | 'medium' | 'hard'
```

A categorical label assigned to each quiz question at the time it is created. Determines the coin reward range for the session (via dominant difficulty).

**Values**:
- `'easy'` — lower-reward tier; coin range [5, 10]
- `'medium'` — mid-reward tier; coin range [10, 30]
- `'hard'` — high-reward tier; coin range [10, 30] (same as medium per spec)

**Assignment**: Randomly, uniformly distributed (~33% each) at question construction time.

---

## Question (updated)

The existing `Question` interface gains a `difficulty` field:

```
Question {
  question:     string       -- the question text
  options:      string[]     -- the 3 answer choices
  correctIndex: number       -- index of the correct option (0, 1, or 2)
  difficulty:   Difficulty   -- NEW: assigned at construction
}
```

**Invariants**:
- `options.length === 3`
- `correctIndex` ∈ {0, 1, 2}
- `difficulty` ∈ {'easy', 'medium', 'hard'}

---

## QuizSession (conceptual, not a persisted entity)

A quiz session is the in-memory representation of a single quiz run:

```
QuizSession {
  questions:   Question[]   -- all questions in the session
  answers:     number[]     -- index of selected answer per question
  score:       number       -- count of correctly answered questions
  difficulties: Difficulty[] -- collected during the session (same as questions[i].difficulty)
}
```

**Session result**:
- `coinsEarned: number` — calculated by `calculateSessionCoins(difficulties)` at session end
- Persisted via `POST /api/quiz/history { ..., coinsEarned }`
