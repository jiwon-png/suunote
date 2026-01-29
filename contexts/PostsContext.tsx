'use client'

import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useRef } from 'react'
import { usePosts } from '@/domain/posts/hooks/usePosts'
import { useAuthContext } from '@/contexts/AuthContext'
import { subscribeToPosts, unsubscribeFromPosts, type PostChangeEvent } from '@/lib/supabase/realtime'
import type { Post } from '@/domain/posts/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PostsContextType {
  posts: Post[]
  isLoading: boolean
  error: Error | null
  addPost: (post: Post) => Promise<{ success: boolean; error?: Error; rollback?: () => void }>
  updatePost: (id: string, updates: Partial<Post>) => Promise<{ success: boolean; error?: Error; rollback?: () => void }>
  deletePost: (id: string) => Promise<{ success: boolean; error?: Error; rollback?: () => void }>
  refetch: () => Promise<void>
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const { posts: fetchedPosts, isLoading, error, refetch } = usePosts()
  
  // 낙관적 업데이트를 위한 로컬 상태
  const [optimisticPosts, setOptimisticPosts] = useState<Post[]>([])
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set())
  
  // Realtime 구독 채널 참조
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  // 최신 상태를 참조하기 위한 ref
  const fetchedPostsRef = useRef(fetchedPosts)
  const pendingOperationsRef = useRef(pendingOperations)

  // ref 업데이트
  useEffect(() => {
    fetchedPostsRef.current = fetchedPosts
  }, [fetchedPosts])

  useEffect(() => {
    pendingOperationsRef.current = pendingOperations
  }, [pendingOperations])

  // 실제 posts: 낙관적 업데이트가 있으면 그것을 사용, 없으면 fetchedPosts 사용
  const posts = optimisticPosts.length > 0 ? optimisticPosts : fetchedPosts
  
  // Realtime 구독 설정
  useEffect(() => {
    if (!user?.id) {
      // 사용자가 없으면 구독하지 않음
      return
    }

    // Realtime 구독 설정
    const channel = subscribeToPosts(user.id, (event: PostChangeEvent) => {
      // 낙관적 업데이트가 진행 중이면 무시 (중복 방지)
      if (pendingOperationsRef.current.size > 0) {
        return
      }

      switch (event.type) {
        case 'INSERT':
          // 새 Post 추가 (최신순 정렬 유지)
          setOptimisticPosts((prev) => {
            if (prev.length === 0) {
              return [event.new, ...fetchedPostsRef.current]
            }
            return [event.new, ...prev]
          })
          // 잠시 후 서버 데이터로 동기화
          setTimeout(() => {
            setOptimisticPosts([])
            refetch()
          }, 100)
          break

        case 'UPDATE':
          // Post 수정
          setOptimisticPosts((prev) => {
            if (prev.length === 0) {
              return fetchedPostsRef.current.map((p) => (p.id === event.new.id ? event.new : p))
            }
            return prev.map((p) => (p.id === event.new.id ? event.new : p))
          })
          // 잠시 후 서버 데이터로 동기화
          setTimeout(() => {
            setOptimisticPosts([])
            refetch()
          }, 100)
          break

        case 'DELETE':
          // Post 삭제
          setOptimisticPosts((prev) => {
            if (prev.length === 0) {
              return fetchedPostsRef.current.filter((p) => p.id !== event.old.id)
            }
            return prev.filter((p) => p.id !== event.old.id)
          })
          // 잠시 후 서버 데이터로 동기화
          setTimeout(() => {
            setOptimisticPosts([])
            refetch()
          }, 100)
          break
      }
    })

    realtimeChannelRef.current = channel

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (channel) {
        unsubscribeFromPosts(channel)
        realtimeChannelRef.current = null
      }
    }
  }, [user?.id, refetch])

  /**
   * Post를 낙관적으로 추가합니다.
   * 즉시 UI에 반영하고, API 호출 후 실패 시 롤백합니다.
   */
  const addPost = useCallback(async (post: Post): Promise<{ success: boolean; error?: Error; rollback?: () => void }> => {
    const operationId = `add-${post.id}`
    
    // 롤백 함수
    const rollback = () => {
      setOptimisticPosts((prev) => prev.filter((p) => p.id !== post.id))
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })
    }

    try {
      // 낙관적 업데이트: 즉시 목록에 추가
      setPendingOperations((prev) => new Set(prev).add(operationId))
      setOptimisticPosts((prev) => [post, ...prev])

      // API 호출은 호출자가 이미 완료했으므로, 여기서는 성공으로 간주
      // 실제로는 호출자가 API 호출 후 이 함수를 호출해야 함
      
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })

      // 낙관적 상태를 정리하고 서버 데이터로 동기화
      setTimeout(() => {
        setOptimisticPosts([])
        refetch()
      }, 100)

      return { success: true, rollback }
    } catch (err) {
      rollback()
      const error = err instanceof Error ? err : new Error('Post 추가에 실패했습니다.')
      return { success: false, error, rollback }
    }
  }, [refetch])

  /**
   * Post를 낙관적으로 수정합니다.
   * 즉시 UI에 반영하고, API 호출 후 실패 시 롤백합니다.
   */
  const updatePost = useCallback(async (
    id: string,
    updates: Partial<Post>
  ): Promise<{ success: boolean; error?: Error; rollback?: () => void }> => {
    const operationId = `update-${id}`
    
    // 원본 Post 저장 (롤백용)
    const originalPost = posts.find((p) => p.id === id)
    if (!originalPost) {
      return { success: false, error: new Error('Post를 찾을 수 없습니다.') }
    }

    // 롤백 함수
    const rollback = () => {
      setOptimisticPosts((prev) => {
        if (prev.length === 0) {
          return fetchedPosts.map((p) => (p.id === id ? originalPost : p))
        }
        return prev.map((p) => (p.id === id ? originalPost : p))
      })
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })
    }

    try {
      // 낙관적 업데이트: 즉시 UI 업데이트
      setPendingOperations((prev) => new Set(prev).add(operationId))
      setOptimisticPosts((prev) => {
        if (prev.length === 0) {
          // 낙관적 상태가 없으면 생성
          return fetchedPosts.map((p) => (p.id === id ? { ...p, ...updates } : p))
        }
        return prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      })

      // API 호출은 호출자가 이미 완료했으므로, 여기서는 성공으로 간주
      
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })

      // 낙관적 상태를 정리하고 서버 데이터로 동기화
      setTimeout(() => {
        setOptimisticPosts([])
        refetch()
      }, 100)

      return { success: true, rollback }
    } catch (err) {
      rollback()
      const error = err instanceof Error ? err : new Error('Post 수정에 실패했습니다.')
      return { success: false, error, rollback }
    }
  }, [posts, fetchedPosts, refetch])

  /**
   * Post를 낙관적으로 삭제합니다.
   * 즉시 목록에서 제거하고, API 호출 후 실패 시 롤백합니다.
   */
  const deletePost = useCallback(async (id: string): Promise<{ success: boolean; error?: Error; rollback?: () => void }> => {
    const operationId = `delete-${id}`
    
    // 원본 Post 저장 (롤백용)
    const originalPost = posts.find((p) => p.id === id)
    if (!originalPost) {
      return { success: false, error: new Error('Post를 찾을 수 없습니다.') }
    }

    // 롤백 함수
    const rollback = () => {
      setOptimisticPosts((prev) => {
        if (prev.length === 0) {
          // 원래 위치에 복원 (created_at 기준 정렬)
          const restored = [...fetchedPosts, originalPost].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )
          return restored
        }
        return [...prev, originalPost].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        )
      })
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })
    }

    try {
      // 낙관적 업데이트: 즉시 목록에서 제거
      setPendingOperations((prev) => new Set(prev).add(operationId))
      setOptimisticPosts((prev) => {
        if (prev.length === 0) {
          // 낙관적 상태가 없으면 생성
          return fetchedPosts.filter((p) => p.id !== id)
        }
        return prev.filter((p) => p.id !== id)
      })

      // API 호출은 호출자가 이미 완료했으므로, 여기서는 성공으로 간주
      
      setPendingOperations((prev) => {
        const next = new Set(prev)
        next.delete(operationId)
        return next
      })

      // 낙관적 상태를 정리하고 서버 데이터로 동기화
      setTimeout(() => {
        setOptimisticPosts([])
        refetch()
      }, 100)

      return { success: true, rollback }
    } catch (err) {
      rollback()
      const error = err instanceof Error ? err : new Error('Post 삭제에 실패했습니다.')
      return { success: false, error, rollback }
    }
  }, [posts, fetchedPosts, refetch])

  const value: PostsContextType = {
    posts,
    isLoading,
    error,
    addPost,
    updatePost,
    deletePost,
    refetch,
  }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePostsContext() {
  const context = useContext(PostsContext)
  if (context === undefined) {
    throw new Error('usePostsContext must be used within a PostsProvider')
  }
  return context
}
