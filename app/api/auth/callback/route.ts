import { isMockMode } from '@/lib/supabase/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * OAuth 에러 코드를 사용자 친화적 메시지로 변환
 */
function getOAuthErrorCode(error: string | null): string {
  if (!error) return 'unknown_error'

  const errorLower = error.toLowerCase()

  // OAuth 취소
  if (errorLower.includes('access_denied') || errorLower.includes('user_cancelled')) {
    return 'user_cancelled'
  }

  // 세션 교환 실패
  if (errorLower.includes('session') || errorLower.includes('exchange')) {
    return 'session_exchange_failed'
  }

  // 기타 OAuth 오류
  return 'oauth_error'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  // redirect 파라미터는 더 이상 쿼리 스트링으로 전달되지 않음
  // 클라이언트에서 sessionStorage를 통해 처리하므로 기본값 사용
  const redirectTo = '/posts'

  // Mock 모드: 바로 리다이렉트 (Mock 모드에서는 콜백이 필요 없음)
  if (isMockMode()) {
    const redirectUrl = new URL(redirectTo, requestUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }

  // OAuth 에러가 있는 경우 로그인 페이지로 리다이렉트
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', getOAuthErrorCode(error))
    if (errorDescription) {
      loginUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(loginUrl)
  }

  // 인증 코드가 없는 경우 (예상치 못한 상황)
  if (!code) {
    console.warn('OAuth callback received without code or error')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(loginUrl)
  }

  // 인증 코드가 있는 경우 세션 교환
  // 중요: NextResponse를 먼저 생성하여 쿠키가 리다이렉트 응답에 포함되도록 함
  // 클라이언트 사이드에서 sessionStorage를 확인하여 최종 리다이렉트 처리
  const redirectUrl = new URL('/callback-success', requestUrl.origin)
  const response = NextResponse.redirect(redirectUrl)

  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set')
    }

    // Route Handler에서 쿠키를 NextResponse에 직접 설정하도록 createServerClient 사용
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
        ) {
          // 쿠키를 NextResponse에 직접 설정하여 리다이렉트 응답에 포함됨
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'session_exchange_failed')
      loginUrl.searchParams.set('error_description', exchangeError.message)
      return NextResponse.redirect(loginUrl)
    }

    // 세션 교환 성공 확인
    if (!data.session) {
      console.error('Session exchange succeeded but no session returned')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'session_exchange_failed')
      return NextResponse.redirect(loginUrl)
    }

    // 쿠키가 설정된 응답 반환
    return response
  } catch (err) {
    console.error('Unexpected error during session exchange:', err)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'unexpected_error')
    loginUrl.searchParams.set(
      'error_description',
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    )
    return NextResponse.redirect(loginUrl)
  }
}
