# Integration Test Instructions — grade2-subjects-coin-rewards

## Scope

This initiative is a brownfield enhancement to a single Next.js monolith. Integration concerns are limited to:
1. **Unit 1 → Unit 2 integration**: `Difficulty` type from `lib/coin-rewards.ts` consumed by `grade2-subject-view.tsx` and `learning-zone.tsx`
2. **Quiz completion flow**: QuizModal → LearningZone → Dashboard → CoinContext
3. **API contract**: `POST /api/quiz/history` with new category values

## Manual Integration Scenarios

### Scenario 1: Grade 2 Vietnamese quiz — full coin flow
**Pre-condition**: App running locally (`bun run dev`), logged-in player

**Steps**:
1. Navigate to Learning Zone → Grade 2 tab
2. Verify: three subject cards shown (Math, Tiếng Việt/Vietnamese, Anh Văn/English)
3. Click Vietnamese — quiz modal opens with title "Quiz Tiếng Việt Lớp 2"
4. Verify: difficulty badge visible on each question (⭐ / ⭐⭐ / ⭐⭐⭐)
5. Answer all 10 questions
6. Click "Nhận Xu!" / "Claim Coins!" on results screen
7. Verify: fireworks play; coin count increases by 5–30 coins
8. Verify: browser network tab shows `POST /api/quiz/history` with `category: "grade2Vietnamese"` and `coinsEarned` matching the earned amount

### Scenario 2: Math drill-down navigation
**Steps**:
1. Grade 2 tab → click Math card
2. Verify: back button visible; three practice cards shown (Cộng/Addition, Trừ/Subtraction, Nhân/Times Table)
3. Click Back → returns to subject list
4. Click Math again → Addition → quiz modal opens with addition questions

### Scenario 3: Coin range verification (Easy session)
**Steps**:
1. Complete any quiz where all displayed difficulty badges are ⭐ (Easy)
2. Observe coin reward — must be in [5, 10]

### Scenario 4: Backward compatibility — Preschool Shapes
**Steps**:
1. Navigate to Preschool tab → Shapes
2. Complete quiz; verify fireworks + coin award still works correctly
3. Confirm difficulty badges appear on each question

## API Contract Verification

```bash
# With a valid session cookie, send:
curl -X POST http://localhost:3000/api/quiz/history \
  -H "Content-Type: application/json" \
  -d '{"category":"grade2Vietnamese","score":8,"totalQuestions":10,"coinsEarned":15}'
# Expected: 200 { "success": true }

curl -X POST http://localhost:3000/api/quiz/history \
  -H "Content-Type: application/json" \
  -d '{"category":"grade2English","score":7,"totalQuestions":10,"coinsEarned":22}'
# Expected: 200 { "success": true }
```
