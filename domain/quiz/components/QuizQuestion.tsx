'use client'

interface QuizQuestionProps {
  question: {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation?: string
  }
}

export default function QuizQuestion({ question }: QuizQuestionProps) {
  return (
    <div>
      {/* Quiz question will be implemented here (Phase 2) */}
    </div>
  )
}
