'use client'

import { Card } from '@/components/ui/card'

/**
 * PostCard 스켈레톤 컴포넌트
 */
export function PostCardSkeleton() {
  return (
    <Card className="px-4 py-2.5">
      <div className="space-y-2">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </Card>
  )
}

/**
 * PostCard 리스트 스켈레톤 컴포넌트
 */
export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * PostDetail 스켈레톤 컴포넌트
 */
export function PostDetailSkeleton() {
  return (
    <div className="space-y-5">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-3 border-b border-border pb-5">
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>

      {/* 원본 학습 내용 스켈레톤 */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Card>

      {/* AI 결과 스켈레톤 */}
      <div className="space-y-5">
        {/* 요약 스켈레톤 */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Card>

        {/* 핵심 포인트 스켈레톤 */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 학습 방향 스켈레톤 */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * 일반적인 텍스트 라인 스켈레톤
 */
export function SkeletonLine({ width = 'full', className = '' }: { width?: string; className?: string }) {
  return (
    <div
      className={`h-4 animate-pulse rounded bg-muted ${width === 'full' ? 'w-full' : width} ${className}`}
    />
  )
}

/**
 * 일반적인 제목 스켈레톤
 */
export function SkeletonTitle({ className = '' }: { className?: string }) {
  return <div className={`h-6 w-3/4 animate-pulse rounded bg-muted ${className}`} />
}
