import { describe, test } from "vitest"
import * as fc from "fast-check"
import { purchaseHouseItem, InsufficientFundsError } from "@/lib/services/house-items"
import { getLayout, saveLayout } from "@/lib/services/house-layout"
import type { PlacedHouseItem } from "@/lib/database.types"
import { computeRepositionPosition, MIN_PERCENT, MAX_PERCENT } from "@/components/my-house/layout-math"
import { houseItemArb, placedItemArb } from "./_arbitraries"

// ---------------------------------------------------------------------------
// My House (house-schema-and-service) — U1's share of the PBT suite (blocking,
// per Q12=A): PBT-D (purchase affordability invariant) and PBT-G (idempotent
// ownership). PBT-E (placement drag-clamp, U2) and PBT-F (layout round-trip,
// U2) are appended below by my-house-ui's Code Generation step.
// ---------------------------------------------------------------------------

const PBT_OPTS = { verbose: true, numRuns: 200 } as const

type Row = Record<string, unknown>

/**
 * A minimal in-memory fake of purchaseHouseItem's one dependency: the
 * `purchase_house_item` RPC (supabase/migrations/0004_house_items_schema.sql).
 * The real function runs atomically inside one Postgres transaction (`FOR UPDATE`
 * locks the player row for its duration) — this fake models that same atomicity by
 * doing the ownership check, affordability guard, and ownership insert synchronously
 * within one `rpc()` call, matching the pattern in
 * automation_tests/unit/house-items.test.ts.
 */
function fakeSupabase(startingCoins: number) {
  const players: { id: string; coins: number }[] = [{ id: "u1", coins: startingCoins }]
  const player_house_items: Row[] = []

  const rpc = async (fn: string, args: Record<string, unknown>) => {
    if (fn !== "purchase_house_item") throw new Error(`unexpected rpc: ${fn}`)
    const { p_player_id, p_item_id, p_price } = args as {
      p_player_id: string
      p_item_id: string
      p_price: number
    }
    const player = players.find((p) => p.id === p_player_id)
    if (!player) return { data: null, error: { message: `player not found: ${p_player_id}` } }

    const owned = player_house_items.some(
      (r) => r.player_id === p_player_id && r.item_id === p_item_id,
    )
    if (owned) {
      return { data: [{ new_coin_balance: player.coins, newly_purchased: false }], error: null }
    }
    if (player.coins < p_price) {
      return { data: null, error: { message: "insufficient_funds" } }
    }
    player.coins -= p_price
    player_house_items.push({
      player_id: p_player_id,
      item_id: p_item_id,
      purchased_at: new Date().toISOString(),
    })
    return { data: [{ new_coin_balance: player.coins, newly_purchased: true }], error: null }
  }

  return { supabase: { rpc }, players, player_house_items }
}

// ── PBT-D: purchase affordability invariant (PBT-03, NFR-3, AC-4) ───────────

describe("purchaseHouseItem — PBT-D (purchase affordability invariant)", () => {
  test("[PBT] balance never negative; every attempt fully succeeds or fully fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        fc.array(houseItemArb, { minLength: 1, maxLength: 15 }),
        async (startingBalance, attempts) => {
          const { supabase, players } = fakeSupabase(startingBalance)
          const player = players[0] as { id: string; coins: number }

          for (const item of attempts) {
            const before = player.coins
            try {
              const result = await purchaseHouseItem(supabase as any, "u1", item.id, item.price)
              // Fully succeeds: balance decreases by exactly the price, never negative.
              if (result.newCoinBalance !== before - item.price) return false
              if (player.coins < 0) return false
            } catch (err) {
              if (!(err instanceof InsufficientFundsError)) throw err
              // Fully fails: balance unchanged, never negative.
              if (player.coins !== before) return false
            }
            if (player.coins < 0) return false
          }
          return true
        },
      ),
      PBT_OPTS,
    )
  })
})

// ── PBT-G: idempotent ownership (PBT-04, BR-8, AC-4) ─────────────────────────

