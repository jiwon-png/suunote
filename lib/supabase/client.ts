import { createBrowserClient } from '@supabase/ssr'

/**
 * Mock Supabase 클라이언트 (환경 변수가 없을 때 사용)
 */
function createMockClient() {
  return {
    auth: {
      getUser: async () => {
        // Mock 모드: localStorage에서 mock session 확인
        if (typeof window !== 'undefined') {
          const mockSession = localStorage.getItem('mock_auth_session')
          if (mockSession === 'authenticated') {
            return {
              data: {
                user: {
                  id: 'mock-user-id',
                  email: 'mock@example.com',
                  user_metadata: { full_name: 'Mock User' },
                },
              },
              error: null,
            }
          }
        }
        return { data: { user: null }, error: null }
      },
      signInWithOAuth: async () => {
        // Mock 모드에서는 실제 OAuth를 호출하지 않음
        return { data: null, error: null }
      },
      signOut: async () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mock_auth_session')
        }
        return { error: null }
      },
      exchangeCodeForSession: async () => {
        return { data: null, error: null }
      },
    },
  } as any
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Mock 모드: 환경 변수가 없으면 Mock 클라이언트 반환
  if (!supabaseUrl || !supabaseAnonKey) {
    return createMockClient()
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Mock 모드인지 확인하는 헬퍼 함수
 */
export function isMockMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !supabaseUrl || !supabaseAnonKey
}
