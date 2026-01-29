/**
 * Post 서비스 레이어
 * Supabase를 통한 Posts 데이터 CRUD 작업
 */

import { createClient } from '@/lib/supabase/client'
import { postRowToDomain, aiResultRowToDomain, domainToPostAttachmentInsert } from '@/lib/utils/types'
import { getErrorMessage, logError } from '@/lib/utils/errors'
import { uploadFile, deleteFiles } from '@/lib/supabase/storage'
import { getFileType } from '@/lib/utils/file'
import type { Post, CreatePostData } from '@/domain/posts/types'
import type { Database, Json } from '@/types/database'
import type { PaginatedResponse } from '@/types/api'

type PostRow = Database['public']['Tables']['posts']['Row']
type AIResultRow = Database['public']['Tables']['ai_results']['Row']
type PostAttachmentRow = Database['public']['Tables']['post_attachments']['Row']

/**
 * 검색 옵션
 */
export interface SearchPostsOptions {
  query?: string
  subjectId?: string
  courseId?: string
}

/**
 * 사용자의 모든 Posts를 조회합니다.
 * ai_results 테이블과 LEFT JOIN하여 AI 결과도 함께 가져옵니다.
 * 
 * @param userId 사용자 ID
 * @param options 검색 및 필터 옵션
 * @returns Post 배열 (AI 결과 포함)
 */
