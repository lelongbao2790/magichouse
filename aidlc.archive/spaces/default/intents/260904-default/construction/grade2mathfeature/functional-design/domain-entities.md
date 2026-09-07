# Domain Entities — Grade2MathFeature

## Existing Types (reused, no changes)

### Question
Defined in `components/quiz-modal.tsx`. Reused as-is for all Grade 2 questions.

```typescript
interface Question {
  question:     string    // Display text shown to the child
  options:      string[]  // Always exactly 3 string elements
  correctIndex: number    // 0 | 1 | 2
}
```

### StickerItem
Unchanged. Not involved in this feature.

### Language
Defined in `data/translations.ts`. Reused as-is.

```typescript
type Language = "vi" | "en"
```

---

## New Types

### TabType (extended)
Currently `"preschool" | "grade1"` in `learning-zone.tsx`. Extended to include `"grade2"`.

```typescript
type TabType = "preschool" | "grade1" | "grade2"
```

### Grade2Category
Identifies which Grade 2 quiz the child selected.

```typescript
type Grade2Category = "addition" | "subtraction" | "timesTable"
```

### QuestionFormat
Used internally by `generateTimesTableQuestion` to select the question presentation style.

```typescript
type QuestionFormat = "symbol" | "word"
```

### DistractorStrategy
Used internally by `generateDistractors` to select the distractor generation approach.

```typescript
type DistractorStrategy = "offset" | "adjacent"
```

### DistractorContext
Provides context to the adjacent-value strategy so it can produce appropriate distractors.

```typescript
type DistractorContext = "arithmetic" | "multiply"
```

---

## Data Structures

### Grade2 Category Card Definition
Follows the same shape as `preschoolCategories` and `grade1Categories` in `learning-zone.tsx`.

```typescript
interface CategoryCard {
  id:      string          // "addition" | "subtraction" | "timesTable"
  name:    string          // Translated display name from t()
  icon:    LucideIcon      // Icon component from lucide-react
  color:   string          // Tailwind gradient class e.g. "from-blue-400 to-cyan-400"
  bgColor: string          // Tailwind bg class e.g. "bg-blue-100"
}
```

### Grade2 Quiz Data Entry
Follows the same shape as existing entries in `quizData` object in `learning-zone.tsx`.

```typescript
interface QuizDataEntry {
  title:     string      // Translated quiz title from t()
  questions: Question[]  // 10 randomly generated Question objects
}
```

---

## Translation Key Structure (new keys in data/translations.ts)

All new keys follow the existing `translations[section][key][language]` pattern.

### New section: `grade2`
| Key | vi | en |
|---|---|---|
| `tab` | `"Lớp 2"` | `"Grade 2"` |
| `addition` | `"Toán Cộng"` | `"Addition"` |
| `subtraction` | `"Toán Trừ"` | `"Subtraction"` |
| `timesTable` | `"Bảng Cửu Chương"` | `"Times Table"` |

### New section: `quizAddition`
| Key | vi | en |
|---|---|---|
| `title` | `"Quiz Toán Cộng"` | `"Addition Quiz"` |
| `wordTemplate` | `"{a} cộng {b} bằng mấy?"` | `"{a} plus {b} equals?"` |

### New section: `quizSubtraction`
| Key | vi | en |
|---|---|---|
| `title` | `"Quiz Toán Trừ"` | `"Subtraction Quiz"` |

### New section: `quizTimesTable`
| Key | vi | en |
|---|---|---|
| `title` | `"Quiz Bảng Cửu Chương"` | `"Times Table Quiz"` |
| `wordTemplate` | `"{a} nhân {b} bằng mấy?"` | `"{a} times {b} equals?"` |

**Note**: Word-format templates use `{a}` and `{b}` as placeholders replaced at generation time with number literals. No word-to-word number translation is required.

---

## localStorage Schema (unchanged)
No new localStorage keys. Coin balance (`kidCoins`) is updated by the existing `CoinContext.addCoins()` mechanism. No Grade 2-specific persistence is needed.
