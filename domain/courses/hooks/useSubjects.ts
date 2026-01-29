'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getSubjects } from '@/domain/courses/services/subjectService'
import type { Subject } from '@/domain/courses/types'

interface UseSubjectsReturn {
  subjects: Subject[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Subjects 데이터를 페칭하고 관리하는 훅
 * 
 * @returns Subjects 배열, 로딩 상태, 에러 상태, refetch 함수
 */
export function useSubjects(): UseSubjectsReturn {
  const { user } = useAuthContext()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSubjects = useCallback(async () => {
    if (!user) {
      setSubjects([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getSubjects(user.id)

      if (fetchError) {
        setError(fetchError)
        setSubjects([])
      } else {
        setSubjects(data ?? [])
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'))
      setSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  return {
    subjects,
    isLoading,
    error,
    refetch: fetchSubjects,
  }
}
