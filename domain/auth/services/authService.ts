import { createClient, isMockMode } from '@/lib/supabase/client'
import { profileRowToDomain } from '@/lib/utils/types'
import { getErrorMessage, logError } from '@/lib/utils/errors'
import type { Database } from '@/types/database'

export interface SignInOptions {
  redirectTo?: string
}

export interface SignInResult {
  success: boolean
  error?: Error | null
  isMock?: boolean
}

type ProfileRow = Database['public']['Tables']['profiles']['Row']

/**
 * OAuth 에러 코드를 사용자 친화적 메시지로 변환
 */
function getOAuthErrorMessage(error: unknown): string {
  if (!error) return '로그인 중 오류가 발생했습니다.'

  if (typeof error === 'object' && 'message' in error) {
    const message = String(error.message).toLowerCase()

    // OAuth 취소
    if (message.includes('access_denied') || message.includes('user_cancelled')) {
      return '로그인이 취소되었습니다.'
    }

    // 네트워크 오류
    if (message.includes('network') || message.includes('fetch')) {
      return '네트워크 연결을 확인해주세요.'
    }

    // 인증 설정 오류
    if (message.includes('invalid_client') || message.includes('unauthorized')) {
      return '인증 설정에 문제가 있습니다. 관리자에게 문의해주세요.'
    }

    // 기타 OAuth 오류
    if (message.includes('oauth') || message.includes('auth')) {
      return '인증 중 오류가 발생했습니다. 다시 시도해주세요.'
    }
  }

  return '로그인 중 알 수 없는 오류가 발생했습니다.'
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
    // Route group (auth)는 URL에 포함되지 않으므로 /callback이 실제 경로입니다
    const callbackUrl = `${window.location.origin}/callback?redirect=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      return {
        success: false,
        error: new Error(getOAuthErrorMessage(error)),
      }
    }

    // OAuth는 리다이렉트를 통해 처리되므로 여기서는 성공으로 간주
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: new Error(getOAuthErrorMessage(error)),
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

/**
 * 사용자 프로필을 가져옵니다.
 * @param userId 사용자 ID
 * @returns 프로필 정보 또는 null
 */
export async function getProfile(userId: string) {
  try {
    // Mock 모드: Mock 프로필 반환
    if (isMockMode()) {
      return {
        profile: {
          id: 'mock-user-id',
          email: 'mock@example.com',
          fullName: 'Mock User',
          avatarUrl: undefined,
          role: 'user' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        error: null,
      }
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return { profile: null, error: error as Error }
    }

    if (!data) {
      return { profile: null, error: null }
    }

    return {
      profile: profileRowToDomain(data as ProfileRow),
      error: null,
    }
  } catch (error) {
    logError(error, 'getProfile')
    return {
      profile: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

// Legacy authService 객체 (하위 호환성)
export const authService = {
  signIn: signInWithGoogle,
  signOut,
  getCurrentUser,
  getProfile,
}
