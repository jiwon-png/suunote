"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePostsContext } from "@/contexts/PostsContext"

interface ConceptMapTabProps {
  courseId: string
}

export default function ConceptMapTab({ courseId }: ConceptMapTabProps) {
  const { posts } = usePostsContext()

  // 코스에 속한 학습 노트 필터링
  const coursePosts = posts.filter((post) => post.courseId === courseId)

  // AI 결과에서 핵심 개념 추출
  const concepts = coursePosts.flatMap((post) => {
    if (!post.aiResult?.keyPoints) return []
    return post.aiResult.keyPoints.map((point) => ({
      postId: post.id,
      postTitle: post.title,
      concept: point,
    }))
  })

  // 메인 개념 (첫 번째 포스트의 제목 또는 첫 번째 핵심 포인트)
  const mainConcept = coursePosts[0]?.title || "핵심 개념"

  if (concepts.length === 0) {
    return (
      <Card className="border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          학습 노트의 AI 분석이 완료되면 개념 맵이 생성됩니다
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        학습한 개념들의 관계를 시각적으로 확인하세요.
      </p>

      {/* 메인 개념 맵 카드 */}
      <Card className="p-6">
        {/* 중앙 핵심 개념 노드 */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-lg bg-primary px-4 py-2.5">
            <h3 className="text-base font-semibold text-primary-foreground">
              {mainConcept}
            </h3>
          </div>
        </div>

        {/* 하위 개념 노드들 */}
        <div className="space-y-3">
          {concepts.slice(0, 3).map((concept, index) => (
            <div key={index} className="flex justify-center">
              <div className="w-full max-w-md rounded-lg border border-border bg-secondary/50 px-4 py-2.5">
                <p className="text-sm text-card-foreground">{concept.concept}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 안내 문구 */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          노드를 클릭하면 해당 학습 노트로 이동합니다
        </p>
      </Card>

      {/* 추출된 핵심 개념 섹션 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          추출된 핵심 개념 ({concepts.length}개)
        </h3>
        <div className="flex flex-wrap gap-2">
          {concepts.map((concept, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs"
            >
              {concept.concept}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
