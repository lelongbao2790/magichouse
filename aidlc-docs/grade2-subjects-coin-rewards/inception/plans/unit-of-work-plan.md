# Unit of Work Plan

## Context

Two units of work were identified in the execution plan and fully specified by Application Design.
No additional decomposition questions are needed — all categories evaluated:

- **Story Grouping**: No user stories (stage skipped); units map directly to requirements FR-1–FR-6
- **Dependencies**: Clear sequential dependency (Unit 2 provides `Difficulty` type used by Unit 1)
- **Team Alignment**: Single developer — not applicable
- **Technical Considerations**: Brownfield monolith — no differential deployment needs
- **Business Domain**: Two distinct business capabilities (coin logic vs. navigation/content)
- **Code Organization**: Brownfield — follows existing file structure

---

## Approved Unit Structure

### Unit 1: coin-rewards-difficulty
**Implements**: FR-4 (per-question difficulty), FR-5 (coin calculation), FR-6 partial (QuizModal interface + coin display)
**New files**: `lib/coin-rewards.ts`, `automation_tests/unit/coin-rewards.test.ts`
**Modified files**: `components/quiz-modal.tsx`, `components/learning-zone.tsx` (handleQuizCompleteInternal only)
**Dependencies**: None (foundational)

### Unit 2: grade2-subjects-nav
**Implements**: FR-1 (Grade 2 navigation), FR-2 (Grade 2 VN content), FR-3 (Grade 2 EN content), FR-6 partial (label updates)
**New files**: `components/grade2-subject-view.tsx`
**Modified files**: `data/translations.ts`, `components/learning-zone.tsx` (quizData + Grade 2 tab rendering)
**Dependencies**: Requires `Difficulty` type from Unit 1

---

## Generation Steps

- [x] Generate `inception/application-design/unit-of-work.md`
- [x] Generate `inception/application-design/unit-of-work-dependency.md`
- [x] Generate `inception/application-design/unit-of-work-story-map.md`
- [x] Validate unit boundaries and dependencies are consistent with Application Design
