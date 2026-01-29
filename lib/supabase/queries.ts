/**
 * Supabase 쿼리 헬퍼 함수
 * 공통 쿼리 패턴을 재사용 가능한 함수로 추상화
 */

import { createClient } from './client'
import type { Database } from '@/types/database'
import { PostgrestError } from '@supabase/supabase-js'

type TableName = keyof Database['public']['Tables']
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

export interface QueryOptions {
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * RLS 에러인지 확인
 */
export function isRLSError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    return pgError.code === '42501' || pgError.message?.includes('row-level security')
  }
  return false
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED')
    )
  }
  return false
}

/**
 * 사용자별 데이터 조회 (RLS 자동 적용)
 */
export async function queryUserData<T extends TableName>(
  table: T,
  userId: string,
  options?: QueryOptions
): Promise<{ data: TableRow<T>[] | null; error: Error | null }> {
  try {
    const supabase = createClient()
    let query = supabase.from(table).select('*').eq('user_id', userId)

    // 정렬 옵션 적용
    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection === 'asc',
      })
    }

    // LIMIT/OFFSET 적용
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      if (isRLSError(error)) {
        return {
          data: null,
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      return { data: null, error: error as Error }
    }

    return { data: data as TableRow<T>[], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'),
    }
  }
}

/**
 * ID로 단일 레코드 조회
 */
export async function queryById<T extends TableName>(
  table: T,
  id: string
): Promise<{ data: TableRow<T> | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()

    if (error) {
      if (isRLSError(error)) {
        return {
          data: null,
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      if (error.code === 'PGRST116') {
        // 레코드를 찾을 수 없음
        return { data: null, error: null }
      }
      return { data: null, error: error as Error }
    }

    return { data: data as TableRow<T>, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'),
    }
  }
}

/**
 * 페이지네이션 지원 조회
 */
export async function queryPaginated<T extends TableName>(
  table: T,
  userId: string,
  page: number,
  pageSize: number,
  options?: Omit<QueryOptions, 'limit' | 'offset'>
): Promise<{ data: PaginatedResponse<TableRow<T>> | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const offset = (page - 1) * pageSize

    // 전체 개수 조회
    const { count, error: countError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      if (isRLSError(countError)) {
        return {
          data: null,
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      return { data: null, error: countError as Error }
    }

    // 데이터 조회
    let query = supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + pageSize - 1)

    // 정렬 옵션 적용
    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection === 'asc',
      })
    }

    const { data, error } = await query

    if (error) {
      if (isRLSError(error)) {
        return {
          data: null,
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      return { data: null, error: error as Error }
    }

    const total = count ?? 0
    const hasMore = offset + pageSize < total

    return {
      data: {
        data: (data as TableRow<T>[]) ?? [],
        total,
        page,
        pageSize,
        hasMore,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'),
    }
  }
}

/**
 * 레코드 생성
 */
export async function createRecord<T extends TableName>(
  table: T,
  data: TableInsert<T>
): Promise<{ data: TableRow<T> | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: insertedData, error } = await supabase.from(table).insert(data).select().single()

    if (error) {
      if (isRLSError(error)) {
        return {
          data: null,
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      return { data: null, error: error as Error }
    }

    return { data: insertedData as TableRow<T>, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'),
    }
  }
}

/**
 * 레코드 업데이트
 */
export async function updateRecord<T extends TableName>(
  table: T,
  id: string,
  updates: TableUpdate<T>
): Promise<{ data: TableRow<T> | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (isRLSError(error)) {
        return {
          data: null,
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      return { data: null, error: error as Error }
    }

    return { data: updatedData as TableRow<T>, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'),
    }
  }
}

/**
 * 레코드 삭제
 */
export async function deleteRecord<T extends TableName>(
  table: T,
  id: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)

    if (error) {
      if (isRLSError(error)) {
        return {
          error: new Error('권한이 없습니다. 로그인 상태를 확인해주세요.'),
        }
      }
      return { error: error as Error }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'),
    }
  }
}
