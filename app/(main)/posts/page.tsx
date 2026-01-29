"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import PostList from "@/components/posts/PostList"
import { usePostsContext } from "@/contexts/PostsContext"

/**
 * /posts 페이지: 로그인 후 진입하는 학습 노트 메인 홈 화면
 * 
 * 레이아웃 구조:
 * - Header (app/layout.tsx에서 제공)
 * - 페이지 헤더 (제목, 설명, CTA 버튼)
 * - 학습 노트 카드 리스트 또는 Empty State
 * - Footer (app/layout.tsx에서 제공)
 */
export default function PostsPage() {
  const searchParams = useSearchParams()
  const { posts } = usePostsContext()
  
  // URL 쿼리 파라미터에서 과목 ID 가져오기
  const subjectId = searchParams.get('subject')
  
  // 과목별 필터링
  const filteredPosts = subjectId
    ? posts.filter((post) => post.subjectId === subjectId)
    : posts

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 페이지 헤더: Header 바로 아래에 위치 */}
      <div className="border-b border-border py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">내 학습 노트</h1>
            <p className="text-sm text-muted-foreground">
              학습 내용을 정리하고 AI의 도움을 받아보세요
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/posts/new" className="gap-2">
              <Plus className="h-4 w-4" />
              새 학습 글 작성
            </Link>
          </Button>
        </div>
      </div>

      {/* 학습 노트 리스트: 헤더 바로 아래에 위치 */}
      <div className="py-6">
        <PostList posts={filteredPosts} />
      </div>
    </div>
  )
}
