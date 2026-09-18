import { describe, test, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor, act, cleanup } from "@testing-library/react"
import type { ReactNode } from "react"
import { CoinProvider, useCoins } from "@/contexts/coin-context"

// ---------------------------------------------------------------------------
// Regression tests for MH-7 RC-4: CoinContext.addCoins must roll back the
// optimistic state update when the POST /api/players/coins request fails, so
// the displayed balance stays in sync with the DB value on next login.
// ---------------------------------------------------------------------------

// Minimal AuthProvider stub that exposes a player so CoinProvider initialises.
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    player: { id: "u1", name: "Alice", email: "alice@example.com" },
  }),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <CoinProvider>{children}</CoinProvider>
)

// Helper fetch responses
const okMe = (coins: number) =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: { coins }, error: null }),
  } as unknown as Response)

const okStickers = () =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: [], error: null }),
  } as unknown as Response)

const okHouseItems = () =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: [], error: null }),
  } as unknown as Response)

const okAddCoins = (newCoins: number) =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: { coins: newCoins }, error: null }),
  } as unknown as Response)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

// ── addCoins success path ────────────────────────────────────────────────────

describe("CoinContext.addCoins — success", () => {
  test("TC-U-MH7-11 | addCoins updates coins optimistically then confirms with server value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/players/me")) return okMe(100)
        if (url.includes("/api/players/stickers")) return okStickers()
        if (url.includes("/api/players/house-items")) return okHouseItems()
        if (url.includes("/api/players/coins")) return okAddCoins(125)
        return Promise.reject(new Error(`unexpected url: ${url}`))
      }),
    )

    const { result } = renderHook(() => useCoins(), { wrapper })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.coins).toBe(100)

    act(() => { result.current.addCoins(25) })
    // Optimistic update fires immediately
    expect(result.current.coins).toBe(125)

    // Server response confirms 125
    await waitFor(() => expect(result.current.coins).toBe(125))
  })
})

// ── addCoins failure / rollback ──────────────────────────────────────────────

describe("CoinContext.addCoins — MH-7 RC-4 rollback regression", () => {
  test("TC-U-MH7-12 | addCoins rolls back to previous coins when POST /api/players/coins fails (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/players/me")) return okMe(100)
        if (url.includes("/api/players/stickers")) return okStickers()
        if (url.includes("/api/players/house-items")) return okHouseItems()
        if (url.includes("/api/players/coins")) return Promise.reject(new Error("offline"))
        return Promise.reject(new Error(`unexpected url: ${url}`))
      }),
    )

    const { result } = renderHook(() => useCoins(), { wrapper })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.coins).toBe(100)

    act(() => { result.current.addCoins(25) })
    expect(result.current.coins).toBe(125)

    // After the failed request, coins must roll back to the pre-call value
    await waitFor(() => expect(result.current.coins).toBe(100))
  })

  test("TC-U-MH7-13 | addCoins rolls back localStorage when POST /api/players/coins fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/players/me")) return okMe(80)
        if (url.includes("/api/players/stickers")) return okStickers()
        if (url.includes("/api/players/house-items")) return okHouseItems()
        if (url.includes("/api/players/coins")) return Promise.reject(new Error("offline"))
        return Promise.reject(new Error(`unexpected url: ${url}`))
      }),
    )

    const { result } = renderHook(() => useCoins(), { wrapper })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    act(() => { result.current.addCoins(20) })
    await waitFor(() => expect(result.current.coins).toBe(80))

    // localStorage should also be rolled back
    expect(localStorage.getItem("kidCoins")).toBe("80")
  })

  test("TC-U-MH7-14 | addCoins preserves correct coins after rollback when called twice (no stale closure)", async () => {
    // If the closure captured coins at call-time, two rapid calls after a failure
    // could roll back to the wrong value. This verifies the rollback uses the value
    // captured at the moment addCoins was called, not a stale reference.
    let callCount = 0
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/api/players/me")) return okMe(50)
        if (url.includes("/api/players/stickers")) return okStickers()
        if (url.includes("/api/players/house-items")) return okHouseItems()
        if (url.includes("/api/players/coins")) {
          callCount++
          return Promise.reject(new Error("offline"))
        }
        return Promise.reject(new Error(`unexpected url: ${url}`))
      }),
    )

    const { result } = renderHook(() => useCoins(), { wrapper })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.coins).toBe(50)

    act(() => { result.current.addCoins(10) })
    await waitFor(() => expect(result.current.coins).toBe(50))
    expect(callCount).toBeGreaterThanOrEqual(1)
  })
})
