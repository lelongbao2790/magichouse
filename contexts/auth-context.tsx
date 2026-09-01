'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Player } from '@/lib/services/player'

interface AuthContextType {
  player: Player | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp(email: string, password: string, name: string): Promise<{ error: string | null }>
  signIn(email: string, password: string): Promise<{ error: string | null }>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Background session check on mount (Q2=B: no loading spinner)
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(({ data }) => { if (data) setPlayer(data) })
      .catch(() => { /* session check failure is silent */ })
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error: string | null }> => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const { data, error } = await res.json()
      if (error) return { error }
      setPlayer(data)
      return { error: null }
    } catch {
      return { error: 'Network error. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const { data, error } = await res.json()
      if (error) return { error }
      setPlayer(data)
      return { error: null }
    } catch {
      return { error: 'Network error. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setPlayer(null)
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      player,
      isLoading,
      isAuthenticated: player !== null,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
