# Functional Design Plan — coin-rewards-difficulty

## Unit Context
- **Unit**: coin-rewards-difficulty
- **Requirements**: FR-4, FR-5, FR-6.1, NFR-1.1, NFR-1.2

## Question Assessment

All functional design categories evaluated. No questions needed:
- **Business Logic**: Difficulty assignment, dominant difficulty, coin ranges — fully specified in requirements
- **Domain Model**: `Difficulty` type, `Question.difficulty` — specified in application design
- **Business Rules**: Ranges (5–10, 10–30, 10–30), tie-breaking (higher difficulty wins), edge case (empty → 'easy') — all specified
- **Data Flow**: `difficulties[]` path QuizModal → LearningZone → calculateSessionCoins — fully specified
- **Integration Points**: No new integrations; `/api/quiz/history` contract unchanged
- **Error Handling**: Empty array → 'easy' edge case specified; no other error paths
- **Frontend Components**: Difficulty badge in QuizModal — badge text/star format specified (Easy ⭐ / Medium ⭐⭐ / Hard ⭐⭐⭐)

## Artifacts to Generate

- [x] `functional-design/business-logic-model.md`
- [x] `functional-design/business-rules.md`
- [x] `functional-design/domain-entities.md`
- [x] `functional-design/frontend-components.md`
