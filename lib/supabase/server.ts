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

  // 오프라인 개발 모드: Supabase 접속 불가 시 Mock 사용 (fetch 에러 방지)
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_OFFLINE_DEV === 'true') {
    return createMockServerClient()
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[createClient] Production에서 Supabase 환경 변수가 없습니다. ' +
          'Vercel Dashboard → Environment Variables 에서 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정한 뒤 재배포하세요.'
      )
    }
    return createMockServerClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const all = cookieStore.getAll()
          // base64url에 '.' 포함 시 파싱 에러 발생 → 해당 쿠키 제외 (재로그인 유도)
          return all.filter((c) => {
            if (!c.name.startsWith('sb-')) return true
            if (!c.value.startsWith('base64-')) return true
            const afterPrefix = c.value.slice(7)
            if (afterPrefix.includes('.')) return false // JWT 형식 등 잘못된 값
            return true
          })
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
 * Mock/오프라인 모드인지 확인하는 헬퍼 함수
 *
 * - Production: 항상 false
 * - Development: NEXT_PUBLIC_MOCK_MODE=true 또는 NEXT_PUBLIC_OFFLINE_DEV=true 일 때 true
 *   - OFFLINE_DEV: Supabase 접속 불가 시 로컬 개발용 (Mock 사용)
 */
export function isMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  if (process.env.NEXT_PUBLIC_OFFLINE_DEV === 'true') return true
  const mockModeEnabled = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
  const hasEnvVars = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return mockModeEnabled && !hasEnvVars
}

