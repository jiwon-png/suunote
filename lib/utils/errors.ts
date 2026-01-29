/**
 * 에러 처리 유틸리티 함수
 * Supabase 에러 코드를 사용자 친화적 메시지로 변환
 */

import { PostgrestError } from '@supabase/supabase-js'

/**
 * RLS 에러인지 확인
 */
export function isRLSError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    return pgError.code === '42501' || pgError.message?.includes('row-level security')
  }
  return false
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('econnrefused') ||
      error.message.toLowerCase().includes('timeout')
    )
  }
  return false
}

/**
 * 인증 에러인지 확인
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    return pgError.code === 'PGRST301' || pgError.message?.includes('JWT')
  }
  return false
}

/**
 * 유효성 검증 에러인지 확인
 */
export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    return (
      pgError.code === '23505' || // unique_violation
      pgError.code === '23503' || // foreign_key_violation
      pgError.code === '23502' || // not_null_violation
      pgError.code === '23514' // check_violation
    )
  }
  return false
}

/**
 * 레코드를 찾을 수 없는 에러인지 확인
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    return pgError.code === 'PGRST116'
  }
  return false
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다.'
  }

  // RLS 에러
  if (isRLSError(error)) {
    return '권한이 없습니다. 로그인 상태를 확인해주세요.'
  }

  // 네트워크 에러
  if (isNetworkError(error)) {
    return '네트워크 연결을 확인해주세요. 인터넷 연결이 불안정할 수 있습니다.'
  }

  // 인증 에러
  if (isAuthError(error)) {
    return '인증이 만료되었습니다. 다시 로그인해주세요.'
  }

  // 유효성 검증 에러
  if (isValidationError(error)) {
    const pgError = error as PostgrestError
    if (pgError.code === '23505') {
      return '이미 존재하는 데이터입니다.'
    }
    if (pgError.code === '23503') {
      return '관련된 데이터가 없습니다.'
    }
    if (pgError.code === '23502') {
      return '필수 항목이 누락되었습니다.'
    }
    return '입력한 데이터가 올바르지 않습니다.'
  }

  // 레코드를 찾을 수 없음
  if (isNotFoundError(error)) {
    return '요청한 데이터를 찾을 수 없습니다.'
  }

  // Error 객체인 경우
  if (error instanceof Error) {
    // 이미 사용자 친화적인 메시지인 경우 그대로 반환
    const message = error.message
    if (
      message.includes('권한') ||
      message.includes('로그인') ||
      message.includes('네트워크') ||
      message.includes('연결')
    ) {
      return message
    }
    return message || '알 수 없는 오류가 발생했습니다.'
  }

  // PostgrestError인 경우
  if (error && typeof error === 'object' && 'message' in error) {
    const pgError = error as PostgrestError
    return pgError.message || '데이터베이스 오류가 발생했습니다.'
  }

  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * 에러 타입을 반환
 */
export function getErrorType(error: unknown): 'rls' | 'network' | 'auth' | 'validation' | 'notFound' | 'unknown' {
  if (isRLSError(error)) return 'rls'
  if (isNetworkError(error)) return 'network'
  if (isAuthError(error)) return 'auth'
  if (isValidationError(error)) return 'validation'
  if (isNotFoundError(error)) return 'notFound'
  return 'unknown'
}

/**
 * 개발 환경에서 에러 로깅
 */
export function logError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
  }
}
