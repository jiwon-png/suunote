export interface AIResult {
  id: string
  postId: string
  summary?: string
  keyPoints?: string[]
  studyDirection?: string
  rawResponse?: Record<string, unknown>
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
