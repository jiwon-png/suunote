'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { User } from '@/types/global'
import { signOut as authSignOut, getCurrentUser } from '@/domain/auth/services/authService'
import { isMockMode } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (provider: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock 모드: localStorage에서 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (isMockMode()) {
        if (typeof window !== 'undefined') {
          const mockSession = localStorage.getItem('mock_auth_session')
          if (mockSession === 'authenticated') {
            // Mock 사용자 설정
            setUser({
              id: 'mock-user-id',
              email: 'mock@example.com',
              fullName: 'Mock User',
            } as User)
          } else {
            setUser(null)
          }
        }
        setIsLoading(false)
      } else {
        // 실제 모드: Supabase에서 사용자 정보 가져오기
        try {
          const { user: currentUser } = await getCurrentUser()
          setUser(currentUser as User | null)
        } catch (error) {
          setUser(null)
        } finally {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
  }, [])

  const signIn = async (provider: string) => {
    // 로그인은 authService의 signInWithGoogle을 직접 호출
    // 여기서는 상태 업데이트만 처리
  }

  const signOut = async () => {
    await authSignOut()
    setUser(null)
    // localStorage에서 mock session 제거 (authService에서 처리되지만 확실히)
    if (isMockMode() && typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_session')
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
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
