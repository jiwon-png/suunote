/**
 * Subject 서비스 레이어
 * Supabase를 통한 Subjects 데이터 CRUD 작업
 */

import { createClient } from '@/lib/supabase/client'
import { subjectRowToDomain } from '@/lib/utils/types'
import { getErrorMessage, logError } from '@/lib/utils/errors'
import type { Subject } from '@/domain/courses/types'
import type { Database } from '@/types/database'

type SubjectRow = Database['public']['Tables']['subjects']['Row']

export interface CreateSubjectData {
  name: string
  slug?: string
  color: string
  sortOrder?: number
}

/**
 * 사용자의 모든 Subjects를 조회합니다.
 * 
 * @param userId 사용자 ID
 * @returns Subject 배열
 */
export async function getSubjects(userId: string): Promise<{ data: Subject[] | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      logError(error, 'getSubjects')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    if (!data) {
      return { data: [], error: null }
    }

    const subjects: Subject[] = data.map((row: SubjectRow) => subjectRowToDomain(row))

    return { data: subjects, error: null }
  } catch (error) {
    logError(error, 'getSubjects')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 새 Subject를 생성합니다.
 * 
 * @param userId 사용자 ID
 * @param data Subject 생성 데이터
 * @returns 생성된 Subject
 */
export async function createSubject(
  userId: string,
  data: CreateSubjectData
): Promise<{ data: Subject | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data: insertedData, error } = await supabase
      .from('subjects')
      .insert({
        user_id: userId,
        name: data.name,
        slug: data.slug ?? null,
        color: data.color,
        sort_order: data.sortOrder ?? 0,
      })
      .select()
      .single()

    if (error) {
      logError(error, 'createSubject')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    const subject = subjectRowToDomain(insertedData as SubjectRow)

    return { data: subject, error: null }
  } catch (error) {
    logError(error, 'createSubject')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Subject를 수정합니다.
 * 
 * @param subjectId Subject ID
 * @param userId 사용자 ID (RLS 검증용)
 * @param updates 수정할 데이터
 * @returns 수정된 Subject
 */
export async function updateSubject(
  subjectId: string,
  userId: string,
  updates: Partial<Pick<Subject, 'name' | 'slug' | 'color' | 'sortOrder'>>
): Promise<{ data: Subject | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.slug !== undefined) updateData.slug = updates.slug ?? null
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder

    const { data: updatedData, error } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', subjectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logError(error, 'updateSubject')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    const subject = subjectRowToDomain(updatedData as SubjectRow)

    return { data: subject, error: null }
  } catch (error) {
    logError(error, 'updateSubject')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Subject를 삭제합니다.
 * 
 * @param subjectId Subject ID
 * @param userId 사용자 ID (RLS 검증용)
 * @returns 성공 여부
 */
export async function deleteSubject(
  subjectId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId)
      .eq('user_id', userId)

    if (error) {
      logError(error, 'deleteSubject')
      return {
        error: new Error(getErrorMessage(error)),
      }
    }

    return { error: null }
  } catch (error) {
    logError(error, 'deleteSubject')
    return {
      error: new Error(getErrorMessage(error)),
    }
  }
}

// Legacy subjectService 객체 (하위 호환성)
export const subjectService = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
}
