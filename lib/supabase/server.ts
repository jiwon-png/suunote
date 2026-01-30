import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Mock Supabase 서버 클라이언트 (환경 변수가 없을 때 사용)
 * Production에서는 사용되지 않아야 하지만, 안전성을 위해 완전한 인터페이스 제공
 */
function createMockServerClient() {
  // Mock from 메서드: 빈 쿼리 빌더 반환
  const createMockFrom = (table: string) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      or: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    upsert: () => ({
      onConflict: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  })

  return {
    auth: {
      getUser: async () => {
        // Mock 모드: 항상 비로그인 상태로 반환 (서버에서는 localStorage 접근 불가)
        // 실제 인증 체크는 클라이언트에서 처리
        return { data: { user: null }, error: null }
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

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Mock 모드: 환경 변수가 없으면 Mock 클라이언트 반환
  if (!supabaseUrl || !supabaseAnonKey) {
    return createMockServerClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: {
            name: string
            value: string
            options?: CookieOptions
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Components에서 호출될 수 있으므로
            // set 실패는 무시
          }
        },
      },
    }
  )
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

