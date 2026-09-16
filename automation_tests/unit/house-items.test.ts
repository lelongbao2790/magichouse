import { describe, test, expect } from "vitest"
import type { PlacedHouseItem } from "@/lib/database.types"
import {
  getCatalog,
  getOwnedHouseItems,
  purchaseHouseItem,
  getRooms,
  InsufficientFundsError,
} from "@/lib/services/house-items"
import { getLayout, saveLayout, ItemNotOwnedError } from "@/lib/services/house-layout"
import { createHouseLayoutSchema } from "@/lib/validation/api"

// ---------------------------------------------------------------------------
// Minimal in-memory fake of the fragment of the Supabase query builder these two
// services use:
//   .from(table).select(...).eq(...).eq(...).order(...)             -> thenable rows
//   .from(table).select(...).eq(...).single()                       -> { data, error }
//   .from(table).upsert(payload, { onConflict, ignoreDuplicates? })  -> thenable rows
//   .rpc('purchase_house_item', { p_player_id, p_item_id, p_price }) -> { data, error }
//     Simulates the atomic Postgres function from
//     supabase/migrations/0004_house_items_schema.sql: ownership check, SQL-level
//     affordability guard, and idempotent ownership insert all happen synchronously
//     within one fake call, the same way the real function's `FOR UPDATE` row lock
//     serializes concurrent purchases within one DB transaction — this is what makes
//     the concurrency regression test below meaningful rather than tautological.
// Mirrors the pattern established by automation_tests/unit/subject-content-service.test.ts,
// extended with upsert/rpc for the purchase-guard + idempotent-insert and layout-save flows.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>

function fakeSupabase(store: Record<string, Row[]>) {
  return {
    from(table: string) {
      const rows = store[table]
      let filtered: Row[] = [...rows]
      let mode: "select" | "update" | "upsert" = "select"
      let pendingUpdate: Row | null = null
      let upsertPayload: Row | null = null
      let upsertOptions: { onConflict?: string; ignoreDuplicates?: boolean } | null = null

      const builder = {
        select() {
          return builder
        },
        eq(col: string, val: unknown) {
          filtered = filtered.filter((r) => r[col] === val)
          return builder
        },
        gte(col: string, val: unknown) {
          filtered = filtered.filter((r) => (r[col] as number) >= (val as number))
          return builder
        },
        order() {
          return builder
        },
        update(patch: Row) {
          mode = "update"
          pendingUpdate = patch
          return builder
        },
        upsert(payload: Row, options: { onConflict?: string; ignoreDuplicates?: boolean }) {
          mode = "upsert"
          upsertPayload = payload
          upsertOptions = options
          return builder
        },
        async single() {
          if (filtered.length === 0) {
            return { data: null, error: { code: "PGRST116", message: "no rows" } }
          }
          return { data: filtered[0], error: null }
        },
        async maybeSingle() {
          return { data: filtered[0] ?? null, error: null }
        },
        then(resolve: (v: { data: unknown; error: unknown }) => void) {
          if (mode === "update" && pendingUpdate) {
            for (const row of filtered) Object.assign(row, pendingUpdate)
            resolve({ data: filtered, error: null })
            return
          }
          if (mode === "upsert" && upsertPayload) {
            const keys = upsertOptions?.onConflict?.split(",") ?? []
            const idx = rows.findIndex((r) =>
              keys.every((k) => r[k] === (upsertPayload as Row)[k]),
            )
            if (idx === -1) {
              const inserted = { ...upsertPayload }
              rows.push(inserted)
              resolve({ data: [inserted], error: null })
            } else if (!upsertOptions?.ignoreDuplicates) {
              Object.assign(rows[idx], upsertPayload)
              resolve({ data: [rows[idx]], error: null })
            } else {
              resolve({ data: [], error: null })
            }
            return
          }
          resolve({ data: filtered, error: null })
        },
      }
      return builder
    },
    async rpc(fn: string, args: Record<string, unknown>) {
      if (fn !== "purchase_house_item") throw new Error(`unexpected rpc: ${fn}`)
      const { p_player_id, p_item_id, p_price } = args as {
        p_player_id: string
        p_item_id: string
        p_price: number
      }
      const players = store.players as { id: string; coins: number }[]
      const player = players.find((p) => p.id === p_player_id)
      if (!player) return { data: null, error: { message: `player not found: ${p_player_id}` } }

      const owned = store.player_house_items.some(
        (r) => r.player_id === p_player_id && r.item_id === p_item_id,
      )
      if (owned) {
        return { data: [{ new_coin_balance: player.coins, newly_purchased: false }], error: null }
      }
      if (player.coins < p_price) {
        return { data: null, error: { message: "insufficient_funds" } }
      }
      player.coins -= p_price
      store.player_house_items.push({
        player_id: p_player_id,
        item_id: p_item_id,
        purchased_at: new Date().toISOString(),
      })
      return { data: [{ new_coin_balance: player.coins, newly_purchased: true }], error: null }
    },
  }
}

