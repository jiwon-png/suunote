'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { User } from '@/types/global'
import {
  signOut as authSignOut,
  getCurrentUser,
  getProfile,
} from '@/domain/auth/services/authService'
import { createClient, isMockMode } from '@/lib/supabase/client'

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

  // 프로필 정보를 가져와서 User 객체로 변환
  const fetchUserProfile = async (userId: string) => {
    const { profile, error } = await getProfile(userId)
    if (profile && !error) {
      return {
        id: profile.id,
        email: profile.email ?? '',
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      } as User
    }
    return null
  }

  // 초기 인증 상태 확인 및 세션 변경 감지
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
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            } as User)
          } else {
            setUser(null)
          }
        }
        setIsLoading(false)
      } else {
        // 실제 모드: Supabase에서 사용자 정보 가져오기
        try {
          const supabase = createClient()
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser()

          if (authUser) {
            // 프로필 정보 가져오기
            const profileUser = await fetchUserProfile(authUser.id)
            setUser(profileUser)
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Auth check error:', error)
          setUser(null)
        } finally {
          setIsLoading(false)
        }

        // Supabase 세션 변경 감지 리스너 등록
        const supabase = createClient()
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // 로그인 시 프로필 자동 페칭
            const profileUser = await fetchUserProfile(session.user.id)
            setUser(profileUser)
          } else if (event === 'SIGNED_OUT') {
            // 로그아웃 시 사용자 상태 초기화
            setUser(null)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // 토큰 갱신 시 프로필도 갱신
            const profileUser = await fetchUserProfile(session.user.id)
            setUser(profileUser)
          }
        })

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
          subscription.unsubscribe()
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
