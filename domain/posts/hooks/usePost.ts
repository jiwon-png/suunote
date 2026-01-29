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

  const fetchPost = async () => {
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
      } else {
        setPost(data)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'))
      setPost(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [postId, user?.id])

  return {
    post,
    isLoading,
    error,
    refetch: fetchPost,
  }
}