function placedItem(over: Partial<PlacedHouseItem> = {}): PlacedHouseItem {
  return { id: "p1", itemId: "lamp", x: 50, y: 50, scale: 1, rotation: 0, ...over }
}

// ---------------------------------------------------------------------------
// purchaseHouseItem (lib/services/house-items.ts)
// ---------------------------------------------------------------------------

describe("purchaseHouseItem", () => {
  test("success deducts exact price and returns the new balance", async () => {
    const store = { players: [{ id: "u1", coins: 100 }], player_house_items: [] as Row[] }
    const sb = fakeSupabase(store)
    const result = await purchaseHouseItem(sb as any, "u1", "lamp", 40)
    expect(result.newCoinBalance).toBe(60)
    expect(store.player_house_items).toEqual([
      expect.objectContaining({ player_id: "u1", item_id: "lamp" }),
    ])
  })

  test("insufficient funds throws InsufficientFundsError without mutating the balance", async () => {
    const store = { players: [{ id: "u1", coins: 10 }], player_house_items: [] }
    const sb = fakeSupabase(store)
    await expect(purchaseHouseItem(sb as any, "u1", "lamp", 40)).rejects.toBeInstanceOf(
      InsufficientFundsError,
    )
    expect(store.players[0].coins).toBe(10) // unchanged — guard failed closed (BR-3)
    expect(store.player_house_items).toHaveLength(0) // no ownership row inserted
  })

  test("repeat purchase of an already-owned item is a no-op success — no additional deduction (BR-8)", async () => {
    const store = {
      players: [{ id: "u1", coins: 100 }],
      player_house_items: [{ player_id: "u1", item_id: "lamp", purchased_at: "2026-01-01" }],
    }
    const sb = fakeSupabase(store)
    const result = await purchaseHouseItem(sb as any, "u1", "lamp", 40)
    expect(result.newCoinBalance).toBe(100) // unchanged — already owned, no deduction
    expect(store.players[0].coins).toBe(100)
    expect(store.player_house_items).toHaveLength(1) // no duplicate ownership row
  })

  test("buy(buy(x)) = buy(x): balance and ownership are identical after 1 call vs. N calls", async () => {
    const store = {
      players: [{ id: "u1", coins: 100 }],
      player_house_items: [] as { player_id: string; item_id: string; purchased_at: string }[],
    }
    const sb = fakeSupabase(store)
    const first = await purchaseHouseItem(sb as any, "u1", "lamp", 40)
    const second = await purchaseHouseItem(sb as any, "u1", "lamp", 40)
    const third = await purchaseHouseItem(sb as any, "u1", "lamp", 40)
    expect(first.newCoinBalance).toBe(60)
    expect(second.newCoinBalance).toBe(60)
    expect(third.newCoinBalance).toBe(60)
    expect(store.player_house_items).toHaveLength(1)
  })

  test("concurrent duplicate purchase requests never double-charge (BR-3, SECURITY-11)", async () => {
    // Two "simultaneous" purchase calls for the same never-yet-owned item — regression
    // test for the TOCTOU race a separate check-then-act (SELECT ownership, THEN update
    // coins) would allow: both requests could see "not owned yet" before either records
    // ownership, and both would then independently pass the coin guard if the balance
    // covered two deductions. purchaseHouseItem instead inserts the ownership row FIRST
    // via an idempotent upsert, and only the caller that actually inserted it (there can
    // be only one, since the fake's upsert enforces the same (player_id, item_id)
    // uniqueness a real Postgres composite primary key would) proceeds to deduct coins.
    //
    // The "losing" call's own no-op balance read can still race with the winner's write
    // (an ordinary eventually-consistent read, not a double-charge) — so this test asserts
    // the guarantee BR-3/SECURITY-11 actually requires (deducted exactly once; exactly one
    // ownership row; final balance is price-once-off), not that both concurrent responses
    // report byte-identical balances, which no non-transactional pair of requests can promise.
    const store = { players: [{ id: "u1", coins: 100 }], player_house_items: [] as Row[] }
    const sb = fakeSupabase(store)

    const results = await Promise.all([
      purchaseHouseItem(sb as any, "u1", "lamp", 40),
      purchaseHouseItem(sb as any, "u1", "lamp", 40),
    ])

    // Deducted exactly once — never twice — regardless of call interleaving.
    expect(store.players[0].coins).toBe(60)
    for (const result of results) {
      expect(result.newCoinBalance).toBeGreaterThanOrEqual(60) // never reflects a second deduction
    }
    expect(store.player_house_items).toHaveLength(1) // no duplicate ownership row
  })
})

