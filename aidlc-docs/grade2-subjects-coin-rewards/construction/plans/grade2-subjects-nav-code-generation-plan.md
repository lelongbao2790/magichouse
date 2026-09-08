# Code Generation Plan — grade2-subjects-nav

## Unit Context
- **Unit**: grade2-subjects-nav
- **Workspace Root**: D:\WebPractice_Data\magichouse
- **Project Type**: Brownfield Next.js monolith
- **Requirements Covered**: FR-1, FR-2, FR-3, FR-6.2, FR-6.3
- **Dependencies**: Unit 1 complete (`Difficulty`, `randomDifficulty` available in `lib/coin-rewards.ts`)

## Stories Implemented
- Grade 2 two-level subject navigation (Math drill-down; VN/EN direct launch)
- Grade 2 Vietnamese 15-question pool, 10 randomly selected per session
- Grade 2 English 15-question pool, 10 randomly selected per session
- API validation extended to accept new category IDs

---

## Generation Steps

### Step 1: Modify `lib/validation/api.ts` — Extend Category Enum
- [x] Modify existing file `lib/validation/api.ts`
- Add `'grade2Vietnamese'` and `'grade2English'` to the `z.enum([...])` in `QuizHistorySchema`

### Step 2: Modify `data/translations.ts` — Grade 2 Quiz Content
- [x] Modify existing file `data/translations.ts`
- Add `quizVietnameseGrade2` namespace — 15 questions, bilingual (vi/en), topics: word types, antonyms, punctuation, seasons, family vocabulary
- Add `quizEnglishGrade2` namespace — 15 questions, English-only content (same string in vi and en), topics: parts of speech, plurals, antonyms, animals, weather
- Each namespace: `title`, `q1`–`q15` (question text), `q1o1`–`q15o3` (options)

**Grade 2 Vietnamese correctIndex values**: 1, 0, 2, 1, 0, 2, 1, 2, 1, 1, 0, 2, 1, 0, 2
**Grade 2 English correctIndex values**: 2, 1, 2, 1, 0, 2, 1, 0, 2, 0, 1, 0, 1, 2, 0

### Step 3: Create `components/grade2-subject-view.tsx` — New Component
- [x] Create new file `components/grade2-subject-view.tsx`
- Props: `{ onSelectPractice: (practiceId: string) => void }`
- State: `const [selectedSubject, setSelectedSubject] = useState<'math' | null>(null)`
- Subject list view (selectedSubject === null):
  - Math card → `setSelectedSubject('math')`, `data-testid="grade2-subject-math"`
  - Vietnamese card → `onSelectPractice('grade2Vietnamese')`, `data-testid="grade2-subject-vietnamese"`
  - English card → `onSelectPractice('grade2English')`, `data-testid="grade2-subject-english"`
- Math sub-view (selectedSubject === 'math'):
  - Back button → `setSelectedSubject(null)`, `data-testid="grade2-math-back"`
  - Addition card → `onSelectPractice('addition')`, `data-testid="grade2-practice-addition"`
  - Subtraction card → `onSelectPractice('subtraction')`, `data-testid="grade2-practice-subtraction"`
  - Times Table card → `onSelectPractice('timesTable')`, `data-testid="grade2-practice-timesTable"`
- Card style matches `renderCategoryCard` pattern (same Tailwind classes, icon sizing, hover effects)
- Translations via `useLanguage` hook

### Step 4: Modify `components/learning-zone.tsx` — Grade 2 Integration
- [x] Modify existing file `components/learning-zone.tsx`
- Add import: `import { Grade2SubjectView } from "./grade2-subject-view"`
- Add `shuffleAndTake<T>(arr: T[], n: number): T[]` helper function (unexported, before component)
- Add `grade2VietnameseAllQuestions` and `grade2EnglishAllQuestions` inline arrays (15 questions each) using `t("quizVietnameseGrade2", ...)` and `t("quizEnglishGrade2", ...)` keys, with `difficulty: randomDifficulty()` on each
- Add two new `useMemo` entries:
  ```typescript
  const grade2VietnamesePool = useMemo(() => shuffleAndTake(grade2VietnameseAllQuestions, 10), [])
  const grade2EnglishPool = useMemo(() => shuffleAndTake(grade2EnglishAllQuestions, 10), [])
  ```
- Add two new `quizData` entries:
  ```typescript
  grade2Vietnamese: { title: t("quizVietnameseGrade2", "title"), questions: grade2VietnamesePool },
  grade2English:    { title: t("quizEnglishGrade2",    "title"), questions: grade2EnglishPool },
  ```
- Add `grade2VirtualCategories` array for icon lookup (grade2Vietnamese, grade2English entries)
- Update `allCategories`: add `...grade2VirtualCategories`
- Update tab content rendering — replace the flat grid for grade2 with `<Grade2SubjectView>`:
  ```tsx
  {activeTab === "grade2" ? (
    <Grade2SubjectView onSelectPractice={setActiveQuiz} />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeTabData?.categories.map(renderCategoryCard)}
    </div>
  )}
  ```
- Remove `grade2Categories` from the `tabs` array entry (Grade 2 tab no longer uses it for rendering) — keep `grade2Categories` in scope only for `allCategories` icon lookup

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `lib/validation/api.ts` | MODIFY | Add 2 category enum values |
| `data/translations.ts` | MODIFY | Add quizVietnameseGrade2 + quizEnglishGrade2 namespaces (15 Q each) |
| `components/grade2-subject-view.tsx` | CREATE | Two-level subject navigation component |
| `components/learning-zone.tsx` | MODIFY | Grade 2 tab integration, pool useMemos, quizData additions |

**No new npm packages. No DB changes.**
