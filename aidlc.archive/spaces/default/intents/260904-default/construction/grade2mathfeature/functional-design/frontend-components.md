# Frontend Components — Grade2MathFeature

## Affected Component: LearningZone

**File**: `components/learning-zone.tsx`  
**Change type**: Modify (extend, no structural rework)

---

## State Changes

### TabType extension
```typescript
// Before
type TabType = "preschool" | "grade1"

// After
type TabType = "preschool" | "grade1" | "grade2"
```

`activeTab` state and all tab-conditional logic must handle the new `"grade2"` value.

---

## New useMemo Blocks (question generation)

Three new `useMemo` blocks added alongside the existing `mathQuestions` memo. Each generates 10 questions on component mount and does not regenerate mid-session.

```typescript
const additionQuestions  = useMemo(() => Array.from({ length: 10 }, generateAdditionQuestion),    [])
const subtractionQuestions = useMemo(() => Array.from({ length: 10 }, generateSubtractionQuestion), [])
const timesTableQuestions  = useMemo(() => Array.from({ length: 10 }, () => generateTimesTableQuestion(language)), [language])
```

**Note on `timesTableQuestions` dependency**: The `language` value is needed to build the word-format question string. Adding `language` to the dependency array means times table questions regenerate if the child switches language mid-session — this is correct behaviour (the question text must match the active language).

---

## New Category Card Array: grade2Categories

```typescript
const grade2Categories = [
  {
    id:      "addition",
    name:    t("grade2", "addition"),
    icon:    Plus,           // from lucide-react
    color:   "from-blue-400 to-indigo-400",
    bgColor: "bg-blue-100",
  },
  {
    id:      "subtraction",
    name:    t("grade2", "subtraction"),
    icon:    Minus,          // from lucide-react
    color:   "from-orange-400 to-red-400",
    bgColor: "bg-orange-100",
  },
  {
    id:      "timesTable",
    name:    t("grade2", "timesTable"),
    icon:    X,              // X icon from lucide-react represents multiplication
    color:   "from-violet-400 to-purple-400",
    bgColor: "bg-violet-100",
  },
]
```

**Icon selection note**: `Plus`, `Minus`, and `X` are all available from `lucide-react` and are already imported in other parts of the app. If `X` is ambiguous (it is also the close icon), use `Sigma` or `Hash` as an alternative for Times Table.

---

## Tab Array Extension

```typescript
const tabs = [
  { id: "preschool" as const, name: t("dashboard", "preschool"), icon: Baby,         categories: preschoolCategories },
  { id: "grade1"    as const, name: t("dashboard", "grade1"),    icon: GraduationCap, categories: grade1Categories    },
  { id: "grade2"    as const, name: t("grade2", "tab"),          icon: BookCheck,     categories: grade2Categories    },
  // BookCheck from lucide-react — represents checked/completed grade work
]
```

---

## quizData Extension

```typescript
const quizData = {
  // ... existing entries (shapes, colors, animals, math, vietnamese, english) ...

  addition: {
    title:     t("quizAddition", "title"),
    questions: additionQuestions,
  },
  subtraction: {
    title:     t("quizSubtraction", "title"),
    questions: subtractionQuestions,
  },
  timesTable: {
    title:     t("quizTimesTable", "title"),
    questions: timesTableQuestions,
  },
}
```

**Key type change**: `activeQuiz` is typed as `string | null`, and `quizData[activeQuiz as keyof typeof quizData]` already handles dynamic key lookup. The new keys integrate without a type change.

---

## allCategories Extension

```typescript
const allCategories = [...preschoolCategories, ...grade1Categories, ...grade2Categories]
```

Used to find the current category icon and name when `activeQuiz` is set — extending this spread is sufficient.

---

## Tab Content Rendering

The existing `renderCategoryCard` function and tab content grid are generic — they render whatever `activeTabData?.categories` provides. No changes to the render function itself are needed; the Grade 2 categories are consumed identically to Preschool and Grade 1 categories.

---

## User Interaction Flow

```
Child taps "Grade 2" tab
  → activeTab = "grade2"
  → grade2Categories rendered in 3-column grid

Child taps "Addition" card
  → activeQuiz = "addition"
  → QuizModal opens with additionQuestions (10 questions)
  → Child answers each question (1 attempt, no retry — FR-13)
  → QuizModal shows results screen
  → Child taps "Claim 10 Coins"
  → onComplete() fires → handleQuizCompleteInternal()
  → addCoins(10) + showFireworks = true (in Dashboard)
  → QuizModal resets and closes
```

This flow is identical for Subtraction and Times Table — only the `activeQuiz` key and question set differ.

---

## data-testid Attributes (NFR-04)

| Element | data-testid |
|---|---|
| Grade 2 tab button | `tab-grade2` |
| Addition category card | `quiz-addition` |
| Subtraction category card | `quiz-subtraction` |
| Times Table category card | `quiz-timesTable` |

These follow the existing naming convention (`tab-{id}` and `quiz-{id}`) already used for preschool and grade1 tabs/categories.

---

## No Changes Required In

| Component | Reason |
|---|---|
| `components/quiz-modal.tsx` | Receives `Question[]` and title — fully generic; no changes needed |
| `components/dashboard.tsx` | `handleQuizComplete` and `showFireworks` already generic; no changes needed |
| `components/fireworks.tsx` | No changes |
| `components/coin-display.tsx` | No changes |
| `components/sticker-shop.tsx` | No changes |
| `components/creative-room.tsx` | No changes |
| `contexts/coin-context.tsx` | `addCoins(10)` already exists; no changes |
