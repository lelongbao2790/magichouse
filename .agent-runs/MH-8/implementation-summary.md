## Cycle 0

ates to dashboard) |

**Root cause fixed:** `useEffect([isAuthenticated])` only fires when the boolean changes. After pressing Back while still authenticated, re-submitting credentials calls `setPlayer(newData)` in auth context — `isAuthenticated` stays `true` (unchanged), so the effect never fires. Changing the dependency to `[player, isAuthenticated]` ensures the effect fires whenever a new `player` object is set (i.e., every successful login), regardless of whether `isAuthenticated` toggled.
