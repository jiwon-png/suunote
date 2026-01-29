"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePostsContext } from "@/contexts/PostsContext"

interface ReviewTabProps {
  courseId: string
}

// Mock 문제 데이터
const mockQuestions = [
  {
    id: "q1",
    question: "다음 중 선점형 스케줄링 알고리즘에 해당하는 것은?",
    options: ["FCFS", "SJF", "Round Robin", "우선순위 (비선점)"],
    correctIndex: 2,
  },
  {
    id: "q2",
    question: "데이터베이스 정규화의 주요 목적은?",
    options: [
      "데이터 중복 최소화",
      "쿼리 성능 향상",
      "데이터베이스 크기 증가",
      "인덱스 최적화",
    ],
    correctIndex: 0,
  },
  {
    id: "q3",
    question: "1NF(제1정규형)의 조건은?",
    options: [
      "부분 함수 종속성 제거",
      "각 컬럼이 원자값을 가져야 함",
      "이행 종속성 제거",
      "복합 키 사용",
    ],
    correctIndex: 1,
  },
]

export default function ReviewTab({ courseId }: ReviewTabProps) {
  const { posts } = usePostsContext()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  // 코스에 속한 학습 노트 필터링
  const coursePosts = posts.filter((post) => post.courseId === courseId)

  if (coursePosts.length === 0) {
    return (
      <Card className="border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          아직 등록된 학습 노트가 없습니다
        </p>
      </Card>
    )
  }

  const currentPost = coursePosts[0]
  const currentQuestion = mockQuestions[currentQuestionIndex]
  const totalQuestions = mockQuestions.length

  const handleSelect = (index: number) => {
    setSelectedAnswer(index)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        코스에 포함된 모든 학습 노트를 순서대로 복습합니다.
      </p>

      {/* 진행률 표시 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">진행률</span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 bg-secondary rounded-full" />
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex} / {totalQuestions} 문제
          </span>
        </div>
      </div>

      {/* 현재 학습 노트 표시 */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-1">현재 학습 노트</p>
        <p className="text-base font-semibold text-card-foreground">
          {currentPost?.title || "학습 노트"}
        </p>
      </Card>

      {/* 문제 카드 */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-card-foreground mb-4">
          {currentQuestion.question}
        </h3>

        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === index ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => handleSelect(index)}
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
