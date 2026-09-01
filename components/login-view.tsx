'use client'

import { useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface LoginViewProps {
  onNavigateToRegister(): void
}

export function LoginView({ onNavigateToRegister }: LoginViewProps) {
  const { signIn, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await signIn(email, password)
    if (result.error) setError(result.error)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm" data-testid="login-form">
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground">Welcome back!</h2>
        <p className="text-muted-foreground mt-1">Sign in to continue learning</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-sm font-semibold text-foreground">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="parent@example.com"
            className="px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            data-testid="login-email-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="text-sm font-semibold text-foreground">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            data-testid="login-password-input"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium text-center" data-testid="login-error-message">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-8 py-3 bg-gradient-to-r from-primary to-highlight text-primary-foreground font-bold text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform disabled:opacity-60 disabled:scale-100"
          data-testid="login-submit-button"
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <button
          onClick={onNavigateToRegister}
          className="text-primary font-semibold hover:underline"
          data-testid="login-navigate-register"
        >
          Create an account
        </button>
      </p>
    </div>
  )
}
