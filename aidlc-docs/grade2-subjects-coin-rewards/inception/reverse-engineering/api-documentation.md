# API Documentation

## REST APIs

### POST /api/quiz/history
- **Purpose**: Record a completed quiz session and award coins
- **Request**: `{ category, score, totalQuestions, coinsEarned }`
- **Response**: `{ data: null }` on success
- **Notes**: `coinsEarned` is currently always 10 (hardcoded in learning-zone.tsx)

### GET /api/quiz/history
- **Purpose**: Retrieve the authenticated player's quiz history
- **Response**: `{ data: QuizHistoryRow[] }`

### POST /api/players/coins
- **Purpose**: Add coins to the authenticated player's balance
- **Request**: `{ amount: number }` (positive integer, max 1000)
- **Response**: `{ data: { coins: number } }`

### GET /api/players/me
- **Purpose**: Get the authenticated player's profile
- **Response**: `{ data: PlayerRow }`

### POST /api/players/stickers
- **Purpose**: Purchase a sticker using coins
- **Request**: `{ stickerId: string }`
- **Response**: `{ data: { newCoinBalance: number } }`

### GET /api/players/stickers
- **Purpose**: Get list of sticker IDs owned by the player
- **Response**: `{ data: string[] }`

## Data Models

### QuizHistoryRow
- `id: string` — UUID primary key
- `player_id: string` — FK to players
- `category: enum` — 'shapes' | 'colors' | 'animals' | 'math' | 'vietnamese' | 'english' | 'addition' | 'subtraction' | 'timesTable'
- `score: number` — Correct answers count
- `total_questions: number` — Total questions in session
- `coins_earned: number` — Coins awarded for this session
- `completed_at: string` — ISO timestamp

### PlayerRow
- `id: string` — UUID (= Supabase Auth user.id)
- `name: string` — Display name
- `coins: number` — Current coin balance
- `created_at: string` — ISO timestamp
- `updated_at: string` — ISO timestamp

## Coin Flow (Current)

```
LearningZone.handleQuizCompleteInternal()
  -> POST /api/quiz/history { coinsEarned: 10 }  // records history
  -> onQuizComplete(category, score, total)       // bubbles up to dashboard
     -> dashboard calls addCoins(10)              // coin-context
        -> POST /api/players/coins { amount: 10 } // updates player.coins
```

**Note**: The coin amount (10) is hardcoded in `learning-zone.tsx:274`. The `coinsEarned` value in quiz_history and the `amount` in players/coins are calculated separately but always set to 10.
