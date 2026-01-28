export interface Course {
  id: string
  userId: string
  subjectId?: string
  title: string
  description?: string
  weekNumber?: number
  topic?: string
  createdAt: Date
  updatedAt: Date
}

export interface Subject {
  id: string
  userId: string
  name: string
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}
