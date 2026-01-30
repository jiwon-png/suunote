"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * OAuth 콜백 성공 후 클라이언트 사이드 리다이렉트 처리
 * sessionStorage에서 원래 가려던 페이지를 읽어서 리다이렉트
 */
export default function CallbackSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // sessionStorage에서 원래 가려던 페이지 확인
    const redirectTo = sessionStorage.getItem('oauth_redirect_to') || '/posts'
    
    // sessionStorage 정리
    sessionStorage.removeItem('oauth_redirect_to')
    
    // 원래 가려던 페이지로 리다이렉트
    router.replace(redirectTo)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
        <p className="text-muted-foreground">로그인 완료 중...</p>
      </div>
    </div>
  )
}
