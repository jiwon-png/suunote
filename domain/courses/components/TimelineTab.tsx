"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { usePostsContext } from "@/contexts/PostsContext"

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

interface TimelineTabProps {
  courseId: string
}

export default function TimelineTab({ courseId }: TimelineTabProps) {
  const { posts } = usePostsContext()

  // 코스에 속한 학습 노트 필터링 및 정렬
  const coursePosts = posts
    .filter((post) => post.courseId === courseId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  if (coursePosts.length === 0) {
    return (
      <Card className="border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          아직 등록된 학습 노트가 없습니다
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        시간순으로 정렬된 학습 흐름입니다. 개념들이 어떻게 연결되는지 확인하세요.
      </p>

      <div className="relative">
        {/* 타임라인 세로선 */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />

        <div className="space-y-6">
          {coursePosts.map((post, index) => (
            <div key={post.id} className="relative flex gap-4 pl-10">
              {/* 타임라인 점 */}
              <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />

              <Card className="group flex-1 p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatFullDate(post.createdAt)}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {index + 1}일차
                  </span>
                </div>

                <Link
                  href={`/posts/${post.id}`}
                  className="group/link flex items-center justify-between"
                >
                  <h3 className="text-base font-semibold text-card-foreground group-hover/link:text-primary">
                    {post.title}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/link:translate-x-0.5" />
                </Link>

                {post.aiResult?.summary && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {post.aiResult.summary}
                  </p>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
