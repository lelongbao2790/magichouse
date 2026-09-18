import { describe, test, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react"
import type { ReactNode } from "react"
import type { Player } from "@/lib/services/player"

vi.mock("@/components/dashboard", () => ({
  Dashboard: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="dashboard">
      <button data-testid="back-button" onClick={onBack}>Back</button>
    </div>
  ),
}))
vi.mock("@/components/welcome-screen", () => ({
  WelcomeScreen: () => <div data-testid="welcome-screen" />,
}))
vi.mock("@/components/floating-elements", () => ({ FloatingElements: () => null }))
vi.mock("@/components/theme-switcher", () => ({ ThemeSwitcher: () => null }))
vi.mock("@/components/language-switcher", () => ({ LanguageSwitcher: () => null }))
vi.mock("lucide-react", () => ({ Code2: () => null, Sparkles: () => null }))
vi.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (k: string) => k, language: "en" }),
  LanguageProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock("@/contexts/coin-context", () => ({
  CoinProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock("@/contexts/theme-context", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import { useAuth } from "@/contexts/auth-context"
import { HomeContent } from "@/app/page"

const mockUseAuth = vi.mocked(useAuth)

function makePlayer(): Player {
  return { id: "1", name: "Alice", coins: 0, createdAt: new Date().toISOString() }
}

function makeAuthValue(player: Player | null, isSessionLoading = false) {
  return {
    player,
    isAuthenticated: player !== null,
    isSessionLoading,
    isLoading: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}

afterEach(cleanup)

describe("HomeContent — MH-9 regression: isSessionLoading guard", () => {
  test("TC-U-MH9-1 | renders nothing while session is loading", () => {
    mockUseAuth.mockReturnValue(makeAuthValue(null, true))
    const { container } = render(<HomeContent />)
    expect(container.firstChild).toBeNull()
  })

  test("TC-U-MH9-2 | renders welcome screen once session load completes (not loading, unauthenticated)", () => {
    mockUseAuth.mockReturnValue(makeAuthValue(null, false))
    render(<HomeContent />)
    expect(screen.getByTestId("welcome-screen")).toBeTruthy()
  })
})

describe("HomeContent — MH-8 authentication navigation", () => {
  test("shows welcome screen when not authenticated", () => {
    mockUseAuth.mockReturnValue(makeAuthValue(null))
    render(<HomeContent />)
    expect(screen.queryByTestId("dashboard")).toBeNull()
    expect(screen.getByTestId("welcome-screen")).toBeTruthy()
  })

  test("shows dashboard when already authenticated on mount", async () => {
    mockUseAuth.mockReturnValue(makeAuthValue(makePlayer()))
    await act(async () => { render(<HomeContent />) })
    expect(screen.getByTestId("dashboard")).toBeTruthy()
    expect(screen.queryByTestId("welcome-screen")).toBeNull()
  })

  test("MH-8 regression: re-signing-in after pressing Back navigates to dashboard", async () => {
    // Initial state: user is authenticated
    mockUseAuth.mockReturnValue(makeAuthValue(makePlayer()))
    const { rerender } = await act(async () => render(<HomeContent />))
    expect(screen.getByTestId("dashboard")).toBeTruthy()

    // User presses Back — login page appears while still authenticated
    fireEvent.click(screen.getByTestId("back-button"))
    expect(screen.queryByTestId("dashboard")).toBeNull()
    expect(screen.getByTestId("welcome-screen")).toBeTruthy()

    // User signs in again — signIn() calls setPlayer(newData), producing a NEW player object.
    // isAuthenticated stays true (no change), but player reference changes.
    // The fix: useEffect([player]) fires on the new reference and restores showDashboard=true.
    mockUseAuth.mockReturnValue(makeAuthValue(makePlayer()))
    await act(async () => { rerender(<HomeContent />) })

    expect(screen.getByTestId("dashboard")).toBeTruthy()
    expect(screen.queryByTestId("welcome-screen")).toBeNull()
  })
})
