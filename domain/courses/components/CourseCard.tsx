'use client'

interface CourseCardProps {
  course: {
    id: string
    title: string
    description?: string
  }
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div>
      {/* Course card will be implemented here (Phase 2) */}
    </div>
  )
}
