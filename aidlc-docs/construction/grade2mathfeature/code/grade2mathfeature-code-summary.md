# Code Summary — Grade2MathFeature

## Modified Files

### `data/translations.ts`
- Added `grade2`, `grade2Desc` to `dashboard` section
- Added `addition`, `subtraction`, `timesTable` to `categories` section
- Added 4 new sections: `grade2`, `quizAddition`, `quizSubtraction`, `quizTimesTable` (each with `title` key in vi/en)

### `components/learning-zone.tsx`
- Added `import { type Language }` from `@/data/translations`
- Added `BookCheck, Plus, Minus, X` to Lucide import
- Expanded `TabType` to include `"grade2"`
- Added 3 local type aliases: `QuestionFormat`, `DistractorStrategy`, `DistractorContext`
- Added 5 exported generator functions: `generateDistractors`, `insertAtRandom`, `generateAdditionQuestion`, `generateSubtractionQuestion`, `generateTimesTableQuestion`
- Destructured `language` from `useLanguage()` hook
- Added 3 `useMemo` blocks: `additionQuestions`, `subtractionQuestions`, `timesTableQuestions` (10 questions each)
- Added `addition`, `subtraction`, `timesTable` entries to `quizData`
- Added `grade2Categories` array (Plus/Minus/X icons, blue-indigo/orange-red/violet-purple gradients)
- Added Grade 2 entry to `tabs` array with `BookCheck` icon and `data-testid="tab-grade2"` (auto-applied via render loop)
- Updated `allCategories` to include `grade2Categories`

### `package.json`
- Added 4 dev dependencies: `fast-check ^3.22.0`, `vitest ^3.0.0`, `@vitest/coverage-v8 ^3.0.0`, `@vitejs/plugin-react ^4.0.0`
- Added 3 scripts: `test`, `test:watch`, `test:coverage`

## Created Files

### `vitest.config.ts`
Vitest configuration: jsdom environment, globals enabled, `@/` alias resolves to workspace root, React plugin for JSX, v8 coverage provider.

### `__tests__/learning-zone.pbt.test.ts`
Property-based tests using fast-check with `{ verbose: true, numRuns: 100 }` on all assertions.
- `generateAdditionQuestion`: 4 properties (ADD-P1 through ADD-P4)
- `generateSubtractionQuestion`: 4 properties (SUB-P1 through SUB-P4)
- `generateTimesTableQuestion`: 5 properties (TT-P1 through TT-P5)
- `generateDistractors (arithmetic)`: 4 properties (DR-P1 through DR-P4)
- `generateDistractors (multiply)`: 3 properties
- `insertAtRandom`: 4 properties (AP-P1 through AP-P4)

### `__tests__/learning-zone.test.ts`
Example-based boundary and contract tests.
- Addition: format validation, max operand correctness
- Subtraction: equal operand → result 0, non-negative invariant
- TimesTable: smallest product (2), largest product (90), symbol format, Vietnamese word format, English word format
- Distractor contract: spot-check with known inputs
- insertAtRandom: position 0 reachable, position 2 reachable

## Requirements Traceability

| FR | Status | File |
|---|---|---|
| FR-01 (Grade 2 tab) | ✅ Implemented | learning-zone.tsx |
| FR-02 (3 categories) | ✅ Implemented | learning-zone.tsx |
| FR-03 (Addition rules) | ✅ Implemented | learning-zone.tsx |
| FR-04 (Subtraction rules) | ✅ Implemented | learning-zone.tsx |
| FR-05 (Times table rules) | ✅ Implemented | learning-zone.tsx |
| FR-06 (Mixed distractor strategy) | ✅ Implemented | learning-zone.tsx |
| FR-07 (10 coins) | ✅ No change needed — dashboard already handles |
| FR-08 (Fireworks) | ✅ No change needed — dashboard already handles |
| FR-09 (Bilingual) | ✅ Implemented | translations.ts + learning-zone.tsx |
| FR-10 (Pure functions) | ✅ Implemented — all 5 are pure synchronous exports |
| FR-11 (UI matches Grade 1) | ✅ Same renderCategoryCard and tabs pattern reused |
| FR-12 (Multiple-choice only) | ✅ No change needed — QuizModal only renders option buttons |
| FR-13 (No retry) | ✅ No change needed — QuizModal disabled={selectedAnswer !== null} |
| NFR-01 (PBT) | ✅ fast-check + Vitest + 20 PBT properties + 12 example tests |
| NFR-02 (Code consistency) | ✅ Same patterns: useMemo, categories array, tabs array |
| NFR-03 (Synchronous) | ✅ All generators are synchronous |
| NFR-04 (data-testid) | ✅ tab-grade2, quiz-addition, quiz-subtraction, quiz-timesTable auto-applied |
| NFR-05 (Translation keys) | ✅ translations[section][key][language] structure maintained |