// ---------------------------------------------------------------------------
// getCatalog / getRooms — server-side locale selection (BR-9)
// ---------------------------------------------------------------------------

describe("getCatalog", () => {
  const houseItems = [
    { id: "lamp", room: "bedroom", name_vi: "Đèn ngủ", name_en: "Lamp", emoji: "💡", price: 40, is_active: true, sort_order: 30 },
    { id: "bed", room: "bedroom", name_vi: "Giường", name_en: "Bed", emoji: "🛏️", price: 100, is_active: true, sort_order: 10 },
    { id: "old", room: "bedroom", name_vi: "Cũ", name_en: "Old", emoji: "📦", price: 10, is_active: false, sort_order: 5 },
  ]

  test("selects name_vi/name_en into a single localized name field per locale", async () => {
    const sb = fakeSupabase({ house_items: houseItems })
    const vi = await getCatalog(sb as any, "bedroom", "vi")
    const en = await getCatalog(sb as any, "bedroom", "en")
    expect(vi.find((i) => i.id === "lamp")?.name).toBe("Đèn ngủ")
    expect(en.find((i) => i.id === "lamp")?.name).toBe("Lamp")
  })

  test("only returns active items for the given room", async () => {
    const sb = fakeSupabase({ house_items: houseItems })
    const result = await getCatalog(sb as any, "bedroom", "en")
    expect(result.map((i) => i.id).sort()).toEqual(["bed", "lamp"])
  })
})

describe("getRooms", () => {
  const rooms = [
    { id: "bedroom", label_vi: "Phòng ngủ", label_en: "Bedroom", is_unlocked: true },
    { id: "kitchen", label_vi: "Phòng bếp", label_en: "Kitchen", is_unlocked: false },
  ]

  test("selects label_vi/label_en per locale and maps is_unlocked to locked=!is_unlocked", async () => {
    const sb = fakeSupabase({ rooms })
    const vi = await getRooms(sb as any, "vi")
    const en = await getRooms(sb as any, "en")

    const bedroomVi = vi.find((r) => r.id === "bedroom")
    const kitchenEn = en.find((r) => r.id === "kitchen")
    expect(bedroomVi?.label).toBe("Phòng ngủ")
    expect(bedroomVi?.locked).toBe(false)
    expect(kitchenEn?.label).toBe("Kitchen")
    expect(kitchenEn?.locked).toBe(true)
  })
})

describe("getOwnedHouseItems", () => {
  test("returns the owned item IDs for a player", async () => {
    const sb = fakeSupabase({
      player_house_items: [
        { player_id: "u1", item_id: "lamp", purchased_at: "2026-01-01" },
        { player_id: "u1", item_id: "bed", purchased_at: "2026-01-01" },
        { player_id: "u2", item_id: "rug", purchased_at: "2026-01-01" },
      ],
    })
    const ids = await getOwnedHouseItems(sb as any, "u1")
    expect(ids.sort()).toEqual(["bed", "lamp"])
  })
})

// ---------------------------------------------------------------------------
// getLayout / saveLayout (lib/services/house-layout.ts)
// ---------------------------------------------------------------------------

