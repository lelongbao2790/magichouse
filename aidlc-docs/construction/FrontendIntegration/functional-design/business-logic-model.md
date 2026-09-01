# Business Logic Model — Unit 4: FrontendIntegration

## CoinContext Initialization Flow

```
useEffect([player]):
  if player === null:
    → reset: coins=0, ownedStickers=[], isLoaded=false, isCacheFallback=false
    → return

  if player !== null:
    try:
      const [meRes, stickersRes] = await Promise.all([
        fetch('/api/players/me'),
        fetch('/api/players/stickers')
      ])
      const { data: meData } = await meRes.json()
      const { data: stickersData } = await stickersRes.json()

      setCoins(meData.coins)
      setOwnedStickers(stickersData)
      localStorage.setItem("kidCoins", meData.coins.toString())
      localStorage.setItem("kidStickers", JSON.stringify(stickersData))
      setIsLoaded(true)

      → checkMigration(stickersData)

    catch:
      // API failure — use localStorage fallback
      const cachedCoins = parseInt(localStorage.getItem("kidCoins") ?? "0")
      const cachedStickers = JSON.parse(localStorage.getItem("kidStickers") ?? "[]")
      setCoins(cachedCoins)
      setOwnedStickers(cachedStickers)
      setIsCacheFallback(true)
      setIsLoaded(true)
```

---

## Migration Check

```
function checkMigration(currentStickers: string[]):
  if localStorage.getItem("migrationDone") === "true": return

  const savedCoins = parseInt(localStorage.getItem("kidCoins") ?? "0")
  const savedStickers = JSON.parse(localStorage.getItem("kidStickers") ?? "[]")

  if savedCoins === 0 && savedStickers.length === 0: return  // nothing to migrate

  // Fire-and-forget
  fetch('/api/players/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coins: savedCoins, ownedStickers: savedStickers })
  })
    .then(r => r.json())
    .then(({ error }) => { if (!error) localStorage.setItem("migrationDone", "true") })
    .catch(() => {})
```

---

## addCoins(amount) — Optimistic (Q4=A)

```
addCoins(amount):
  const newCoins = coins + amount
  setCoins(newCoins)                                           // optimistic
  localStorage.setItem("kidCoins", newCoins.toString())       // cache

  fetch('/api/players/coins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  })
    .then(r => r.json())
    .then(({ data }) => { if (data) setCoins(data.coins) })   // sync with server
    .catch(() => {})                                           // silent on fail
```

---

## buySticker(sticker) — Loading State (Q1=A)

```
async buySticker(sticker: StickerRow): Promise<boolean>:
  try:
    const res = await fetch('/api/players/stickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stickerId: sticker.id })
    })
    const { data, error } = await res.json()

    if (error || !data):
      return false

    const newStickers = [...ownedStickers, sticker.id]
    setCoins(data.newCoinBalance)
    setOwnedStickers(newStickers)
    localStorage.setItem("kidCoins", data.newCoinBalance.toString())
    localStorage.setItem("kidStickers", JSON.stringify(newStickers))
    return true

  catch:
    return false
```

---

## page.tsx Auth-Gated Routing

```
function HomeContent():
  const { isAuthenticated } = useAuth()
  const [showDashboard, setShowDashboard] = useState(false)

  // Transition to dashboard when auth confirmed
  useEffect([isAuthenticated]):
    if isAuthenticated: setShowDashboard(true)
    else: setShowDashboard(false)

  if showDashboard && isAuthenticated:
    return <Dashboard onBack={() => setShowDashboard(false)} />

  return <WelcomeScreen />

export default function Home():
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CoinProvider>
            <HomeContent />
          </CoinProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
```

---

## Dashboard handleQuizComplete

```
const handleQuizComplete = (category: string, score: number, totalQuestions: number) => {
  addCoins(10)          // Q4=A: optimistic + background API
  setShowFireworks(true)

  // Fire-and-forget quiz history
  fetch('/api/quiz/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, score, totalQuestions, coinsEarned: 10 })
  }).catch(() => {})
}
```

---

## StickerShop — catalog fetch + async buy

```
On mount:
  fetch('/api/stickers')
    .then(r => r.json())
    .then(({ data }) => { setCatalog(data ?? []); setCatalogLoading(false) })
    .catch(() => setCatalogLoading(false))

const currentStickers = catalog.filter(s => s.category === activeTab)

const handleBuy = async (sticker: StickerRow) => {
  setPurchasingStickerId(sticker.id)
  const success = await buySticker(sticker)
  setPurchasingStickerId(null)
  if (success) {
    setPurchaseAnimation(sticker.id)
    setTimeout(() => setPurchaseAnimation(null), 1000)
  }
}

// Button state:
const isBuying = purchasingStickerId === sticker.id
const canAfford = coins >= sticker.price
const owned = hasSticker(sticker.id)
// disabled when: owned || isBuying || !canAfford
```

---

## CreativeRoom — canvas load + debounced save

```
On mount:
  fetch('/api/players/canvas')
    .then(r => r.json())
    .then(({ data }) => { if (data) setPlacedStickers(data) })
    .catch(() => {})

// Debounced save — useEffect on placedStickers
useEffect([placedStickers]):
  const timer = setTimeout(() => {
    fetch('/api/players/canvas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasData: placedStickers })
    }).catch(() => {})
  }, 300)
  return () => clearTimeout(timer)

// New sticker placed on canvas (Q2=A):
const newSticker: PlacedSticker = {
  id: `item-${Date.now()}`,
  emoji: sticker.emoji,     // from collection panel sticker item
  x,
  y,
  scale: 1,
  rotation: 0,
}
setPlacedStickers(prev => [...prev, newSticker])

// Render:
// OLD: const sticker = getStickerById(placed.stickerId); {sticker.emoji}
// NEW: {placed.emoji}
```

---

## LearningZone — quiz history fire-and-forget

```
const handleQuizCompleteInternal = (score: number, totalQuestions: number) => {
  const category = activeQuiz  // e.g. "shapes", "math", "timesTable"

  // Fire-and-forget quiz history
  fetch('/api/quiz/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, score, totalQuestions, coinsEarned: 10 })
  }).catch(() => {})

  setActiveQuiz(null)
  onQuizComplete(category, score, totalQuestions)
}
```

---

## QuizModal — onComplete signature

```typescript
// OLD:
interface QuizModalProps {
  onComplete: () => void
  // ...
}
// Called as: onComplete()

// NEW:
interface QuizModalProps {
  onComplete: (score: number, totalQuestions: number) => void
  // ...
}
// Called as: onComplete(score, questions.length)
// score is already tracked in QuizModal's local state
```