describe("purchaseHouseItem — PBT-G (idempotent ownership)", () => {
  test("[PBT] buy(buy(x)) = buy(x): repeated purchase calls yield identical observable state", async () => {
    await fc.assert(
      fc.asyncProperty(
        houseItemArb,
        fc.integer({ min: 0, max: 500 }), // extra coins beyond the item's price
        fc.integer({ min: 1, max: 6 }), // total number of purchase calls (>= 1)
        async (item, extraCoins, callCount) => {
          const startingBalance = item.price + extraCoins // guarantee the first call succeeds
          const { supabase, player_house_items } = fakeSupabase(startingBalance)

          const first = await purchaseHouseItem(supabase as any, "u1", item.id, item.price)
          const balanceAfterFirst = first.newCoinBalance
          const ownedAfterFirst = player_house_items.some((row) => row.item_id === item.id)

          for (let i = 1; i < callCount; i++) {
            const repeat = await purchaseHouseItem(supabase as any, "u1", item.id, item.price)
            if (repeat.newCoinBalance !== balanceAfterFirst) return false
            const ownedNow = player_house_items.some((row) => row.item_id === item.id)
            if (ownedNow !== ownedAfterFirst) return false
          }
          // No duplicate ownership row regardless of how many times it was bought.
          const ownershipRows = player_house_items.filter((row) => row.item_id === item.id)
          return ownedAfterFirst === true && ownershipRows.length === 1
        },
      ),
      PBT_OPTS,
    )
  })
})

// ── PBT-E: placement position bounds (PBT-03, U2's share) ───────────────────
// The client-side clamp math lives in components/my-house/layout-math.ts —
// computeRepositionPosition, used by BedroomCanvas's placed-item drag handler.

describe("computeRepositionPosition — PBT-E (placement position bounds)", () => {
  test("[PBT] any starting placed-item position and any drag delta lands within [5, 95]", () => {
    fc.assert(
      fc.property(
        placedItemArb,
        fc.float({ min: -100_000, max: 100_000, noNaN: true }),
        fc.float({ min: -100_000, max: 100_000, noNaN: true }),
        (placed, offsetX, offsetY) => {
          const canvasRect = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }
          const { x, y } = computeRepositionPosition(placed.x, placed.y, offsetX, offsetY, canvasRect)
          return x >= MIN_PERCENT && x <= MAX_PERCENT && y >= MIN_PERCENT && y <= MAX_PERCENT
        },
      ),
      PBT_OPTS,
    )
  })
})

// ── PBT-F: layout round-trip (PBT-02, U2's share) ────────────────────────────
// Exercises the real house-layout service (lib/services/house-layout.ts), not the
// client — saving then loading via getLayout/saveLayout must preserve the array
// exactly (f_inv(f(x)) = x).

/**
 * Minimal in-memory fake of the fragment of the Supabase query builder
 * getLayout/saveLayout depend on:
 *   .from('player_house_items').select('item_id').eq('player_id', userId)  -> thenable rows
 *   .from('house_layout').select('layout_data').eq(...).eq(...).single()   -> { data, error }
 *   .from('house_layout').upsert(payload, { onConflict })                  -> thenable rows
 * Mirrors the pattern in automation_tests/unit/house-items.test.ts's fakeSupabase,
 * scoped down to just what these two functions call.
 */
function fakeLayoutSupabase(store: { player_house_items: Row[]; house_layout: Row[] }) {
  return {
    from(table: "player_house_items" | "house_layout") {
      const rows = store[table]
      let filtered: Row[] = [...rows]
      let mode: "select" | "upsert" = "select"
      let upsertPayload: Row | null = null
      let upsertOptions: { onConflict?: string } | null = null

      const builder = {
        select() {
          return builder
        },
        eq(col: string, val: unknown) {
          filtered = filtered.filter((r) => r[col] === val)
          return builder
        },
        upsert(payload: Row, options: { onConflict?: string }) {
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
        then(resolve: (v: { data: unknown; error: unknown }) => void) {
          if (mode === "upsert" && upsertPayload) {
            const keys = upsertOptions?.onConflict?.split(",") ?? []
            const idx = rows.findIndex((r) => keys.every((k) => r[k] === (upsertPayload as Row)[k]))
            if (idx === -1) rows.push({ ...upsertPayload })
            else Object.assign(rows[idx], upsertPayload)
            resolve({ data: [upsertPayload], error: null })
            return
          }
          resolve({ data: filtered, error: null })
        },
      }
      return builder
    },
  }
}

describe("getLayout/saveLayout — PBT-F (layout round-trip)", () => {
  test("[PBT] saving then loading a layoutData array preserves it exactly", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(placedItemArb, { maxLength: 20 }), async (layoutData) => {
        const store = {
          player_house_items: layoutData.map((item) => ({
            player_id: "u1",
            item_id: item.itemId,
            purchased_at: "2026-01-01",
          })),
          house_layout: [] as Row[],
        }
        const sb = fakeLayoutSupabase(store)

        await saveLayout(sb as any, "u1", "bedroom", layoutData as PlacedHouseItem[])
        const loaded = await getLayout(sb as any, "u1", "bedroom")

        return JSON.stringify(loaded) === JSON.stringify(layoutData)
      }),
      PBT_OPTS,
    )
  })
})
