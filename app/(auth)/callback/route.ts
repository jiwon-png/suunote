import { createClient, isMockMode } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const redirectTo = requestUrl.searchParams.get('redirect') || '/posts'

  // Mock 모드: 바로 리다이렉트 (Mock 모드에서는 콜백이 필요 없음)
  if (isMockMode()) {
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // OAuth 에러가 있는 경우 로그인 페이지로 리다이렉트
  if (error) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', error)
    return NextResponse.redirect(loginUrl)
  }

  // 인증 코드가 있는 경우 세션 교환
  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'session_exchange_failed')
        return NextResponse.redirect(loginUrl)
      }
    } catch (err) {
      console.error('Unexpected error during session exchange:', err)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'unexpected_error')
      return NextResponse.redirect(loginUrl)
    }
  }

  // 원래 가려던 페이지로 리다이렉트
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
