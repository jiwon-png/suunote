'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Subject } from '@/domain/courses/types'
import { Course } from '@/domain/courses/types'

interface AppContextType {
  subjects: Subject[]
  courses: Course[]
  selectedSubjectId?: string
  setSelectedSubjectId: (id: string | undefined) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  // Phase 1: In-memory state
  // Phase 2: Will be replaced with Supabase integration

  const value: AppContextType = {
    subjects: [],
    courses: [],
    selectedSubjectId: undefined,
    setSelectedSubjectId: () => {},
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
