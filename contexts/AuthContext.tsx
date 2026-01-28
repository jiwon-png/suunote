'use client'

import { createContext, useContext, ReactNode } from 'react'
import { User } from '@/types/global'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (provider: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Phase 1: Mock implementation
  // Phase 2: Will be replaced with Supabase Auth

  const value: AuthContextType = {
    user: null,
    isLoading: false,
    signIn: async () => {},
    signOut: async () => {},
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
