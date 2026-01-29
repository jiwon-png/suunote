'use client'

import { useEffect } from 'react'
import ErrorDisplay from '@/components/common/ErrorDisplay'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 개발 환경에서만 오류를 콘솔에 기록
    if (process.env.NODE_ENV === 'development') {
      console.error('Global application error:', error)
    }
  }, [error])

  return (
    <html lang="ko">
      <body>
        <ErrorDisplay
          title="시스템 오류가 발생했습니다"
          message="애플리케이션에서 심각한 오류가 발생했습니다. 페이지를 새로고침하거나 메인 화면으로 돌아가주세요."
          onReset={reset}
        />
      </body>
    </html>
  )
}
