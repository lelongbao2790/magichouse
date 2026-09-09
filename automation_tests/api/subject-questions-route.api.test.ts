import { describe, test, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// GET /api/subjects/[key]/questions — route contract (no live server)
// ---------------------------------------------------------------------------

const getUser = vi.fn()
const getSubjectContent = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))
vi.mock("@/lib/services/subject-content", () => ({
  getSubjectContent: (...args: unknown[]) => getSubjectContent(...args),
}))

import { GET } from "@/app/api/subjects/[key]/questions/route"

const params = (key: string) => ({ params: Promise.resolve({ key }) })
const req = (url = "http://localhost/api/subjects/grade2Vietnamese/questions") =>
  new Request(url)

const authed = () => getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })

const sampleDto = {
  key: "grade2Vietnamese",
  title: "Quiz Tiếng Việt Lớp 2",
  questionsPerSession: 10,
  questions: [
    { id: "q1", question: "Từ nào là từ chỉ màu sắc?", options: ["Chạy", "Đỏ", "Bàn"], correctIndex: 1, difficulty: "medium" },
  ],
}

beforeEach(() => {
  getUser.mockReset()
  getSubjectContent.mockReset()
})

describe("GET /api/subjects/[key]/questions", () => {
  test("TC-A025 | unauthenticated -> 401", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(req(), params("grade2Vietnamese"))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toMatch(/not authenticated/i)
  })

  test("TC-A026 | unknown subject key -> 404", async () => {
    authed()
    getSubjectContent.mockResolvedValue(null)
    const res = await GET(req("http://localhost/api/subjects/nope/questions"), params("nope"))
    expect(res.status).toBe(404)
    expect((await res.json()).data).toBeNull()
  })

  test("TC-A027 | authenticated + known subject -> 200 with the documented shape", async () => {
    authed()
    getSubjectContent.mockResolvedValue(sampleDto)
    const res = await GET(req(), params("grade2Vietnamese"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.error).toBeNull()
    expect(body.data.title).toBe("Quiz Tiếng Việt Lớp 2")
    expect(Array.isArray(body.data.questions)).toBe(true)
    for (const q of body.data.questions) {
      expect(Object.keys(q).sort()).toEqual(
        ["correctIndex", "difficulty", "id", "options", "question"].sort(),
      )
      expect(q.options).toHaveLength(3)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThanOrEqual(2)
    }
  })

  test("TC-A027b | locale param is forwarded to the service (default vi)", async () => {
    authed()
    getSubjectContent.mockResolvedValue(sampleDto)
    await GET(req("http://localhost/api/subjects/shapes/questions?locale=en"), params("shapes"))
    expect(getSubjectContent).toHaveBeenCalledWith(expect.anything(), "shapes", "en")
    await GET(req("http://localhost/api/subjects/shapes/questions"), params("shapes"))
    expect(getSubjectContent).toHaveBeenLastCalledWith(expect.anything(), "shapes", "vi")
  })

  test("TC-A027c | invalid locale -> 400", async () => {
    authed()
    const res = await GET(
      req("http://localhost/api/subjects/shapes/questions?locale=fr"),
      params("shapes"),
    )
    expect(res.status).toBe(400)
  })

  test("TC-A027d | service throws -> 500", async () => {
    authed()
    getSubjectContent.mockRejectedValue(new Error("boom"))
    const res = await GET(req(), params("grade2Vietnamese"))
    expect(res.status).toBe(500)
  })
})
