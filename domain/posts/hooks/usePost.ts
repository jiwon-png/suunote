'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getPost } from '@/domain/posts/services/postService'
import type { Post } from '@/domain/posts/types'

interface UsePostReturn {
  post: Post | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * 단일 Post를 조회하는 훅
 * 
 * @param postId Post ID
 * @returns Post 데이터, 로딩 상태, 에러 상태, refetch 함수
 */
export function usePost(postId: string): UsePostReturn {
  const { user } = useAuthContext()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPost = async (retryCount: number = 0) => {
    if (!user || !postId) {
      setPost(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getPost(postId, user.id)

      if (fetchError) {
        setError(fetchError)
        setPost(null)
      } else if (!data && retryCount < 3) {
        // Post가 없고 재시도 횟수가 남아있으면 재시도
        // Post 생성 직후 DB 트랜잭션이 완료되지 않았을 수 있음
        console.log(`[usePost] Post 조회 실패, 재시도 중... (${retryCount + 1}/3)`, { postId })
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)))
        return fetchPost(retryCount + 1)
      } else {
        setPost(data)
        setError(null)
      }
    } catch (err) {
      if (retryCount < 3) {
        // 예외 발생 시에도 재시도
        console.log(`[usePost] 예외 발생, 재시도 중... (${retryCount + 1}/3)`, { postId, error: err })
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)))
        return fetchPost(retryCount + 1)
      } else {
        setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'))
        setPost(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPost(0)
  }, [postId, user?.id])

  return {
    post,
    isLoading,
    error,
    refetch: () => fetchPost(0),
  }
}
