/**
 * AI 처리 결과
 * DB 테이블: public.ai_results
 */
export interface AIResult {
  id: string
  postId: string
  summary?: string
  keyPoints?: string[] // JSONB 배열
  studyDirection?: string
  quiz?: QuizItem[] // JSONB 배열
  timeline?: TimelineItem[] // JSONB 배열
  provider?: 'google' | 'groq' // 사용된 AI Provider
  model?: string // 사용된 AI 모델명
  rawResponse?: Record<string, unknown> // JSONB
  createdAt: Date
  updatedAt: Date
}

export interface AIProcessingRequest {
  content: string
}

export interface AIProcessingResponse {
  summary: string
  keyPoints: string[]
  studyDirection: string
}

/**
 * AI 파이프라인 응답 (퀴즈/타임라인 포함)
 */
export interface AIPipelineResponse {
  summary: string
  keyPoints: string[]
  studyDirection: string
  quiz: QuizItem[]
  timeline: TimelineItem[]
}

/**
 * 퀴즈 아이템
 */
export interface QuizItem {
  question: string
  choices: string[] // 4지선다
  answerIndex: number // 0-3
  explanation: string
}

/**
 * 타임라인 아이템
 */
export interface TimelineItem {
  title: string
  order: number
  detail: string
}
