# Business Logic Model — grade2-subjects-nav

## Process: Grade 2 Tab Navigation

**Trigger**: User clicks the Grade 2 tab in LearningZone

```
State: NavigationState = 'subjects' | 'math'   (inside Grade2SubjectView)

Initial: 'subjects'

Transitions:
  'subjects' + click Math card  → 'math'
  'math'     + click Back       → 'subjects'
  'subjects' + click Vietnamese → onSelectPractice('grade2Vietnamese')  [no state change]
  'subjects' + click English    → onSelectPractice('grade2English')     [no state change]
  'math'     + click Addition   → onSelectPractice('addition')          [no state change]
  'math'     + click Subtraction → onSelectPractice('subtraction')      [no state change]
  'math'     + click TimesTable → onSelectPractice('timesTable')        [no state change]
```

The `onSelectPractice(id)` callback is `LearningZone.setActiveQuiz`, which opens the `QuizModal`.

---

## Process: Grade 2 Question Pool Selection

**Trigger**: LearningZone mounts (or language changes for timesTableQuestions)

```
shuffleAndTake<T>(arr: T[], n: number): T[]
  copy = [...arr]
  // Fisher-Yates in-place shuffle
  for i from copy.length - 1 downto 1:
    j = Math.floor(Math.random() * (i + 1))
    swap(copy[i], copy[j])
  return copy.slice(0, n)
```

**Applied to**:
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

`[]` dependency array = computed once on mount, stable for the session.

---

## Grade 2 Vietnamese Question Pool (15 questions)

Namespace: `quizVietnameseGrade2`  
Audience: Grade 2 students, 7–8 years old  
Language: Bilingual (vi/en) — questions test Vietnamese language knowledge

| # | Question (vi) | Question (en) | Options (o1/o2/o3) | correctIndex |
|---|---|---|---|---|
| 1 | Từ nào là từ chỉ màu sắc? | Which word names a color? | Chạy/Run \| Đỏ/Red \| Bàn/Table | 1 |
| 2 | Từ trái nghĩa của "to lớn" là? | What is the antonym of "big"? | Nhỏ bé/Small \| Nặng/Heavy \| Cao/Tall | 0 |
| 3 | "Học sinh" là gì? | What is a "học sinh"? | Giáo viên/Teacher \| Bác sĩ/Doctor \| Người đi học/A student | 2 |
| 4 | Con vật nào sống trong rừng? | Which animal lives in the forest? | Con cá/Fish \| Con hổ/Tiger \| Con vịt/Duck | 1 |
| 5 | Từ nào là động từ (chỉ hành động)? | Which word is a verb (action word)? | Nhảy/Jump \| Cái ghế/Chair \| Xanh/Green | 0 |
| 6 | Từ trái nghĩa của "ngắn" là? | What is the antonym of "short"? | Nặng/Heavy \| Cao/Tall \| Dài/Long | 2 |
| 7 | Mùa nào có nhiều hoa đẹp nở rộ? | Which season has many flowers blooming? | Mùa đông/Winter \| Mùa xuân/Spring \| Mùa thu/Autumn | 1 |
| 8 | Dụng cụ nào dùng để viết? | Which tool is used for writing? | Cái thước/Ruler \| Cái kéo/Scissors \| Cái bút/Pen | 2 |
| 9 | Câu nào viết đúng chuẩn? | Which sentence is written correctly? | "bạn ơi"/"hello" \| "Bạn ơi!"/"Hello!" \| "BẠN ƠI"/"HELLO" | 1 |
| 10 | Gia đình thường gồm những ai? | Who is usually in a family? | Thầy cô/Teachers \| Cha mẹ và con cái/Parents and children \| Bạn bè/Friends | 1 |
| 11 | Từ nào chỉ tình cảm? | Which word names a feeling? | Vui mừng/Happy \| Quyển sách/Book \| Chiếc xe/Car | 0 |
| 12 | Dấu câu nào dùng cuối câu hỏi? | Which mark ends a question? | Dấu chấm (.) /Period (.) \| Dấu phẩy (,)/Comma (,) \| Dấu hỏi (?)/Question mark (?) | 2 |
| 13 | Đâu là tên một mùa trong năm? | Which is the name of a season? | Tháng Ba/March \| Mùa hè/Summer \| Thứ Hai/Monday | 1 |
| 14 | Tháng nào trong năm có ít ngày nhất? | Which month has the fewest days? | Tháng Hai/February \| Tháng Ba/March \| Tháng Giêng/January | 0 |
| 15 | Bài thơ thường có đặc điểm gì? | What is a typical feature of a poem? | Không có vần/No rhyme \| Chỉ một dòng/Only one line \| Có vần điệu/Has rhyme | 2 |

---

## Grade 2 English Question Pool (15 questions)

Namespace: `quizEnglishGrade2`  
Audience: Grade 2 students, 7–8 years old  
Language: English-only content (both `vi` and `en` translation values are identical — the quiz tests English)

| # | Question | Options (o1/o2/o3) | correctIndex |
|---|---|---|---|
| 1 | Which word is a noun (name of a thing)? | Run \| Beautiful \| Apple | 2 |
| 2 | What is the opposite of "hot"? | Warm \| Cold \| Wet | 1 |
| 3 | How many days are in a week? | 5 \| 6 \| 7 | 2 |
| 4 | Which word is a verb (action word)? | Happy \| Jump \| Tall | 1 |
| 5 | What do you call a baby dog? | Puppy \| Kitten \| Cub | 0 |
| 6 | Which season comes after Winter? | Autumn \| Summer \| Spring | 2 |
| 7 | What color do you get mixing blue and yellow? | Purple \| Green \| Orange | 1 |
| 8 | Which animal is the largest? | Elephant \| Cat \| Dog | 0 |
| 9 | What is the plural of "child"? | Childs \| Childes \| Children | 2 |
| 10 | Which word has a silent letter? | Knife \| Cat \| Dog | 0 |
| 11 | How many sides does a rectangle have? | 3 \| 4 \| 5 | 1 |
| 12 | Which word is an adjective (describes a thing)? | Big \| Run \| Eat | 0 |
| 13 | Which sentence is correct? | "i like cats." \| "I like cats." \| "I like Cats." | 1 |
| 14 | What is the opposite of "open"? | Wide \| Near \| Closed | 2 |
| 15 | Which is a type of weather? | Rainy \| Monday \| Happy | 0 |

---

## Process: API Validation — New Category IDs

**Issue**: `lib/validation/api.ts` validates `category` against an explicit enum. The two new IDs (`grade2Vietnamese`, `grade2English`) are not in the current enum.

**Required change**: Add `'grade2Vietnamese'` and `'grade2English'` to the `QuizHistorySchema` category enum in `lib/validation/api.ts`.

**Current enum** (from reverse engineering):
```
'shapes' | 'colors' | 'animals' | 'math' | 'vietnamese' | 'english' | 'addition' | 'subtraction' | 'timesTable'
```

**Updated enum** (adds two values):
```
... | 'grade2Vietnamese' | 'grade2English'
```
