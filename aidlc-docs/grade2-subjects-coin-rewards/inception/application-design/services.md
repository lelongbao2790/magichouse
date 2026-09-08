# Services

## lib/coin-rewards.ts (New Utility Module)

This is a pure utility module, not a service in the infrastructure sense. It encapsulates all coin-reward business logic and is the single source of truth for difficulty-to-coin mapping.

**Module exports**:
- `Difficulty` type
- `randomDifficulty(): Difficulty`
- `dominantDifficulty(difficulties: Difficulty[]): Difficulty`
- `calculateSessionCoins(difficulties: Difficulty[]): number`

**Why a separate module** (not merged into `lib/utils.ts`):
- Domain-specific logic (coin rewards) benefits from isolation
- PBT tests target this module directly
- Keeps `lib/utils.ts` as a general Tailwind/className utility

---

## Existing Services (Unchanged)

### lib/services/quiz.ts
No changes. `recordHistory()` and `getHistory()` continue to accept `coinsEarned: number` as an opaque integer — the value passed in will now be dynamically computed instead of hardcoded to 10.

### lib/services/player.ts, stickers.ts, canvas.ts
No changes.

### contexts/coin-context.tsx
No changes to the interface. `addCoins(amount)` is called by the dashboard with the computed `coinsEarned` — the change is upstream in how that number is computed.

---

## Data Content (translations.ts)

### Grade 2 Vietnamese Question Pool (15 questions)
Stored under `quizVietnameseGrade2` namespace in `data/translations.ts`.
- Questions: Vietnamese vocabulary, category identification, general knowledge appropriate for Grade 2 (7–8 year olds)
- Format: VI + EN translations for both question text and option text
- Pool size: 15 questions; 10 randomly selected per session

### Grade 2 English Question Pool (15 questions)
Stored under `quizEnglishGrade2` namespace in `data/translations.ts`.
- Questions: English vocabulary, opposites, basic grammar, common knowledge for Grade 2 (7–8 year olds)
- Format: Same text in VI and EN (or VI hint + EN content, following Grade 1 English pattern)
- Pool size: 15 questions; 10 randomly selected per session

### Coin Display Translations
- `quiz.claimCoins`: Changed from `"Nhận 10 Xu!"` / `"Claim 10 Coins!"` to accept a dynamic count parameter, or replaced with a generic `"Nhận Xu!"` / `"Claim Coins!"`
- `quiz.earnCoins`: Changed from `"+10 Xu"` / `"+10 Coins"` to `"+Xu"` / `"+Coins"`