export async function getPosts(
  userId: string,
  options?: SearchPostsOptions
): Promise<{ data: Post[] | null; error: Error | null }> {
  try {
    const supabase = createClient()

    // 쿼리 빌더 시작
    let query = supabase
      .from('posts')
      .select(`
        *,
        ai_results (*),
        post_attachments (*)
      `)
      .eq('user_id', userId)

    // 검색어 필터링 (Full-Text Search)
    if (options?.query && options.query.trim().length > 0) {
      const searchQuery = options.query.trim()
      // PostgreSQL Full-Text Search: title과 content에서 검색
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // Subject 필터링
    if (options?.subjectId) {
      query = query.eq('subject_id', options.subjectId)
    }

    // Course 필터링
    if (options?.courseId) {
      query = query.eq('course_id', options.courseId)
    }

    // 정렬 및 실행
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      logError(error, 'getPosts')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    if (!data) {
      return { data: [], error: null }
    }

    // Supabase Row 타입을 Domain 타입으로 변환
    const posts: Post[] = data.map((row: any) => {
      const postRow = row as PostRow
      const aiResultRow = row.ai_results?.[0] as AIResultRow | undefined
      const attachments = row.post_attachments as PostAttachmentRow[] | undefined

      return postRowToDomain(postRow, aiResultRow, attachments)
    })

    return { data: posts, error: null }
  } catch (error) {
    logError(error, 'getPosts')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 페이지네이션을 지원하는 Posts 조회 함수
 * ai_results와 post_attachments 테이블과 LEFT JOIN합니다.
 * 검색 및 필터 옵션도 지원합니다.
 * 
 * @param userId 사용자 ID
 * @param page 페이지 번호 (1부터 시작)
 * @param pageSize 페이지당 항목 수
 * @param options 검색 및 필터 옵션
 * @returns 페이지네이션된 Post 응답
 */
export async function getPostsPaginated(
  userId: string,
  page: number,
  pageSize: number,
  options?: SearchPostsOptions
): Promise<{ data: PaginatedResponse<Post> | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const offset = (page - 1) * pageSize

    // 전체 개수 조회 (필터 적용)
    let countQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 검색어 필터링
    if (options?.query && options.query.trim().length > 0) {
      const searchQuery = options.query.trim()
      countQuery = countQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // Subject 필터링
    if (options?.subjectId) {
      countQuery = countQuery.eq('subject_id', options.subjectId)
    }

    // Course 필터링
    if (options?.courseId) {
      countQuery = countQuery.eq('course_id', options.courseId)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      logError(countError, 'getPostsPaginated - count')
      return {
        data: null,
        error: new Error(getErrorMessage(countError)),
      }
    }

    // 데이터 조회 (JOIN 포함)
    let query = supabase
      .from('posts')
      .select(`
        *,
        ai_results (*),
        post_attachments (*)
      `)
      .eq('user_id', userId)

    // 검색어 필터링
    if (options?.query && options.query.trim().length > 0) {
      const searchQuery = options.query.trim()
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // Subject 필터링
    if (options?.subjectId) {
      query = query.eq('subject_id', options.subjectId)
    }

    // Course 필터링
    if (options?.courseId) {
      query = query.eq('course_id', options.courseId)
    }

    // 정렬, 페이지네이션 및 실행
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      logError(error, 'getPostsPaginated')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    if (!data) {
      const total = count ?? 0
      return {
        data: {
          data: [],
          page,
          pageSize,
          total,
          hasMore: false,
        },
        error: null,
      }
    }

    // Supabase Row 타입을 Domain 타입으로 변환
    const posts: Post[] = data.map((row: any) => {
      const postRow = row as PostRow
      const aiResultRow = row.ai_results?.[0] as AIResultRow | undefined
      const attachments = row.post_attachments as PostAttachmentRow[] | undefined

      return postRowToDomain(postRow, aiResultRow, attachments)
    })

    const total = count ?? 0
    const hasMore = offset + pageSize < total

    return {
      data: {
        data: posts,
        page,
        pageSize,
        total,
        hasMore,
      },
      error: null,
    }
  } catch (error) {
    logError(error, 'getPostsPaginated')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 단일 Post를 조회합니다.
 * ai_results와 post_attachments 테이블과 LEFT JOIN합니다.
 * 
 * @param postId Post ID
 * @param userId 사용자 ID (RLS 검증용)
 * @returns Post 또는 null
 */
export async function getPost(
  postId: string,
  userId: string
): Promise<{ data: Post | null; error: Error | null }> {
  try {
    const supabase = createClient()

    // posts 테이블과 ai_results, post_attachments 테이블 LEFT JOIN
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        ai_results (*),
        post_attachments (*)
      `)
      .eq('id', postId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 레코드를 찾을 수 없음
        return { data: null, error: null }
      }
      logError(error, 'getPost')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    if (!data) {
      return { data: null, error: null }
    }

    const postRow = data as PostRow & {
      ai_results?: AIResultRow[]
      post_attachments?: PostAttachmentRow[]
    }

    const aiResultRow = postRow.ai_results?.[0] as AIResultRow | undefined
    const attachments = postRow.post_attachments as PostAttachmentRow[] | undefined

    const post = postRowToDomain(postRow, aiResultRow, attachments)

    return { data: post, error: null }
  } catch (error) {
    logError(error, 'getPost')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * 새 Post를 생성합니다.
 * AI 처리 옵션이 활성화된 경우 AI 결과도 함께 저장합니다.
 * 
 * @param userId 사용자 ID
 * @param data Post 생성 데이터
 * @param processWithAI AI 처리 여부 (기본값: true)
 * @returns 생성된 Post (AI 결과 포함 가능)
 */
export async function createPost(
  userId: string,
  data: CreatePostData,
  processWithAI: boolean = true
): Promise<{ data: Post | null; error: Error | null }> {
  try {
    const supabase = createClient()

    // posts 테이블에 INSERT
    const { data: insertedData, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title: data.title,
        content: data.content,
        course_id: data.courseId ?? null,
        subject_id: data.subjectId ?? null,
        combined_content: data.content, // 초기값은 content와 동일
        ai_processed: false, // AI 처리 완료 전까지는 false
      })
      .select()
      .single()

    if (insertError) {
      logError(insertError, 'createPost')
      return {
        data: null,
        error: new Error(getErrorMessage(insertError)),
      }
    }

    const postId = insertedData.id
    let aiProcessed = false

    // 파일 첨부 처리
    if (data.attachments && data.attachments.length > 0) {
      const uploadPromises = data.attachments.map(async (file) => {
        // Storage 경로 생성: {userId}/{postId}/{fileName}
        const storagePath = `${userId}/${postId}/${file.name}`
        
        // 파일 업로드
        const { data: fileUrl, error: uploadError } = await uploadFile(
          'post-attachments',
          storagePath,
          file
        )

        if (uploadError || !fileUrl) {
          logError(uploadError || new Error('파일 업로드 실패'), 'createPost - file upload')
          return null
        }

        // 파일 타입 확인 (지원하지 않는 타입은 건너뛰기)
        const fileType = getFileType(file.name)
        if (fileType === 'other') {
          logError(new Error(`지원하지 않는 파일 형식: ${file.name}`), 'createPost - unsupported file type')
          return null
        }

        // post_attachments 테이블에 INSERT
        const attachmentData = domainToPostAttachmentInsert(postId, {
          fileName: file.name,
          fileType,
          fileUrl,
          fileSize: file.size,
        })

        const { error: attachmentError } = await supabase
          .from('post_attachments')
          .insert(attachmentData)

        if (attachmentError) {
          logError(attachmentError, 'createPost - attachment insert')
          // 업로드된 파일 삭제 (선택사항)
          return null
        }

        return { success: true }
      })

      // 모든 파일 업로드 완료 대기 (실패해도 Post 생성은 성공으로 처리)
      await Promise.allSettled(uploadPromises)
    }

    // AI 처리 옵션이 활성화된 경우 AI 처리 수행
    if (processWithAI) {
      try {
        const { processText } = await import('@/domain/ai/services/aiService')
        const aiResult = await processText(data.content)

        // ai_results 테이블에 INSERT
        const { error: aiError } = await supabase
          .from('ai_results')
          .insert({
            post_id: postId,
            summary: aiResult.summary,
            key_points: aiResult.keyPoints,
            study_direction: aiResult.studyDirection,
            raw_response: aiResult as unknown as Json, // JSONB로 저장
          })

        if (!aiError) {
          aiProcessed = true

          // posts 테이블의 ai_processed 플래그 업데이트
          await supabase
            .from('posts')
            .update({ ai_processed: true })
            .eq('id', postId)
        }
      } catch (aiError) {
        // AI 처리 실패는 Post 생성 실패로 처리하지 않음
        // Post는 생성되었지만 AI 결과는 없음
        logError(aiError, 'createPost - AI processing')
      }
    }

    // 최종 Post 데이터 조회 (AI 결과 포함)
    const { data: finalPostData, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        ai_results (*)
      `)
      .eq('id', postId)
      .single()

    if (fetchError) {
      // Post는 생성되었지만 조회 실패
      const post = postRowToDomain(insertedData as PostRow)
      return { data: post, error: null }
    }

    const postRow = finalPostData as PostRow & {
      ai_results?: AIResultRow[]
      post_attachments?: PostAttachmentRow[]
    }
    const aiResultRow = postRow.ai_results?.[0] as AIResultRow | undefined
    const attachments = postRow.post_attachments as PostAttachmentRow[] | undefined
    const post = postRowToDomain(postRow, aiResultRow, attachments)

    return { data: post, error: null }
  } catch (error) {
    logError(error, 'createPost')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Post를 수정합니다.
 * 
 * @param postId Post ID
 * @param userId 사용자 ID (RLS 검증용)
 * @param updates 수정할 데이터
 * @returns 수정된 Post
 */
export async function updatePost(
  postId: string,
  userId: string,
  updates: Partial<Pick<Post, 'title' | 'content' | 'courseId' | 'subjectId'>>
): Promise<{ data: Post | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.courseId !== undefined) updateData.course_id = updates.courseId ?? null
    if (updates.subjectId !== undefined) updateData.subject_id = updates.subjectId ?? null

    const { data: updatedData, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logError(error, 'updatePost')
      return {
        data: null,
        error: new Error(getErrorMessage(error)),
      }
    }

    const post = postRowToDomain(updatedData as PostRow)

    return { data: post, error: null }
  } catch (error) {
    logError(error, 'updatePost')
    return {
      data: null,
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Post를 삭제합니다.
 * CASCADE로 연관된 ai_results, post_attachments도 자동 삭제됩니다.
 * Storage의 첨부 파일도 함께 삭제합니다.
 * 
 * @param postId Post ID
 * @param userId 사용자 ID (RLS 검증용)
 * @returns 성공 여부
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    // 먼저 첨부 파일 목록 조회 (Storage 파일 삭제용)
    const { data: attachments } = await supabase
      .from('post_attachments')
      .select('file_url')
      .eq('post_id', postId)

    // Storage 파일 경로 생성: {userId}/{postId}/{fileName}
    // file_url에서 파일명 추출하여 경로 재구성
    const storagePaths: string[] = []
    if (attachments && attachments.length > 0) {
      attachments.forEach((att: Pick<PostAttachmentRow, 'file_url'>) => {
        // file_url에서 파일명 추출 (예: https://.../{fileName})
        const url = att.file_url
        const fileNameMatch = url.match(/\/([^\/]+)$/)
        if (fileNameMatch) {
          const fileName = fileNameMatch[1]
          const storagePath = `${userId}/${postId}/${fileName}`
          storagePaths.push(storagePath)
        }
      })
    }

    // Post 삭제 (CASCADE로 post_attachments도 자동 삭제됨)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId)

    if (error) {
      logError(error, 'deletePost')
      return {
        error: new Error(getErrorMessage(error)),
      }
    }

    // Storage 파일 삭제 (Post 삭제 성공 후)
    if (storagePaths.length > 0) {
      // Storage 파일 삭제 (실패해도 Post 삭제는 이미 완료되었으므로 로깅만)
      const { error: storageError } = await deleteFiles('post-attachments', storagePaths)
      if (storageError) {
        logError(storageError, 'deletePost - storage cleanup')
        // Storage 삭제 실패는 Post 삭제 실패로 처리하지 않음
      }
    }

    return { error: null }
  } catch (error) {
    logError(error, 'deletePost')
    return {
      error: new Error(getErrorMessage(error)),
    }
  }
}

/**
 * Posts를 검색합니다.
 * Full-Text Search를 사용하여 제목과 내용에서 검색합니다.
 * 
 * @param userId 사용자 ID
 * @param searchQuery 검색어
 * @param options 추가 필터 옵션
 * @returns Post 배열
 */
export async function searchPosts(
  userId: string,
  searchQuery: string,
  options?: Omit<SearchPostsOptions, 'query'>
): Promise<{ data: Post[] | null; error: Error | null }> {
  return getPosts(userId, {
    query: searchQuery,
    ...options,
  })
}

// Legacy postService 객체 (하위 호환성)
export const postService = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
}
