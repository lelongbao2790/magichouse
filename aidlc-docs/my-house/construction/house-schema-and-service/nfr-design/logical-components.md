# Logical Components — U1: house-schema-and-service

**Status**: Draft (NFR Design)
**Last updated**: 2026-09-14

---

## Components Present

| Component | Role | Notes |
|---|---|---|
| Supabase-managed Postgres | Persistent storage for `house_items`, `player_house_items`, `house_layout`, `rooms` | Existing infrastructure, no new provisioning |
| Vercel serverless functions | Hosts the 5 API routes | Existing infrastructure, no new provisioning |
| Client-side module-level cache (in `useHouseItems`/`useRooms`, U2) | Avoids redundant `fetch` calls within a session | Not a server-side/infrastructure cache — plain in-memory JS module state, already decided in Application Design |

## Components Explicitly Not Present (with justification)

- **Message queue**: No asynchronous processing anywhere in this feature — every operation
  (purchase, layout save) is a synchronous request/response, matching every existing feature in
  the codebase.
- **Server-side cache (Redis/Memcached/CDN edge cache for API responses)**: Payloads are small
  enough (≤10 catalog rows, 4 rooms, one layout array) that no server-side cache is justified;
  matches NFR-2's "no pagination needed" framing.
- **Circuit breaker**: Not present anywhere in the codebase (RESILIENCY-10, accepted gap) — not
  introduced by this unit either.
- **Rate limiter**: No existing route in this codebase has one; not introduced here (matches
  the app's overall low-traffic, authenticated-only, child-facing usage profile).
- **API gateway / load balancer**: Vercel-managed edge routing already handles this; no new
  network component.
