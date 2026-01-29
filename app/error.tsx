'use client'

import { useEffect } from 'react'
import ErrorDisplay from '@/components/common/ErrorDisplay'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 개발 환경에서만 오류를 콘솔에 기록
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
  }, [error])

  return (
    <ErrorDisplay
      title="오류가 발생했습니다"
      message="페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      onReset={reset}
    />
  )
}
