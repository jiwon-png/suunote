/**
 * 과목 (Subject)
 * DB 테이블: public.subjects
 */
export interface Subject {
  id: string
  userId: string
  name: string
  slug?: string
  color: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 코스 (Course)
 * DB 테이블: public.courses
 */
export interface Course {
  id: string
  userId: string
  subjectId?: string
  title: string
  description?: string
  courseDate?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * UI 카드용 Course ViewModel
 */
export interface CourseCardModel {
  id: string
  title: string
  description?: string
  subjectId?: string
  subjectName?: string
  subjectColor?: string
  postCount: number
  createdAt: Date
  courseDate?: Date
}
