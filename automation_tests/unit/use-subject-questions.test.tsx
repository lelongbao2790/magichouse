import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act, cleanup } from "@testing-library/react"
import type { ReactNode } from "react"
import { LanguageProvider } from "@/contexts/language-context"
import {
  useSubjectQuestions,
  __clearSubjectQuestionsCache,
} from "@/lib/hooks/use-subject-questions"
import type { SubjectContentDto } from "@/lib/subject-content/types"

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

const dto = (questions = 3): SubjectContentDto => ({
  key: "grade2Vietnamese",
  title: "Quiz Tiếng Việt Lớp 2",
  questionsPerSession: 10,
  questions: Array.from({ length: questions }, (_, i) => ({
    id: `q${i}`,
    question: `câu ${i}`,
    options: ["a", "b", "c"],
    correctIndex: 0,
    difficulty: "medium" as const,
  })),
})

function mockFetchOnce(impl: () => Promise<Response> | Response) {
  const fn = vi.fn(impl as never)
  vi.stubGlobal("fetch", fn)
  return fn
}

const okJson = (body: unknown) =>
  ({ ok: true, json: async () => body }) as unknown as Response
const httpError = (status: number) =>
  ({ ok: false, status, json: async () => ({ data: null, error: "x" }) }) as unknown as Response

beforeEach(() => {
  __clearSubjectQuestionsCache()
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("useSubjectQuestions", () => {
  test("TC-U105 | key null -> idle, no fetch", () => {
    const fetchFn = mockFetchOnce(() => okJson({ data: dto() }))
    const { result } = renderHook(() => useSubjectQuestions(null), { wrapper })
    expect(result.current.phase).toBe("idle")
    expect(fetchFn).not.toHaveBeenCalled()
  })

  test("TC-U106 | loading -> ready with data", async () => {
    mockFetchOnce(() => okJson({ data: dto(3) }))
    const { result } = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    await waitFor(() => expect(result.current.phase).toBe("ready"))
    expect(result.current.data?.questions).toHaveLength(3)
    expect(result.current.error).toBeNull()
  })

  test("TC-U107 | second mount for same key+locale is served from cache (no 2nd fetch)", async () => {
    const fetchFn = mockFetchOnce(() => okJson({ data: dto(3) }))
    const first = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    await waitFor(() => expect(first.result.current.phase).toBe("ready"))
    expect(fetchFn).toHaveBeenCalledTimes(1)

    const second = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    expect(second.result.current.phase).toBe("ready")
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  test("TC-U108 | HTTP 404 -> error 'load'", async () => {
    mockFetchOnce(() => httpError(404))
    const { result } = renderHook(() => useSubjectQuestions("nope"), { wrapper })
    await waitFor(() => expect(result.current.phase).toBe("error"))
    expect(result.current.error).toBe("load")
  })

  test("TC-U109 | HTTP 500 -> error 'load'", async () => {
    mockFetchOnce(() => httpError(500))
    const { result } = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    await waitFor(() => expect(result.current.phase).toBe("error"))
    expect(result.current.error).toBe("load")
  })

  test("TC-U110 | ok but zero questions -> error 'empty'", async () => {
    mockFetchOnce(() => okJson({ data: dto(0) }))
    const { result } = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    await waitFor(() => expect(result.current.phase).toBe("empty"))
    expect(result.current.error).toBe("empty")
  })

  test("TC-U111 | retry() after a load error clears cache and refetches", async () => {
    let call = 0
    const fetchFn = vi.fn(() => (++call === 1 ? httpError(500) : okJson({ data: dto(3) })))
    vi.stubGlobal("fetch", fetchFn)

    const { result } = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    await waitFor(() => expect(result.current.error).toBe("load"))

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.phase).toBe("ready"))
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  test("TC-U112 | network throw -> error 'load'", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))))
    const { result } = renderHook(() => useSubjectQuestions("grade2Vietnamese"), { wrapper })
    await waitFor(() => expect(result.current.error).toBe("load"))
  })
})
