'use client'

import { useEffect, useState } from 'react'
import type { Language } from '@/data/translations'
import type { HouseItemCatalogEntry } from '@/lib/services/house-items'

interface UseHouseItems {
  catalog: HouseItemCatalogEntry[]
  loading: boolean
  error: string | null
}

// Module-level cache, keyed `${room}:${locale}` (Application Design Q4=B) — survives
// remounts of ItemCatalog/MyHouse within a session; a language switch busts the cache
// key and refetches. Cleared on a full page reload.
const cache = new Map<string, HouseItemCatalogEntry[]>()

export function useHouseItems(room: string, locale: Language): UseHouseItems {
  const cacheKey = `${room}:${locale}`
  const [catalog, setCatalog] = useState<HouseItemCatalogEntry[]>(() => cache.get(cacheKey) ?? [])
  const [loading, setLoading] = useState<boolean>(() => !cache.has(cacheKey))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = `${room}:${locale}`
    const cached = cache.get(key)
    if (cached) {
      setCatalog(cached)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/house-items?room=${encodeURIComponent(room)}&locale=${encodeURIComponent(locale)}`)
      .then((res) => res.json())
      .then(({ data, error: apiError }: { data: HouseItemCatalogEntry[] | null; error: string | null }) => {
        if (cancelled) return
        // Catalog load failures fail silently to an empty catalog (Q2a=A, unchanged) —
        // no visible error UI, matching the existing Creative Room/Sticker Shop precedent.
        if (apiError || !data) {
          setError(apiError ?? 'Failed to load catalog')
          setCatalog([])
          setLoading(false)
          return
        }
        cache.set(key, data)
        setCatalog(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Failed to load catalog')
        setCatalog([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [room, locale])

  return { catalog, loading, error }
}

/** Test-only: reset the module cache between cases. */
export function __clearHouseItemsCache(): void {
  cache.clear()
}
