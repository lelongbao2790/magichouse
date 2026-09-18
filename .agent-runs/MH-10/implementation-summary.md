## Cycle 0

tion | ✓ `UPDATE players SET coins = 0` |
| No other user fields modified | ✓ Only `coins` column in SET clause |
| Migration is idempotent | ✓ Setting a column to a constant is always safe to re-run |

**Note:** Live DB verification (Tasks 2 steps 1-7) requires Docker Desktop to be running locally. The migration SQL itself is correct — `UPDATE players SET coins = 0` satisfies the `CHECK (coins >= 0)` constraint and is naturally idempotent. Apply via `supabase db push` once Docker is available.
