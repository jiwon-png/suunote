import { createClient, isMockMode } from '@/lib/supabase/client'

export interface SignInOptions {
  redirectTo?: string
}

export interface SignInResult {
  success: boolean
  error?: Error | null
  isMock?: boolean
}

/**
 * Google OAuth 로그인을 실행합니다.
 * Mock 모드에서는 localStorage를 사용하여 로그인을 시뮬레이션합니다.
 * @param options 리다이렉트 경로 등 옵션
 * @returns 로그인 결과
 */
export async function signInWithGoogle(
  options?: SignInOptions
): Promise<SignInResult> {
  try {
    // Mock 모드 체크
    if (isMockMode()) {
      // Mock 모드: localStorage에 mock session 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_auth_session', 'authenticated')
        
        // 자동 리다이렉트 제거: 호출하는 쪽에서 명시적으로 리다이렉트 처리
        // 사용자가 버튼을 클릭했을 때만 이동하도록 함
        return {
          success: true,
          isMock: true,
        }
      }
      
      return {
        success: false,
        error: new Error('Mock 모드에서는 브라우저 환경에서만 작동합니다.'),
        isMock: true,
      }
    }

    // 실제 Supabase OAuth 로그인
    const supabase = createClient()
    const redirectTo = options?.redirectTo || '/posts'
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      return {
        success: false,
        error: error as Error,
      }
    }

    // OAuth는 리다이렉트를 통해 처리되므로 여기서는 성공으로 간주
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error('로그인 중 알 수 없는 오류가 발생했습니다.'),
    }
  }
}

/**
 * 로그아웃을 실행합니다.
 */
export async function signOut(): Promise<{ error?: Error | null }> {
  try {
    // Mock 모드: localStorage에서 mock session 제거
    if (isMockMode()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock_auth_session')
      }
      return { error: null }
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    return { error: error as Error | null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}

/**
 * 현재 사용자 정보를 가져옵니다.
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return { user: null, error }
    }

    return { user, error: null }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}

// Legacy authService 객체 (하위 호환성)
export const authService = {
  signIn: signInWithGoogle,
  signOut,
  getCurrentUser,
}
