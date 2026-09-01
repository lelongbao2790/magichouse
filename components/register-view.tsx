'use client'

import { useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface RegisterViewProps {
  onNavigateToLogin(): void
}

export function RegisterView({ onNavigateToLogin }: RegisterViewProps) {
  const { signUp, isLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length === 0) {
      setError("Please enter your child's name")
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    const result = await signUp(email, password, name.trim())
    if (result.error) setError(result.error)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm" data-testid="register-form">
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground">Create account</h2>
        <p className="text-muted-foreground mt-1">Start your child&apos;s learning journey</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="register-name" className="text-sm font-semibold text-foreground">
            Child&apos;s name
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={50}
            autoComplete="off"
            placeholder="e.g. Emma"
            className="px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            data-testid="register-name-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="register-email" className="text-sm font-semibold text-foreground">
            Parent&apos;s email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="parent@example.com"
            className="px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            data-testid="register-email-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="register-password" className="text-sm font-semibold text-foreground">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            data-testid="register-password-input"
          />
          <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium text-center" data-testid="register-error-message">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-8 py-3 bg-gradient-to-r from-primary to-highlight text-primary-foreground font-bold text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform disabled:opacity-60 disabled:scale-100"
          data-testid="register-submit-button"
        >
          {isLoading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          onClick={onNavigateToLogin}
          className="text-primary font-semibold hover:underline"
          data-testid="register-navigate-login"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}
