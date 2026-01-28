import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Mock Supabase 서버 클라이언트 (환경 변수가 없을 때 사용)
 */
function createMockServerClient() {
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
 */
export function isMockMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !supabaseUrl || !supabaseAnonKey
}

