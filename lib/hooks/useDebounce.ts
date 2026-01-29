'use client'

import { useState, useEffect } from 'react'

/**
 * 디바운스 훅
 * 입력값이 변경된 후 지정된 시간이 지나면 업데이트된 값을 반환합니다.
 * 
 * @param value 디바운스할 값
 * @param delay 지연 시간 (밀리초, 기본값: 500ms)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // delay 시간 후에 값 업데이트
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // cleanup: 값이 변경되면 이전 타이머 취소
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
