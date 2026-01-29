"use client"

import { Post } from "@/domain/posts/types"
import PostCard from "./PostCard"
import EmptyPostState from "./EmptyPostState"
import { PostListSkeleton } from "@/components/common/SkeletonLoader"
import ErrorDisplay from "@/components/common/ErrorDisplay"
import Pagination from "@/components/common/Pagination"

interface PostListProps {
  posts: Post[]
  isLoading?: boolean
  error?: Error | null
  pagination?: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
    setPage: (page: number) => void
  }
}

export default function PostList({ posts, isLoading = false, error = null, pagination }: PostListProps) {
  // 로딩 상태 - 스켈레톤 UI 표시
  if (isLoading) {
    return <PostListSkeleton count={5} />
  }

  // 에러 상태
  if (error) {
    return (
      <div className="py-6">
        <ErrorDisplay error={error} showHomeButton={false} />
      </div>
    )
  }

  // 빈 상태
  if (posts.length === 0) {
    return <EmptyPostState />
  }

  // 정상 상태
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0

  return (
    <div className="space-y-6">
      {/* Post 목록 */}
      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination && totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={totalPages}
          onPageChange={pagination.setPage}
        />
      )}
    </div>
  )
}
