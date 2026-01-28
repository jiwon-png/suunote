export interface Quiz {
  id: string
  userId: string
  postId?: string
  conceptId?: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  createdAt: Date
}
