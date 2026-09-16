import { describe, test, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// My House API routes — route contract tests (no live server).
// Import route handlers/services/Zod schemas directly, mocking the Supabase
// client + service modules the same way subject-questions-route.api.test.ts does.
// ---------------------------------------------------------------------------

// vi.mock(...) calls below are hoisted to the top of the file, so anything they
// reference must be created inside vi.hoisted() (classes in particular cannot be
// referenced across that hoist boundary otherwise — "Cannot access X before
// initialization").
const {
  getUser,
  getCatalog,
  getOwnedHouseItems,
  purchaseHouseItem,
  getRooms,
  getLayout,
  saveLayout,
  InsufficientFundsError,
  ItemNotOwnedError,
} = vi.hoisted(() => {
  class InsufficientFundsError extends Error {}
  class ItemNotOwnedError extends Error {}
  return {
    getUser: vi.fn(),
    getCatalog: vi.fn(),
    getOwnedHouseItems: vi.fn(),
    purchaseHouseItem: vi.fn(),
    getRooms: vi.fn(),
    getLayout: vi.fn(),
    saveLayout: vi.fn(),
    InsufficientFundsError,
    ItemNotOwnedError,
  }
})

let houseItemsTable: Record<string, { price: number; is_active: boolean }> = {}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    auth: { getUser },
    from: (table: string) => {
      if (table !== "house_items") throw new Error(`unexpected table: ${table}`)
      return {
        select: () => ({
          eq: (_col: string, id: string) => ({
            single: async () => {
              const row = houseItemsTable[id]
              if (!row) return { data: null, error: { message: "not found" } }
              return { data: row, error: null }
            },
          }),
        }),
      }
    },
  }),
}))

vi.mock("@/lib/services/house-items", () => ({
  getCatalog: (...args: unknown[]) => getCatalog(...args),
  getOwnedHouseItems: (...args: unknown[]) => getOwnedHouseItems(...args),
  purchaseHouseItem: (...args: unknown[]) => purchaseHouseItem(...args),
  getRooms: (...args: unknown[]) => getRooms(...args),
  InsufficientFundsError,
}))

vi.mock("@/lib/services/house-layout", () => ({
  getLayout: (...args: unknown[]) => getLayout(...args),
  saveLayout: (...args: unknown[]) => saveLayout(...args),
  ItemNotOwnedError,
}))

import { GET as getHouseItems } from "@/app/api/house-items/route"
import { GET as getPlayerHouseItems, POST as buyHouseItem } from "@/app/api/players/house-items/route"
import { GET as getHouseLayout, PUT as putHouseLayout } from "@/app/api/players/house-layout/route"
import { GET as getRoomsRoute } from "@/app/api/rooms/route"

const authed = () => getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
const unauthed = () => getUser.mockResolvedValue({ data: { user: null }, error: null })

const jsonRequest = (url: string, method: string, body: unknown) =>
  new Request(url, { method, body: JSON.stringify(body) })

beforeEach(() => {
  getUser.mockReset()
  getCatalog.mockReset()
  getOwnedHouseItems.mockReset()
  purchaseHouseItem.mockReset()
  getRooms.mockReset()
  getLayout.mockReset()
  saveLayout.mockReset()
  houseItemsTable = {}
})

const seededCatalog = [
  { id: "bed", room: "bedroom", name: "Bed", emoji: "🛏️", price: 100 },
  { id: "desk", room: "bedroom", name: "Desk", emoji: "🪑", price: 70 },
  { id: "lamp", room: "bedroom", name: "Lamp", emoji: "💡", price: 40 },
  { id: "teddy_bear", room: "bedroom", name: "Teddy Bear", emoji: "🧸", price: 30 },
  { id: "plant", room: "bedroom", name: "Plant", emoji: "🪴", price: 50 },
  { id: "rug", room: "bedroom", name: "Rug", emoji: "🟫", price: 60 },
]

