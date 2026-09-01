'use client'

import { useState } from 'react'
import { LoginView } from '@/components/login-view'
import { RegisterView } from '@/components/register-view'

type AuthView = 'login' | 'register'

// Auth gate — shown to unauthenticated users.
// Renders immediately (Q2=B: no loading spinner on mount).
// Default view: login (Q3=A).
export function WelcomeScreen() {
  const [view, setView] = useState<AuthView>('login')

  return (
    <div
      className="flex flex-col items-center gap-8 animate-scale-pop w-full"
      data-testid="welcome-screen"
    >
      {view === 'login' ? (
        <LoginView onNavigateToRegister={() => setView('register')} />
      ) : (
        <RegisterView onNavigateToLogin={() => setView('login')} />
      )}
    </div>
  )
}
