'use client'

import { useEffect, useState } from 'react'
import type { Language } from '@/data/translations'
import type { RoomTab } from '@/lib/services/house-items'

interface UseRooms {
  rooms: RoomTab[]
  loading: boolean
  error: string | null
}

// Module-level cache keyed by locale (component-methods.md) — the room list changes
// even less often than the item catalog, so one cache entry per locale is enough.
const cache = new Map<Language, RoomTab[]>()

export function useRooms(locale: Language): UseRooms {
  const [rooms, setRooms] = useState<RoomTab[]>(() => cache.get(locale) ?? [])
  const [loading, setLoading] = useState<boolean>(() => !cache.has(locale))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = cache.get(locale)
    if (cached) {
      setRooms(cached)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/rooms?locale=${encodeURIComponent(locale)}`)
      .then((res) => res.json())
      .then(({ data, error: apiError }: { data: RoomTab[] | null; error: string | null }) => {
        if (cancelled) return
        // BR-1: a room-list failure renders with no room tabs, no hardcoded fallback —
        // a deliberate degraded screen, matching the existing silent-fallback convention.
        if (apiError || !data) {
          setError(apiError ?? 'Failed to load rooms')
          setRooms([])
          setLoading(false)
          return
        }
        cache.set(locale, data)
        setRooms(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Failed to load rooms')
        setRooms([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locale])

  return { rooms, loading, error }
}

/** Test-only: reset the module cache between cases. */
export function __clearRoomsCache(): void {
  cache.clear()
}
