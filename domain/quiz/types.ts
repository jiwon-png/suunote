/**
 * 복습 문제 (Quiz)
 * DB 테이블: public.quizzes
 */
export interface Quiz {
  id: string
  userId: string
  courseId?: string
  postId?: string
  question: string
  choices: string[] // JSONB 배열
  correctIndex?: number // 정답 인덱스 (nullable for Phase 1)
  explanation?: string
  createdAt: Date
}
