import { createBrowserClient } from '@supabase/ssr'

/**
 * Mock Supabase 클라이언트 (환경 변수가 없을 때 사용)
 * Production에서는 사용되지 않아야 하지만, 안전성을 위해 완전한 인터페이스 제공
 */
function createMockClient() {
  // Mock from 메서드: 빈 쿼리 빌더 반환
  const createMockFrom = (table: string) => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }), order: () => ({ data: [], error: null }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    upsert: () => ({ onConflict: () => Promise.resolve({ data: null, error: null }) }),
  })

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
    from: createMockFrom,
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
  } as any
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Mock 모드: 환경 변수가 없으면 Mock 클라이언트 반환
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[createClient] ⚠️ Supabase 환경 변수가 설정되지 않았습니다:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    })
    const mockClient = createMockClient()
    // Mock 클라이언트임을 표시하는 플래그 추가
    ;(mockClient as any)._isMock = true
    return mockClient
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  // 실제 클라이언트임을 표시하는 플래그 추가
  ;(client as any)._isMock = false
  return client
}

/**
 * Mock 모드인지 확인하는 헬퍼 함수
 * 
 * Production에서는 절대 Mock 모드가 활성화되지 않습니다.
 * Development에서만 NEXT_PUBLIC_MOCK_MODE=true일 때 Mock 모드가 활성화됩니다.
 */
export function isMockMode(): boolean {
  // Production에서는 항상 false 반환 (Mock 모드 비활성화)
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  // Development에서도 NEXT_PUBLIC_MOCK_MODE가 명시적으로 'true'일 때만 Mock 모드 활성화
  const mockModeEnabled = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
  
  // 환경 변수가 없고 Mock 모드가 명시적으로 활성화된 경우에만 true 반환
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasEnvVars = supabaseUrl && supabaseAnonKey
  
  // Mock 모드가 명시적으로 활성화되었고 환경 변수가 없을 때만 true
  return mockModeEnabled && !hasEnvVars
}
