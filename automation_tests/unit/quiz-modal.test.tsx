import { describe, test, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import type { ReactNode } from "react"
import { LanguageProvider } from "@/contexts/language-context"
import { QuizModal } from "@/components/quiz-modal"

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

const baseProps = {
  isOpen: true,
  onClose: () => {},
  onComplete: () => {},
  title: "Quiz",
  icon: <span />,
}

const oneQuestion = [
  { question: "Từ nào là từ chỉ màu sắc?", options: ["Chạy", "Đỏ", "Bàn"], correctIndex: 1, difficulty: "medium" as const },
]

afterEach(cleanup)

describe("QuizModal — U2 states", () => {
  test("TC-U113 | isLoading shows the loading panel, not a question", () => {
    render(<Wrap><QuizModal {...baseProps} questions={[]} isLoading /></Wrap>)
    expect(screen.getByTestId("quiz-loading")).toBeTruthy()
    expect(screen.queryByTestId("quiz-question")).toBeNull()
  })

  test("TC-U114 | loadError shows the error panel + retry button; retry fires onRetry", () => {
    const onRetry = vi.fn()
    render(<Wrap><QuizModal {...baseProps} questions={[]} loadError onRetry={onRetry} /></Wrap>)
    expect(screen.getByTestId("quiz-error")).toBeTruthy()
    fireEvent.click(screen.getByTestId("quiz-retry-button"))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId("quiz-question")).toBeNull()
  })

  test("TC-U115 | emptyError shows the empty panel with no retry button", () => {
    render(<Wrap><QuizModal {...baseProps} questions={[]} emptyError /></Wrap>)
    expect(screen.getByTestId("quiz-empty")).toBeTruthy()
    expect(screen.queryByTestId("quiz-retry-button")).toBeNull()
  })

  test("TC-U116 | with questions, renders the question screen", () => {
    render(<Wrap><QuizModal {...baseProps} questions={oneQuestion} /></Wrap>)
    expect(screen.getByTestId("quiz-question").textContent).toContain("màu sắc")
    expect(screen.queryByTestId("quiz-loading")).toBeNull()
  })

  test("TC-U117 | closed modal renders nothing", () => {
    const { container } = render(
      <Wrap><QuizModal {...baseProps} isOpen={false} questions={oneQuestion} /></Wrap>,
    )
    expect(container.querySelector('[data-testid="quiz-modal"]')).toBeNull()
  })
})
