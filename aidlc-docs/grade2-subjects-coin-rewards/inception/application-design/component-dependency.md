# Component Dependencies

## Dependency Matrix

| Component | Depends On | Changed By |
|---|---|---|
| `lib/coin-rewards.ts` | nothing | Unit: coin-rewards-difficulty |
| `components/quiz-modal.tsx` | `lib/coin-rewards.ts` (Difficulty type) | Unit: coin-rewards-difficulty |
| `components/grade2-subject-view.tsx` | `contexts/language-context`, Lucide icons | Unit: grade2-subjects-nav |
| `components/learning-zone.tsx` | `lib/coin-rewards.ts`, `grade2-subject-view.tsx`, `quiz-modal.tsx`, `data/translations.ts`, `contexts/language-context` | Both units |
| `data/translations.ts` | nothing | Unit: grade2-subjects-nav (new content) |
| `automation_tests/unit/coin-rewards.test.ts` | `lib/coin-rewards.ts` | Unit: coin-rewards-difficulty |

## Data Flow Diagram

```
Student clicks Grade 2 subject
          |
          v
+-----------------------------+
| Grade2SubjectView           |
| selectedSubject: null       |
| Shows: Math, VN, EN cards   |
+-----------------------------+
          |
          | clicks Math
          v
+-----------------------------+
| Grade2SubjectView           |
| selectedSubject: 'math'     |
| Shows: +, -, × cards + Back |
+-----------------------------+
          |
          | clicks Addition
          v
+-----------------------------+
| LearningZone                |
| setActiveQuiz('addition')   |
+-----------------------------+
          |
          | opens
          v
+-----------------------------+      +---------------------------+
| QuizModal                   |      | lib/coin-rewards.ts       |
| - shows question with badge |      | randomDifficulty()        |
| - accumulates difficulties  |----->| (called per question in   |
| - onComplete(score, total,  |      |  quizData construction)   |
|     difficulties[])         |      +---------------------------+
+-----------------------------+
          |
          | onComplete callback
          v
+-----------------------------+      +---------------------------+
| LearningZone                |      | lib/coin-rewards.ts       |
| handleQuizCompleteInternal  |----->| calculateSessionCoins()   |
| - gets coinsEarned          |      +---------------------------+
| - POST /api/quiz/history    |
| - calls onQuizComplete      |
+-----------------------------+
          |
          v
+-----------------------------+
| Dashboard / Parent          |
| addCoins(coinsEarned)       |
+-----------------------------+
          |
          v
+-----------------------------+
| /api/players/coins          |
| players.coins += amount     |
+-----------------------------+
```

## Implementation Sequence (Unit Dependencies)

```
Unit 2: coin-rewards-difficulty (NO dependencies)
  -> lib/coin-rewards.ts           (new)
  -> quiz-modal.tsx                (Difficulty type + badge + difficulties[] in onComplete)
  -> learning-zone.tsx             (handleQuizCompleteInternal receives difficulties[])
  -> coin-rewards.test.ts          (PBT + unit tests)
        |
        v (must complete first)
Unit 1: grade2-subjects-nav (DEPENDS ON Difficulty type from Unit 2)
  -> data/translations.ts          (Grade 2 VN + EN content + coin label updates)
  -> components/grade2-subject-view.tsx   (new)
  -> learning-zone.tsx             (Grade 2 tab → Grade2SubjectView, quizData additions)
```

## Communication Patterns

- **Grade2SubjectView → LearningZone**: callback prop `onSelectPractice(id)` — upward event
- **LearningZone → QuizModal**: `questions[]` (with difficulty), `onComplete` callback — prop drilling
- **QuizModal → LearningZone**: `onComplete(score, total, difficulties[])` — callback with accumulated data
- **LearningZone → lib/coin-rewards**: direct function call — synchronous pure utility
- **LearningZone → /api/quiz/history**: fetch POST — async side effect after quiz completion
