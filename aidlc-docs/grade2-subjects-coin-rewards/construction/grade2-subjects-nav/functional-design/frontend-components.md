# Frontend Components — grade2-subjects-nav

## Grade2SubjectView (new component)

### Props
```typescript
interface Grade2SubjectViewProps {
  onSelectPractice: (practiceId: string) => void
}
```

`onSelectPractice` is wired to `LearningZone`'s `setActiveQuiz`, which opens the QuizModal.

### Internal State
```typescript
const [selectedSubject, setSelectedSubject] = useState<'math' | null>(null)
```

- `null` = subject list view (Math, Vietnamese, English cards)
- `'math'` = Math sub-view (Addition, Subtraction, Times Table cards + Back button)

### Subject Cards (selectedSubject === null)

Three cards rendered in a grid matching the existing `renderCategoryCard` style:

| Card | Icon | Gradient | On Click |
|---|---|---|---|
| Math | `Calculator` | `from-blue-500 to-indigo-500` | `setSelectedSubject('math')` |
| Vietnamese | `BookOpen` | `from-purple-400 to-violet-400` | `onSelectPractice('grade2Vietnamese')` |
| English | `Languages` | `from-red-400 to-pink-400` | `onSelectPractice('grade2English')` |

Labels from translations: `t("categories", "math")`, `t("categories", "vietnamese")`, `t("categories", "english")`

`data-testid` values: `"grade2-subject-math"`, `"grade2-subject-vietnamese"`, `"grade2-subject-english"`

### Math Sub-View (selectedSubject === 'math')

**Back button** (rendered above practice cards):
```html
<button onClick={() => setSelectedSubject(null)} data-testid="grade2-math-back">
  ← {t("common", "back")}
</button>
```

**Sub-heading**: `t("categories", "math")` (e.g. "Toán" / "Math")

Three practice cards in the same grid style:

| Card | Icon | Gradient | On Click |
|---|---|---|---|
| Addition | `Plus` | `from-blue-500 to-indigo-500` | `onSelectPractice('addition')` |
| Subtraction | `Minus` | `from-orange-400 to-red-500` | `onSelectPractice('subtraction')` |
| Times Table | `X` (lucide) | `from-violet-400 to-purple-500` | `onSelectPractice('timesTable')` |

`data-testid` values: `"grade2-practice-addition"`, `"grade2-practice-subtraction"`, `"grade2-practice-timesTable"`

### File Location
`components/grade2-subject-view.tsx`

---

## LearningZone (partial update — this unit only)

### Imports Added
```typescript
import { Grade2SubjectView } from "./grade2-subject-view"
```

`randomDifficulty` is already imported from Unit 1.

### New useMemo entries
```typescript
const grade2VietnamesePool = useMemo(
  () => shuffleAndTake(grade2VietnameseAllQuestions, 10),
  []
)
const grade2EnglishPool = useMemo(
  () => shuffleAndTake(grade2EnglishAllQuestions, 10),
  []
)
```

`grade2VietnameseAllQuestions` and `grade2EnglishAllQuestions` are the full 15-question arrays built inline (same pattern as `quizData`).

### shuffleAndTake helper
Defined locally inside the component file (unexported):
```typescript
function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}
```

### quizData additions
```typescript
grade2Vietnamese: {
  title: t("quizVietnameseGrade2", "title"),
  questions: grade2VietnamesePool,
},
grade2English: {
  title: t("quizEnglishGrade2", "title"),
  questions: grade2EnglishPool,
},
```

### Grade 2 Tab Content Rendering
Replace the current Grade 2 tab content (which renders `grade2Categories` via `renderCategoryCard`) with:
```tsx
{activeTab === "grade2" ? (
  <Grade2SubjectView onSelectPractice={setActiveQuiz} />
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {activeTabData?.categories.map(renderCategoryCard)}
  </div>
)}
```

**Note**: The `grade2Categories` array in `LearningZone` becomes unused after this change and should be removed to avoid dead code.

### allCategories lookup
The `allCategories` array used to find the icon for the active quiz:
```typescript
const allCategories = [...preschoolCategories, ...grade1Categories, ...grade2Categories]
```
needs `grade2Categories` to still exist OR the new Grade 2 entries must be added to `allCategories`. Since `grade2Categories` is removed, the new virtual category entries (grade2Vietnamese, grade2English) must be added directly or the lookup must be adapted.

**Resolution**: Keep `grade2Categories` only for `allCategories` lookup — but also add the two new virtual entries:
```typescript
const grade2VirtualCategories = [
  { id: "grade2Vietnamese", name: t("categories", "vietnamese"), icon: BookOpen, color: "from-purple-400 to-violet-400", bgColor: "bg-purple-100" },
  { id: "grade2English", name: t("categories", "english"), icon: Languages, color: "from-red-400 to-pink-400", bgColor: "bg-red-100" },
]
const allCategories = [...preschoolCategories, ...grade1Categories, ...grade2Categories, ...grade2VirtualCategories]
```

---

## lib/validation/api.ts (partial update)

Add `'grade2Vietnamese'` and `'grade2English'` to the `category` enum in `QuizHistorySchema` so history records for these new quizzes are accepted by the API.
