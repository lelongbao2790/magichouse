# Domain Entities — grade2-subjects-nav

## SubjectId

```
SubjectId = 'math' | 'vietnamese' | 'english'
```

Identifies the three Grade 2 subjects. Used as the internal navigation state in `Grade2SubjectView`.

---

## SubjectCard

Represents a top-level subject entry in the Grade 2 subject list.

```
SubjectCard {
  id:      SubjectId    -- navigation key
  name:    string       -- translated display label
  icon:    LucideIcon   -- icon component
  color:   string       -- Tailwind gradient class (bg-gradient-to-br)
  bgColor: string       -- Tailwind background class (for icon container)
}
```

**Three instances**: Math, Vietnamese, English.

**Behaviour**:
- Math → internal drill-down (shows `MathSubView`)
- Vietnamese → calls `onSelectPractice('grade2Vietnamese')`
- English → calls `onSelectPractice('grade2English')`

---

## PracticeCard

Represents a drill-down practice entry under Math.

```
PracticeCard {
  id:      string       -- quiz category key: 'addition' | 'subtraction' | 'timesTable'
  name:    string       -- translated display label
  icon:    LucideIcon
  color:   string
  bgColor: string
}
```

**Three instances**: Addition, Subtraction, Times Table (same IDs as existing Grade 2 quizzes).

**Behaviour**: calls `onSelectPractice(id)` — launches existing quiz.

---

## Grade2SubjectView — Internal Navigation State

```
NavigationState = 'subjects' | 'math'
```

- `'subjects'` — showing the three subject cards (Math, Vietnamese, English)
- `'math'` — showing the Math sub-view (Addition, Subtraction, Times Table) with a back button

**Transition**:
- Click Math → `'subjects'` → `'math'`
- Click Back → `'math'` → `'subjects'`
- Click Vietnamese/English → calls `onSelectPractice(...)` (no state change; parent handles modal)

---

## Grade2QuestionPool

A static array of 15 `Question` objects (with `difficulty` field) loaded in `LearningZone` via the translation system and `randomDifficulty()` calls.

```
Grade2QuestionPool {
  namespace: 'quizVietnameseGrade2' | 'quizEnglishGrade2'
  size:      15
  sessionSize: 10   -- randomly selected per session via useMemo
}
```

**Session selection**: `useMemo(() => shuffleAndTake(fullPool, 10), [])`

`shuffleAndTake` = Fisher-Yates shuffle, take first 10.
