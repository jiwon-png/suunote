/**
 * Course 서비스 레이어
 * Supabase를 통한 Courses 데이터 CRUD 작업
 */

import { createClient } from '@/lib/supabase/client'
import { courseRowToDomain } from '@/lib/utils/types'
import { getErrorMessage, logError } from '@/lib/utils/errors'
import type { Course } from '@/domain/courses/types'
import type { Database } from '@/types/database'

type CourseRow = Database['public']['Tables']['courses']['Row']
type SubjectRow = Database['public']['Tables']['subjects']['Row']

export interface CreateCourseData {
  subjectId?: string
  title: string
  description?: string
  courseDate?: Date
}

export interface CourseWithSubject extends Course {
  subjectName?: string
  subjectColor?: string
}

/**
 * 사용자의 모든 Courses를 조회합니다.
 * Subjects 테이블과 LEFT JOIN하여 과목 정보를 포함합니다.
 * 
 * @param userId 사용자 ID
 * @returns Course 배열 (과목 정보 포함)
 */
export async function getCourses(userId: string): Promise<{ data: CourseWithSubject[] | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        subjects (
          id,
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logError(error, 'getCourses')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    if (!data) {
      return { data: [], error: null }
    }

    const courses: CourseWithSubject[] = data.map((row: any) => {
      const course = courseRowToDomain(row as CourseRow)
      // Supabase JOIN 결과: subjects는 단일 객체 또는 null (1:1 관계)
      const subject = (row.subjects as SubjectRow | null) ?? null
      
      return {
        ...course,
        subjectName: subject?.name,
        subjectColor: subject?.color,
      }
    })

    return { data: courses, error: null }
  } catch (error) {
    logError(error, 'getCourses')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 특정 Course를 조회합니다.
 * 
 * @param courseId Course ID
 * @param userId 사용자 ID (RLS 검증용)
 * @returns Course 또는 null
 */
export async function getCourse(
  courseId: string,
  userId: string
): Promise<{ data: CourseWithSubject | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        subjects (
          id,
          name,
          color
        )
      `)
      .eq('id', courseId)
      .eq('user_id', userId)
      .single()

    if (error) {
      logError(error, 'getCourse')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    if (!data) {
      return { data: null, error: null }
    }

    const course = courseRowToDomain(data as CourseRow)
    // Supabase JOIN 결과: subjects는 단일 객체 또는 null (1:1 관계)
    const subject = (data.subjects as SubjectRow | null) ?? null

    const courseWithSubject: CourseWithSubject = {
      ...course,
      subjectName: subject?.name,
      subjectColor: subject?.color,
    }

    return { data: courseWithSubject, error: null }
  } catch (error) {
    logError(error, 'getCourse')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 새 Course를 생성합니다.
 * 
 * @param userId 사용자 ID
 * @param data Course 생성 데이터
 * @returns 생성된 Course
 */
export async function createCourse(
  userId: string,
  data: CreateCourseData
): Promise<{ data: Course | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data: insertedData, error } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        subject_id: data.subjectId ?? null,
        title: data.title,
        description: data.description ?? null,
        course_date: data.courseDate ? data.courseDate.toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      logError(error, 'createCourse')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    const course = courseRowToDomain(insertedData as CourseRow)

    return { data: course, error: null }
  } catch (error) {
    logError(error, 'createCourse')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Course를 수정합니다.
 * 
 * @param courseId Course ID
 * @param userId 사용자 ID (RLS 검증용)
 * @param updates 수정할 데이터
 * @returns 수정된 Course
 */
export async function updateCourse(
  courseId: string,
  userId: string,
  updates: Partial<Pick<Course, 'subjectId' | 'title' | 'description' | 'courseDate'>>
): Promise<{ data: Course | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const updateData: any = {}
    if (updates.subjectId !== undefined) updateData.subject_id = updates.subjectId ?? null
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description ?? null
    if (updates.courseDate !== undefined) {
      updateData.course_date = updates.courseDate ? updates.courseDate.toISOString() : null
    }

    const { data: updatedData, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logError(error, 'updateCourse')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    const course = courseRowToDomain(updatedData as CourseRow)

    return { data: course, error: null }
  } catch (error) {
    logError(error, 'updateCourse')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Course를 삭제합니다.
 * 
 * @param courseId Course ID
 * @param userId 사용자 ID (RLS 검증용)
 * @returns 성공 여부
 */
export async function deleteCourse(
  courseId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('user_id', userId)

    if (error) {
      logError(error, 'deleteCourse')
      return {
        error: new Error(getErrorMessage(error)),
      }
    }

    return { error: null }
  } catch (error) {
    logError(error, 'deleteCourse')
    return {
      error: new Error(getErrorMessage(error)),
    }
  }
}

// Legacy courseService 객체 (하위 호환성)
export const courseService = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
}