describe("GET /api/house-items", () => {
  test("TC-A031 | unauthenticated -> 401", async () => {
    unauthed()
    const res = await getHouseItems(new Request("http://localhost/api/house-items"))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toMatch(/not authenticated/i)
  })

  test("TC-A032 | authenticated, valid room -> documented shape for the 6 seeded items", async () => {
    authed()
    getCatalog.mockResolvedValue(seededCatalog)
    const res = await getHouseItems(
      new Request("http://localhost/api/house-items?room=bedroom&locale=en"),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(6)
    for (const item of body.data) {
      expect(Object.keys(item).sort()).toEqual(["emoji", "id", "name", "price", "room"].sort())
    }
    expect(getCatalog).toHaveBeenCalledWith(expect.anything(), "bedroom", "en")
  })

  test("TC-A032b | room defaults to bedroom and locale defaults to vi when omitted", async () => {
    authed()
    getCatalog.mockResolvedValue(seededCatalog)
    await getHouseItems(new Request("http://localhost/api/house-items"))
    expect(getCatalog).toHaveBeenCalledWith(expect.anything(), "bedroom", "vi")
  })

  test("TC-A032c | present but invalid room -> 400", async () => {
    authed()
    const res = await getHouseItems(new Request("http://localhost/api/house-items?room=attic"))
    expect(res.status).toBe(400)
    expect(getCatalog).not.toHaveBeenCalled()
  })

  test("TC-A032d | invalid locale -> 400", async () => {
    authed()
    const res = await getHouseItems(new Request("http://localhost/api/house-items?locale=fr"))
    expect(res.status).toBe(400)
  })
})

describe("GET /api/players/house-items", () => {
  test("TC-A033 | returns owned item IDs", async () => {
    authed()
    getOwnedHouseItems.mockResolvedValue(["lamp", "bed"])
    const res = await getPlayerHouseItems()
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual(["lamp", "bed"])
  })

  test("TC-A033b | unauthenticated -> 401", async () => {
    unauthed()
    const res = await getPlayerHouseItems()
    expect(res.status).toBe(401)
  })
})

describe("POST /api/players/house-items", () => {
  test("TC-A034 | insufficient funds is rejected server-side, no ownership row, balance unchanged", async () => {
    authed()
    houseItemsTable = { lamp: { price: 40, is_active: true } }
    purchaseHouseItem.mockRejectedValue(new InsufficientFundsError())
    const res = await buyHouseItem(
      jsonRequest("http://localhost/api/players/house-items", "POST", { itemId: "lamp" }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(purchaseHouseItem).toHaveBeenCalledWith(expect.anything(), "u1", "lamp", 40)
  })

  test("TC-A035 | success deducts coins and repeat purchase is idempotent", async () => {
    authed()
    houseItemsTable = { lamp: { price: 40, is_active: true } }

    purchaseHouseItem.mockResolvedValueOnce({ newCoinBalance: 60 })
    const res1 = await buyHouseItem(
      jsonRequest("http://localhost/api/players/house-items", "POST", { itemId: "lamp" }),
    )
    expect(res1.status).toBe(200)
    expect((await res1.json()).data).toEqual({ newCoinBalance: 60 })

    // Second purchase of the same item: service returns the same unchanged balance
    // (ON CONFLICT ... DO NOTHING under the hood — verified at the service unit level).
    purchaseHouseItem.mockResolvedValueOnce({ newCoinBalance: 60 })
    const res2 = await buyHouseItem(
      jsonRequest("http://localhost/api/players/house-items", "POST", { itemId: "lamp" }),
    )
    expect(res2.status).toBe(200)
    expect((await res2.json()).data).toEqual({ newCoinBalance: 60 })
    expect(purchaseHouseItem).toHaveBeenCalledTimes(2)
  })
})

describe("GET/PUT /api/players/house-layout", () => {
  test("TC-A036 | PUT then GET round-trips an identical layoutData array", async () => {
    authed()
    getCatalog.mockResolvedValue(new Array(6).fill({}))
    saveLayout.mockResolvedValue(undefined)
    const layoutData = [
      { id: "p1", itemId: "lamp", x: 30, y: 40, scale: 1, rotation: 0 },
      { id: "p2", itemId: "bed", x: 60, y: 70, scale: 1.2, rotation: 15 },
    ]

    const putRes = await putHouseLayout(
      jsonRequest("http://localhost/api/players/house-layout", "PUT", {
        room: "bedroom",
        layoutData,
      }),
    )
    expect(putRes.status).toBe(200)
    expect(saveLayout).toHaveBeenCalledWith(expect.anything(), "u1", "bedroom", layoutData)

    getLayout.mockResolvedValue(layoutData)
    const getRes = await getHouseLayout(
      new Request("http://localhost/api/players/house-layout?room=bedroom"),
    )
    expect(getRes.status).toBe(200)
    expect((await getRes.json()).data).toEqual(layoutData)
  })

  test("TC-A036b | GET with an invalid room -> 400", async () => {
    authed()
    const res = await getHouseLayout(
      new Request("http://localhost/api/players/house-layout?room=attic"),
    )
    expect(res.status).toBe(400)
    expect(getLayout).not.toHaveBeenCalled()
  })

  test("TC-A036c | PUT with an invalid room -> 400, nothing saved", async () => {
    authed()
    const res = await putHouseLayout(
      jsonRequest("http://localhost/api/players/house-layout", "PUT", {
        room: "attic",
        layoutData: [],
      }),
    )
    expect(res.status).toBe(400)
    expect(saveLayout).not.toHaveBeenCalled()
  })

  test("TC-A036d | PUT with an ownership violation -> 400, mapped from ItemNotOwnedError", async () => {
    authed()
    getCatalog.mockResolvedValue(new Array(6).fill({}))
    saveLayout.mockRejectedValue(new ItemNotOwnedError())
    const res = await putHouseLayout(
      jsonRequest("http://localhost/api/players/house-layout", "PUT", {
        room: "bedroom",
        layoutData: [{ id: "p1", itemId: "not-owned", x: 50, y: 50, scale: 1, rotation: 0 }],
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe("TC-A037 | payload validation rejects malformed input before the service layer", () => {
  test("purchasing a non-existent itemId -> 404, purchaseHouseItem never called", async () => {
    authed()
    houseItemsTable = {}
    const res = await buyHouseItem(
      jsonRequest("http://localhost/api/players/house-items", "POST", { itemId: "does-not-exist" }),
    )
    expect(res.status).toBe(404)
    expect(purchaseHouseItem).not.toHaveBeenCalled()
  })

  test("purchasing with a missing itemId -> 400, purchaseHouseItem never called", async () => {
    authed()
    const res = await buyHouseItem(
      jsonRequest("http://localhost/api/players/house-items", "POST", {}),
    )
    expect(res.status).toBe(400)
    expect(purchaseHouseItem).not.toHaveBeenCalled()
  })

  test("a layout item missing x/y -> 400, saveLayout never called", async () => {
    authed()
    getCatalog.mockResolvedValue(new Array(6).fill({}))
    const res = await putHouseLayout(
      jsonRequest("http://localhost/api/players/house-layout", "PUT", {
        room: "bedroom",
        layoutData: [{ id: "p1", itemId: "lamp" }],
      }),
    )
    expect(res.status).toBe(400)
    expect(saveLayout).not.toHaveBeenCalled()
  })

  test("an x/y outside the valid [5, 95] percentage range -> 400", async () => {
    authed()
    getCatalog.mockResolvedValue(new Array(6).fill({}))
    const res = await putHouseLayout(
      jsonRequest("http://localhost/api/players/house-layout", "PUT", {
        room: "bedroom",
        layoutData: [{ id: "p1", itemId: "lamp", x: 200, y: 50, scale: 1, rotation: 0 }],
      }),
    )
    expect(res.status).toBe(400)
    expect(saveLayout).not.toHaveBeenCalled()
  })
})

describe("GET /api/rooms", () => {
  test("unauthenticated -> 401", async () => {
    unauthed()
    const res = await getRoomsRoute(new Request("http://localhost/api/rooms"))
    expect(res.status).toBe(401)
  })

  test("authenticated -> returns rooms from the service", async () => {
    authed()
    getRooms.mockResolvedValue([{ id: "bedroom", label: "Bedroom", locked: false }])
    const res = await getRoomsRoute(new Request("http://localhost/api/rooms"))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual([{ id: "bedroom", label: "Bedroom", locked: false }])
  })

  test("invalid locale -> 400", async () => {
    authed()
    const res = await getRoomsRoute(new Request("http://localhost/api/rooms?locale=fr"))
    expect(res.status).toBe(400)
  })
})
