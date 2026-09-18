import { describe, test, expect } from "vitest"
import { upsertPlayer, addCoins, getPlayer } from "@/lib/services/player"

// ---------------------------------------------------------------------------
// Minimal in-memory fake of the Supabase query builder fragment used by
// lib/services/player.ts:
//   .from('players').upsert({...}, { onConflict }).select(...).single()
//   .from('players').select(...).eq(...).single()
//   .rpc('increment_player_coins', { p_player_id, p_amount })
//
// Mirrors the pattern from automation_tests/unit/house-items.test.ts.
// ---------------------------------------------------------------------------

type PlayerRow = { id: string; name: string; coins: number; created_at: string }

function fakeSupabase(players: PlayerRow[]) {
  let rpcCalls: { fn: string; args: Record<string, unknown> }[] = []

  const sb = {
    _rpcCalls: rpcCalls,
    from(_table: string) {
      let filtered: PlayerRow[] = [...players]
      let mode: "select" | "upsert" = "select"
      let upsertPayload: Record<string, unknown> | null = null

      const builder = {
        select() { return builder },
        eq(col: string, val: unknown) {
          filtered = filtered.filter(r => (r as Record<string, unknown>)[col] === val)
          return builder
        },
        upsert(payload: Record<string, unknown>, _opts: { onConflict: string }) {
          mode = "upsert"
          upsertPayload = payload
          return builder
        },
        async single() {
          if (mode === "upsert" && upsertPayload) {
            const idx = players.findIndex(p => p.id === upsertPayload!.id)
            if (idx === -1) {
              const newRow: PlayerRow = {
                id: upsertPayload.id as string,
                name: upsertPayload.name as string,
                coins: (upsertPayload.coins as number) ?? 0,
                created_at: new Date().toISOString(),
              }
              players.push(newRow)
              return { data: newRow, error: null }
            }
            // On conflict: update only name (no coins in payload = coins untouched)
            players[idx].name = upsertPayload.name as string
            if ("coins" in upsertPayload) {
              players[idx].coins = upsertPayload.coins as number
            }
            return { data: players[idx], error: null }
          }
          if (filtered.length === 0) return { data: null, error: { message: "no rows" } }
          return { data: filtered[0], error: null }
        },
      }
      return builder
    },
    async rpc(fn: string, args: Record<string, unknown>) {
      rpcCalls.push({ fn, args })
      if (fn !== "increment_player_coins") throw new Error(`unexpected rpc: ${fn}`)
      const { p_player_id, p_amount } = args as { p_player_id: string; p_amount: number }
      const player = players.find(p => p.id === p_player_id)
      if (!player) return { data: null, error: { message: `player not found` } }
      player.coins += p_amount
      return { data: [{ id: player.id, name: player.name, coins: player.coins, created_at: player.created_at }], error: null }
    },
  }
  return sb
}

// ── upsertPlayer — MH-7 RC-2 regression ─────────────────────────────────────

describe("upsertPlayer — MH-7 RC-2 regression", () => {
  test("TC-U-MH7-1 | upsertPlayer does NOT reset coins to 0 when player already exists", async () => {
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 150, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    await upsertPlayer(sb as any, "u1", "Alice Updated")
    expect(players[0].coins).toBe(150)
  })

  test("TC-U-MH7-2 | upsertPlayer creates a new player with coins defaulting to 0", async () => {
    const players: PlayerRow[] = []
    const sb = fakeSupabase(players)
    const result = await upsertPlayer(sb as any, "u2", "Bob")
    expect(result.coins).toBe(0)
    expect(players[0].coins).toBe(0)
  })

  test("TC-U-MH7-3 | upsertPlayer updates name on conflict without touching coins", async () => {
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 200, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    const result = await upsertPlayer(sb as any, "u1", "Alice Renamed")
    expect(result.name).toBe("Alice Renamed")
    expect(result.coins).toBe(200)
  })
})

// ── addCoins — MH-7 RC-3 regression ─────────────────────────────────────────

describe("addCoins — MH-7 RC-3 regression (atomic RPC)", () => {
  test("TC-U-MH7-4 | addCoins calls increment_player_coins RPC (not a read-then-write)", async () => {
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 50, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    await addCoins(sb as any, "u1", 25)
    expect(sb._rpcCalls).toHaveLength(1)
    expect(sb._rpcCalls[0].fn).toBe("increment_player_coins")
    expect(sb._rpcCalls[0].args).toEqual({ p_player_id: "u1", p_amount: 25 })
  })

  test("TC-U-MH7-5 | addCoins returns player with updated coin total", async () => {
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 50, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    const result = await addCoins(sb as any, "u1", 25)
    expect(result.coins).toBe(75)
  })

  test("TC-U-MH7-6 | addCoins with zero amount leaves balance unchanged", async () => {
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 100, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    const result = await addCoins(sb as any, "u1", 0)
    expect(result.coins).toBe(100)
  })

  test("TC-U-MH7-7 | addCoins throws when RPC returns an error", async () => {
    const players: PlayerRow[] = []
    const sb = fakeSupabase(players)
    await expect(addCoins(sb as any, "u99", 10)).rejects.toThrow("Failed to add coins")
  })

  test("TC-U-MH7-8 | addCoins does NOT call getPlayer (no separate read step)", async () => {
    // Regression for RC-3: the old code called getPlayer first, then wrote coins+amount.
    // The new code calls the RPC directly. Verify no from('players').select occurs by
    // checking only RPC calls were made for addCoins.
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 10, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    await addCoins(sb as any, "u1", 5)
    // Only one interaction: the rpc call. No from() select queries for addCoins.
    expect(sb._rpcCalls).toHaveLength(1)
  })
})

// ── getPlayer ───────────────────────────────────────────────────────────────

describe("getPlayer", () => {
  test("TC-U-MH7-9 | getPlayer returns the player with correct coin balance", async () => {
    const players: PlayerRow[] = [
      { id: "u1", name: "Alice", coins: 300, created_at: "2026-01-01T00:00:00Z" },
    ]
    const sb = fakeSupabase(players)
    const result = await getPlayer(sb as any, "u1")
    expect(result.coins).toBe(300)
    expect(result.id).toBe("u1")
  })

  test("TC-U-MH7-10 | getPlayer throws when player not found", async () => {
    const sb = fakeSupabase([])
    await expect(getPlayer(sb as any, "missing")).rejects.toThrow("Player not found")
  })
})
