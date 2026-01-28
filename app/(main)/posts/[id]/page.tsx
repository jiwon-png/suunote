"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ListChecks,
  Compass,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePostsContext } from "@/contexts/PostsContext"

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function PostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { posts, deletePost } = usePostsContext()
  const [isContentExpanded, setIsContentExpanded] = useState(false)

  const post = posts.find((p) => p.id === params.id)

  // Mock 데이터가 없어도 기본 UI 구조를 유지하도록 fallback 처리
  const displayPost = post || {
    id: params.id,
    userId: 'mock-user',
    title: '샘플 학습 노트',
    content: '이것은 샘플 학습 노트입니다. 실제 데이터가 로드되면 이 내용이 대체됩니다.',
    aiProcessed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    aiResult: {
      summary: '이것은 샘플 AI 요약입니다.',
      keyPoints: [
        '샘플 핵심 포인트 1',
        '샘플 핵심 포인트 2',
        '샘플 핵심 포인트 3',
      ],
      studyDirection: '이것은 샘플 학습 방향 제안입니다.',
    },
  }

  const handleDelete = () => {
    if (post) {
      deletePost(post.id)
      router.push("/posts")
    } else {
      router.push("/posts")
    }
  }

  // 원본 학습 내용은 접기/펼치기로 전체 내용을 표시

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 상단 헤더 */}
      <div className="border-b border-border py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold leading-tight text-foreground">
                {displayPost.title}
              </h1>
            </div>
            <div className="pl-10 text-sm text-muted-foreground">
              <span>{formatDateTime(displayPost.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" disabled className="h-8 text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              복습하기
            </Button>
            {post && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>학습 노트 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 학습 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="py-5 space-y-5">
        {/* 원본 학습 내용 */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">원본 학습 내용</CardTitle>
              {displayPost.content.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="h-7 text-xs"
                >
                  {isContentExpanded ? (
                    <>
                      접기
                      <ChevronUp className="h-3.5 w-3.5 ml-1" />
                    </>
                  ) : (
                    <>
                      더보기
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          {isContentExpanded && (
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                {displayPost.content}
              </p>
            </CardContent>
          )}
        </Card>

        {/* AI 결과 섹션 */}
        {displayPost.aiProcessed && displayPost.aiResult && (
          <div className="space-y-5">
            {/* AI 요약 */}
            {displayPost.aiResult.summary && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">요약</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {displayPost.aiResult.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 핵심 포인트 */}
            {displayPost.aiResult.keyPoints && displayPost.aiResult.keyPoints.length > 0 && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ListChecks className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">핵심 포인트</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <ol className="space-y-2.5">
                    {displayPost.aiResult.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-card-foreground leading-relaxed flex-1">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* 학습 방향 제안 */}
            {displayPost.aiResult.studyDirection && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Compass className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">학습 방향 제안</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {displayPost.aiResult.studyDirection}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI 처리 중 상태 */}
        {!displayPost.aiProcessed && (
          <Card className="border-dashed">
            <CardContent className="py-6 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                AI 처리가 진행 중입니다. 잠시만 기다려주세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-border py-5">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/posts" className="flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            목록으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  )
}
