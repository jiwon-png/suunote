'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getPostsPaginatedAction } from '@/app/(main)/posts/actions'
import { getPosts, type SearchPostsOptions } from '@/domain/posts/services/postService'
import type { Post } from '@/domain/posts/types'
import type { PaginatedResponse } from '@/types/api'

interface UsePostsOptions {
  searchQuery?: string
  subjectId?: string
  courseId?: string
  paginated?: boolean
  page?: number
  pageSize?: number
}

interface UsePostsReturn {
  posts: Post[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  // 페이지네이션 관련 (paginated가 true일 때만 사용 가능)
  pagination?: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
    setPage: (page: number) => void
  }
}

/**
 * Posts 데이터를 페칭하고 관리하는 훅
 * 검색 및 필터링 옵션 지원
 * 페이지네이션 옵션 지원
 * 
 * @param options 검색 및 필터 옵션, 페이지네이션 옵션
 * @returns Posts 배열, 로딩 상태, 에러 상태, refetch 함수, 페이지네이션 정보
 */
export function usePosts(options?: UsePostsOptions): UsePostsReturn {
  const { user } = useAuthContext()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(options?.page ?? 1)
  const [paginationData, setPaginationData] = useState<PaginatedResponse<Post> | null>(null)
  
  const pageSize = options?.pageSize ?? 10
  const usePagination = options?.paginated ?? false

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const searchOptions: SearchPostsOptions = {}
      if (options?.searchQuery) searchOptions.query = options.searchQuery
      if (options?.subjectId) searchOptions.subjectId = options.subjectId
      if (options?.courseId) searchOptions.courseId = options.courseId

      if (usePagination) {
        // 페이지네이션 모드: Server Action 사용 (서버 런타임 env로 Supabase 호출 → Production 정상 동작)
        const { data, error: fetchError } = await getPostsPaginatedAction(
          user.id,
          currentPage,
          pageSize,
          searchOptions
        )

        if (fetchError) {
          setError(fetchError)
          setPosts([])
          setPaginationData(null)
        } else if (data) {
          setPosts(data.data)
          setPaginationData(data)
          setError(null)
        } else {
          setPosts([])
          setPaginationData(null)
        }
      } else {
        // 일반 모드 (모든 데이터)
        const { data, error: fetchError } = await getPosts(user.id, searchOptions)

        if (fetchError) {
          setError(fetchError)
          setPosts([])
        } else {
          setPosts(data ?? [])
          setError(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'))
      setPosts([])
      setPaginationData(null)
    } finally {
      setIsLoading(false)
    }
  }, [
    user?.id,
    options?.searchQuery,
    options?.subjectId,
    options?.courseId,
    currentPage,
    pageSize,
    usePagination,
  ])

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // options.page가 변경되면 currentPage도 업데이트
  useEffect(() => {
    if (options?.page !== undefined && options.page !== currentPage) {
      setCurrentPage(options.page)
    }
  }, [options?.page, currentPage])

  const returnValue: UsePostsReturn = {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
  }

  // 페이지네이션 정보 추가
  if (usePagination && paginationData) {
    returnValue.pagination = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: paginationData.total,
      hasMore: paginationData.hasMore,
      setPage: handlePageChange,
    }
  }

  return returnValue
}
