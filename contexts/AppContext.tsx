'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Subject } from '@/domain/courses/types'
import { Course } from '@/domain/courses/types'

interface AppContextType {
  subjects: Subject[]
  courses: Course[]
  getSubject: (id: string) => Subject | undefined
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Mock 데이터: 테스트용 과목 및 코스
const mockSubjects: Subject[] = [
  {
    id: 'os',
    userId: 'mock-user-1',
    name: '운영체제',
    color: '#3B82F6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'db',
    userId: 'mock-user-1',
    name: '데이터베이스',
    color: '#10B981',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'algo',
    userId: 'mock-user-1',
    name: '알고리즘',
    color: '#8B5CF6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'network',
    userId: 'mock-user-1',
    name: '컴퓨터 네트워크',
    color: '#F59E0B',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockCourses: Course[] = [
  {
    id: 'course-1',
    userId: 'mock-user-1',
    subjectId: 'os',
    title: '프로세스 스케줄링',
    description: '운영체제의 프로세스 스케줄링 알고리즘을 학습합니다.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'course-2',
    userId: 'mock-user-1',
    subjectId: 'db',
    title: '데이터베이스 정규화',
    description: '데이터베이스 설계의 정규화 기법을 학습합니다.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
]

export function AppProvider({ children }: { children: ReactNode }) {
  // Phase 1: In-memory state
  // Phase 2: Will be replaced with Supabase integration

  const getSubject = (id: string) => {
    return mockSubjects.find((s) => s.id === id)
  }

  const value: AppContextType = {
    subjects: mockSubjects,
    courses: mockCourses,
    getSubject,
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
