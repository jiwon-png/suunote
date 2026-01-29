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
