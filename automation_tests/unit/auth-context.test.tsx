import { describe, test, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor, act, cleanup } from "@testing-library/react"
import type { ReactNode } from "react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

const okSession = (player: unknown) =>
  Promise.resolve({ ok: true, json: async () => ({ data: player }) } as unknown as Response)
const noSession = () =>
  Promise.resolve({ ok: true, json: async () => ({ data: null }) } as unknown as Response)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("AuthProvider — MH-8 regressions", () => {
  test("TC-U-MH8-1 | isSessionLoading is true before session check resolves", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isSessionLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  test("TC-U-MH8-2 | isSessionLoading becomes false and player is set after successful session check", async () => {
    const player = { id: "u1", name: "Alice", email: "alice@example.com" }
    vi.stubGlobal("fetch", vi.fn(() => okSession(player)))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isSessionLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.player).toEqual(player)
  })

  test("TC-U-MH8-3 | isSessionLoading becomes false when session returns null (unauthenticated)", async () => {
    vi.stubGlobal("fetch", vi.fn(() => noSession()))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isSessionLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.player).toBeNull()
  })

  test("TC-U-MH8-4 | isSessionLoading becomes false even when session check throws (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))))
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isSessionLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
  })

  test("TC-U-MH8-5 | pageshow with persisted=true resets isLoading to false (bfcache restore)", async () => {
    let resolveSignIn!: (v: Response) => void
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if ((url as string).includes("session")) return noSession()
      return new Promise<Response>(resolve => { resolveSignIn = resolve })
    }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isSessionLoading).toBe(false))

    act(() => { result.current.signIn("test@example.com", "password") })
    expect(result.current.isLoading).toBe(true)

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }))
    })
    expect(result.current.isLoading).toBe(false)

    resolveSignIn(noSession())
  })

  test("TC-U-MH8-6 | pageshow without persisted does not affect isLoading", async () => {
    let resolveSignIn!: (v: Response) => void
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if ((url as string).includes("session")) return noSession()
      return new Promise<Response>(resolve => { resolveSignIn = resolve })
    }))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isSessionLoading).toBe(false))

    act(() => { result.current.signIn("test@example.com", "password") })
    expect(result.current.isLoading).toBe(true)

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }))
    })
    expect(result.current.isLoading).toBe(true)

    resolveSignIn(noSession())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})
