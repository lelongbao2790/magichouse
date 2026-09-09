import { describe, test, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { LanguageProvider } from "@/contexts/language-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { CoinProvider } from "@/contexts/coin-context"
import { LearningZone } from "@/components/learning-zone"
import { __clearSubjectQuestionsCache } from "@/lib/hooks/use-subject-questions"
import type { SubjectContentDto } from "@/lib/subject-content/types"

const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <CoinProvider>{children}</CoinProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
)

const zoneProps = {
  name: "Test",
  onBack: () => {},
  onQuizComplete: () => {},
  showFireworks: false,
  onFireworksComplete: () => {},
}

function contentDto(key: string): SubjectContentDto {
  return {
    key,
    title: `Title ${key}`,
    questionsPerSession: 10,
    questions: Array.from({ length: 12 }, (_, i) => ({
      id: `${key}-${i}`,
      question: `Question ${i} for ${key}`,
      options: ["a", "b", "c"],
      correctIndex: 0,
      difficulty: (["easy", "medium", "hard"] as const)[i % 3],
    })),
  }
}

let subjectResponse: () => Response

function routedFetch(url: string) {
  if (url.includes("/api/subjects/")) return Promise.resolve(subjectResponse())
  // CoinProvider startup calls — return benign shapes
  return Promise.resolve({ ok: true, json: async () => ({ data: null, error: null }) } as unknown as Response)
}

beforeEach(() => {
  __clearSubjectQuestionsCache()
  localStorage.clear()
  subjectResponse = () =>
    ({ ok: true, json: async () => ({ data: contentDto("shapes"), error: null }) }) as unknown as Response
  vi.stubGlobal("fetch", vi.fn((u: string) => routedFetch(String(u))))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("LearningZone — DB-backed content subjects", () => {
  test("TC-U118 | opening a preschool subject shows a loading state, then a question", async () => {
    render(<Providers><LearningZone {...zoneProps} /></Providers>)
    fireEvent.click(screen.getByTestId("quiz-shapes"))
    expect(screen.getByTestId("quiz-loading")).toBeTruthy()
    await waitFor(() => expect(screen.getByTestId("quiz-question")).toBeTruthy())
    expect(screen.getByTestId("quiz-question").textContent).toContain("for shapes")
  })

  test("TC-U119 | a content-subject fetch failure shows the retry UI, no question", async () => {
    subjectResponse = () =>
      ({ ok: false, status: 500, json: async () => ({ data: null, error: "x" }) }) as unknown as Response
    render(<Providers><LearningZone {...zoneProps} /></Providers>)
    fireEvent.click(screen.getByTestId("quiz-shapes"))
    await waitFor(() => expect(screen.getByTestId("quiz-error")).toBeTruthy())
    expect(screen.queryByTestId("quiz-question")).toBeNull()
    expect(screen.getByTestId("quiz-retry-button")).toBeTruthy()
  })

  test("TC-U120 | a math practice opens with no loading state (generated in-code)", async () => {
    render(<Providers><LearningZone {...zoneProps} /></Providers>)
    fireEvent.click(screen.getByTestId("tab-grade1"))
    fireEvent.click(screen.getByTestId("quiz-math"))
    expect(screen.getByTestId("quiz-question")).toBeTruthy()
    expect(screen.queryByTestId("quiz-loading")).toBeNull()
  })

  test("TC-U121 | switching UI language while a fixed-subject quiz is open does not change the question", async () => {
    subjectResponse = () =>
      ({ ok: true, json: async () => ({ data: contentDto("grade2Vietnamese"), error: null }) }) as unknown as Response
    render(<Providers><LearningZone {...zoneProps} /></Providers>)
    // Grade 2 tab -> Vietnamese subject
    fireEvent.click(screen.getByTestId("tab-grade2"))
    fireEvent.click(screen.getByTestId("grade2-subject-vietnamese"))
    await waitFor(() => expect(screen.getByTestId("quiz-question")).toBeTruthy())
    const before = screen.getByTestId("quiz-question").textContent

    fireEvent.click(screen.getByTestId("lang-en"))
    await Promise.resolve()
    expect(screen.getByTestId("quiz-question").textContent).toBe(before)
  })
})