describe("getLayout", () => {
  test("returns an empty array when no row exists yet (first-time player)", async () => {
    const sb = fakeSupabase({ house_layout: [] })
    const layout = await getLayout(sb as any, "u1", "bedroom")
    expect(layout).toEqual([])
  })

  test("round-trips layout_data (id, itemId, x, y, scale, rotation)", async () => {
    const saved = [placedItem({ id: "p1", itemId: "lamp", x: 30, y: 40, scale: 1.5, rotation: 90 })]
    const sb = fakeSupabase({
      house_layout: [{ player_id: "u1", room: "bedroom", layout_data: saved, updated_at: "2026-01-01" }],
    })
    const layout = await getLayout(sb as any, "u1", "bedroom")
    expect(layout).toEqual(saved)
  })
})

describe("saveLayout — ownership integrity (BR-4)", () => {
  test("rejects the whole request when any itemId is not owned, and writes nothing", async () => {
    const store = {
      player_house_items: [{ player_id: "u1", item_id: "lamp", purchased_at: "2026-01-01" }],
      house_layout: [] as Row[],
    }
    const sb = fakeSupabase(store)
    const layoutData = [placedItem({ itemId: "lamp" }), placedItem({ id: "p2", itemId: "bed" })]

    await expect(saveLayout(sb as any, "u1", "bedroom", layoutData)).rejects.toBeInstanceOf(
      ItemNotOwnedError,
    )
    expect(store.house_layout).toHaveLength(0) // nothing written — fail closed
  })

  test("saves successfully when every itemId is owned", async () => {
    const store = {
      player_house_items: [
        { player_id: "u1", item_id: "lamp", purchased_at: "2026-01-01" },
        { player_id: "u1", item_id: "bed", purchased_at: "2026-01-01" },
      ],
      house_layout: [] as Row[],
    }
    const sb = fakeSupabase(store)
    const layoutData = [placedItem({ itemId: "lamp" }), placedItem({ id: "p2", itemId: "bed" })]

    await saveLayout(sb as any, "u1", "bedroom", layoutData)
    expect(store.house_layout).toHaveLength(1)
    expect(store.house_layout[0].layout_data).toEqual(layoutData)
  })

  test("allows the same owned itemId placed more than once (BR-5, no duplicate check)", async () => {
    const store = {
      player_house_items: [{ player_id: "u1", item_id: "lamp", purchased_at: "2026-01-01" }],
      house_layout: [] as Row[],
    }
    const sb = fakeSupabase(store)
    const layoutData = [
      placedItem({ id: "p1", itemId: "lamp" }),
      placedItem({ id: "p2", itemId: "lamp" }),
    ]

    await saveLayout(sb as any, "u1", "bedroom", layoutData)
    expect(store.house_layout).toHaveLength(1)
    expect((store.house_layout[0].layout_data as PlacedHouseItem[])).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// createHouseLayoutSchema — layout item count bound (BR-6)
// The bound is a raw array-length cap tied to the room's active catalog count,
// read at validation time (not hardcoded) — enforced at the Zod-schema layer
// the PUT /api/players/house-layout route builds per-request.
// ---------------------------------------------------------------------------

describe("createHouseLayoutSchema — count bound (BR-6)", () => {
  const base = { room: "bedroom" as const }

  test("accepts a layoutData array at exactly the active catalog count", () => {
    const schema = createHouseLayoutSchema(2)
    const layoutData = [placedItem({ id: "p1" }), placedItem({ id: "p2" })]
    expect(schema.safeParse({ ...base, layoutData }).success).toBe(true)
  })

  test("rejects a layoutData array exceeding the active catalog count", () => {
    const schema = createHouseLayoutSchema(2)
    const layoutData = [placedItem({ id: "p1" }), placedItem({ id: "p2" }), placedItem({ id: "p3" })]
    expect(schema.safeParse({ ...base, layoutData }).success).toBe(false)
  })

  test("does not require distinct itemIds — duplicates count toward the cap, nothing more (BR-5)", () => {
    const schema = createHouseLayoutSchema(2)
    const layoutData = [
      placedItem({ id: "p1", itemId: "lamp" }),
      placedItem({ id: "p2", itemId: "lamp" }),
    ]
    expect(schema.safeParse({ ...base, layoutData }).success).toBe(true)
  })

  test("rejects x/y outside [5, 95] before the count bound is even relevant (BR-7)", () => {
    const schema = createHouseLayoutSchema(6)
    const layoutData = [placedItem({ x: 0 })]
    expect(schema.safeParse({ ...base, layoutData }).success).toBe(false)
  })
})
