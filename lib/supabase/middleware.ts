import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge-compatible Supabase middleware
 * Updates session and handles authentication redirects
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 환경 변수 확인 (non-null assertion: Production에서는 필수)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Production에서는 절대 Mock 모드가 활성화되지 않습니다
  // Development에서만 NEXT_PUBLIC_MOCK_MODE=true일 때 Mock 모드가 활성화됩니다
  const isProduction = process.env.NODE_ENV === 'production'
  const mockModeEnabled = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
  const hasEnvVars = supabaseUrl && supabaseAnonKey
  const isMockMode = !isProduction && mockModeEnabled && !hasEnvVars

  // Mock 모드: 환경 변수가 없으면 Supabase 클라이언트 생성 건너뛰기
  if (isMockMode) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next({ request })
  }

  // Edge-compatible Supabase client 생성
  // Response는 먼저 생성하고, 쿠키 설정 시 업데이트
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        // Edge Runtime에서는 request.cookies를 직접 수정하지 않고
        // response.cookies에만 설정합니다
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // 세션 갱신 (Edge Middleware에서는 getSession 또는 getClaims 사용 권장)
  // getUser()도 작동하지만, getSession()이 더 가벼움
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // OAuth 콜백 경로는 인증 체크에서 제외 (세션 설정 중이므로)
  if (pathname === '/callback' || pathname.startsWith('/callback')) {
    return response
  }

  // 보호된 경로 목록
  const protectedPaths = ['/posts', '/dashboard', '/courses']
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  // 1. 루트 경로 처리
  if (pathname === '/') {
    if (session?.user) {
      return NextResponse.redirect(new URL('/posts', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 2. 보호된 경로 접근 시 인증 체크
  if (isProtectedPath && !session?.user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 3. 로그인 페이지는 자유롭게 접근 가능
  return response
}
