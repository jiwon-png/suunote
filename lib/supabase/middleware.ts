import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Production에서는 절대 Mock 모드가 활성화되지 않습니다
  // Development에서만 NEXT_PUBLIC_MOCK_MODE=true일 때 Mock 모드가 활성화됩니다
  const isProduction = process.env.NODE_ENV === 'production'
  const mockModeEnabled = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
  const hasEnvVars = supabaseUrl && supabaseAnonKey
  const isMockMode = !isProduction && mockModeEnabled && !hasEnvVars

  // Mock 모드: 환경 변수가 없으면 Supabase 클라이언트 생성 건너뛰기
  // 루트 경로는 로그인 페이지로 리다이렉트
  if (isMockMode) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // 나머지 경로는 그대로 통과 (클라이언트에서 인증 체크)
    return response
  }

  // 실제 모드: Supabase 클라이언트 생성 및 세션 관리
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: CookieOptions
          }>
        ): void {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // OAuth 콜백 경로는 인증 체크에서 제외 (세션 설정 중이므로)
  if (pathname === '/callback' || pathname.startsWith('/callback')) {
    return response
  }

  // 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 경로 목록 (로그인이 필요한 경로)
  // /posts, /posts/new, /posts/[id] 등 모든 하위 경로 포함
  // /dashboard, /courses 및 모든 하위 경로 포함
  const protectedPaths = ['/posts', '/dashboard', '/courses']
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  // 1. 루트 경로 처리: 항상 /login 또는 /posts로 리다이렉트
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/posts', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 2. 보호된 경로 접근 시 인증 체크
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 3. 로그인 페이지 접근: 자동 리다이렉트 제거
  // 사용자가 명시적으로 /login에 접근할 수 있도록 허용
  // (예: 로그아웃 후 다시 로그인하려는 경우)
  // 자동 리다이렉트는 제거하고, 사용자가 로그인 버튼을 클릭할 때만 이동

  return response
}
