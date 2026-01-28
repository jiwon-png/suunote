"use client"

import { Card } from "@/components/ui/card"

/**
 * Empty State: 학습 노트가 없을 때 표시되는 UI
 */
export default function EmptyPostState() {
  return (
    <Card className="border-dashed border-border bg-card p-12 text-center">
      <div className="space-y-2">
        <p className="text-base font-medium text-muted-foreground">
          아직 학습 게시글이 없습니다
        </p>
        <p className="text-sm text-muted-foreground">
          첫 번째 학습 글을 작성해보세요
        </p>
      </div>
    </Card>
  )
}
