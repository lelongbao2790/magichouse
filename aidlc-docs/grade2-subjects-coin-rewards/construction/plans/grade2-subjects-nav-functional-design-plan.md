# Functional Design Plan — grade2-subjects-nav

## Unit Context
- **Unit**: grade2-subjects-nav
- **Requirements**: FR-1, FR-2, FR-3, FR-6.2, FR-6.3
- **Depends on**: Unit 1 (Difficulty type, randomDifficulty available)

## Question Assessment

All functional design categories evaluated. No questions needed:
- **Business Logic**: Two-level navigation state machine — fully specified in Application Design (Q1=A)
- **Domain Model**: SubjectCard, PracticeCard entities — derivable from existing category patterns
- **Business Rules**: 15-question pools, 10 per session via useMemo, correctIndex distributions — specified by requirements
- **Data Flow**: Grade2SubjectView → LearningZone.setActiveQuiz — specified in Application Design
- **Integration Points**: No new API/DB integrations; same quiz history endpoint
- **Error Handling**: No new error paths (same as existing quiz launch)
- **Frontend Components**: Grade2SubjectView two-level nav — fully specified in Application Design (Q1=A)
- **Quiz Content**: AI-generated Grade 2 Vietnamese and English questions (Q3=D) — designed in business-logic-model

## Artifacts to Generate

- [x] `functional-design/domain-entities.md`
- [x] `functional-design/business-logic-model.md`
- [x] `functional-design/business-rules.md`
- [x] `functional-design/frontend-components.md`
