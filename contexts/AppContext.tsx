'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSubjects } from '@/domain/courses/hooks/useSubjects'
import { useCourses } from '@/domain/courses/hooks/useCourses'
import type { Subject } from '@/domain/courses/types'
import type { CourseWithSubject } from '@/domain/courses/services/courseService'

interface AppContextType {
  subjects: Subject[]
  courses: CourseWithSubject[]
  isLoading: boolean
  error: Error | null
  getSubject: (id: string) => Subject | undefined
  getCourse: (id: string) => CourseWithSubject | undefined
  refetchSubjects: () => Promise<void>
  refetchCourses: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { subjects, isLoading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useSubjects()
  const { courses, isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useCourses()

  const getSubject = (id: string) => {
    return subjects.find((s) => s.id === id)
  }

  const getCourse = (id: string) => {
    return courses.find((c) => c.id === id)
  }

  // 두 훅의 로딩/에러 상태를 병합
  const isLoading = subjectsLoading || coursesLoading
  const error = subjectsError || coursesError

  const value: AppContextType = {
    subjects,
    courses,
    isLoading,
    error,
    getSubject,
    getCourse,
    refetchSubjects,
    refetchCourses,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
