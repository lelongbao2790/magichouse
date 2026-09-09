'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import type { SubjectContentDto } from '@/lib/subject-content/types'

type LoadPhase = 'idle' | 'loading' | 'ready' | 'error' | 'empty'
type LoadError = 'load' | 'empty' | null

interface UseSubjectQuestions {
  data: SubjectContentDto | null
  phase: LoadPhase
  isLoading: boolean
  error: LoadError
  retry: () => void
}

// Module-level cache, keyed `${key}:${locale}`. Survives modal open/close; cleared on
// full page reload. A `fixed` subject fetched under both locales caches twice (Q3=A).
const cache = new Map<string, SubjectContentDto>()

export function useSubjectQuestions(key: string | null): UseSubjectQuestions {
  const { language } = useLanguage()
  const [phase, setPhase] = useState<LoadPhase>('idle')
  const [data, setData] = useState<SubjectContentDto | null>(null)
  const [error, setError] = useState<LoadError>(null)
  const [retryTick, setRetryTick] = useState(0)

  // Guards against a stale response landing after the args changed.
  const requestId = useRef(0)

  useEffect(() => {
    if (key === null) {
      setPhase('idle')
      setData(null)
      setError(null)
      return
    }

    const cacheKey = `${key}:${language}`
    const cached = cache.get(cacheKey)
    if (cached) {
      setData(cached)
      setError(null)
      setPhase('ready')
      return
    }

    const id = ++requestId.current
    setPhase('loading')
    setData(null)
    setError(null)

    ;(async () => {
      try {
        const res = await fetch(
          `/api/subjects/${encodeURIComponent(key)}/questions?locale=${language}`,
        )
        if (id !== requestId.current) return // superseded

        if (!res.ok) {
          setPhase('error')
          setError('load')
          return
        }

        const body = (await res.json()) as { data: SubjectContentDto | null }
        if (id !== requestId.current) return

        const dto = body.data
        if (!dto || dto.questions.length === 0) {
          setPhase('empty')
          setError('empty')
          return
        }

        cache.set(cacheKey, dto)
        setData(dto)
        setError(null)
        setPhase('ready')
      } catch {
        if (id !== requestId.current) return
        setPhase('error')
        setError('load')
      }
    })()
  }, [key, language, retryTick])

  const retry = useCallback(() => {
    if (error !== 'load' || key === null) return
    cache.delete(`${key}:${language}`)
    setRetryTick((t) => t + 1)
  }, [error, key, language])

  return { data, phase, isLoading: phase === 'loading', error, retry }
}

/** Test-only: reset the module cache between cases. */
export function __clearSubjectQuestionsCache() {
  cache.clear()
}
