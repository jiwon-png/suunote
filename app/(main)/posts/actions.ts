'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getPostsPaginatedWithClient,
  createPostWithClient,
  type SearchPostsOptions,
} from '@/domain/posts/services/postService'
import type { Post } from '@/domain/posts/types'
import type { PaginatedResponse } from '@/types/api'

/**
 * Server Action: Post 생성 (서버에서 Supabase 호출 → 무한 로딩 방지)
 * Admin 클라이언트 사용: Vercel에서 쿠키 기반 server client가 응답 지연/실패할 수 있어
 * RLS 우회로 안정적 연결 보장
 */
export async function createPostAction(
  formDataOrUserId: FormData | string,
  data?: { title: string; content: string; subjectId?: string; courseId?: string }
): Promise<{ data: Post | null; error: Error | null }> {
  const supabase = createAdminClient()
  let userId: string
  let postData: { title: string; content: string; subjectId?: string; courseId?: string }
  let attachments: File[] = []

  if (formDataOrUserId instanceof FormData) {
    const fd = formDataOrUserId
    userId = (fd.get('userId') as string) ?? ''
    postData = {
      title: (fd.get('title') as string) ?? '',
      content: (fd.get('content') as string) ?? '',
      subjectId: (fd.get('subjectId') as string) || undefined,
      courseId: (fd.get('courseId') as string) || undefined,
    }
    attachments = (fd.getAll('files') as File[]).filter(Boolean)
  } else {
    if (!data) {
      return { data: null, error: new Error('잘못된 인자입니다.') }
    }
    userId = formDataOrUserId
    postData = data
  }

  return createPostWithClient(supabase, userId, postData, attachments.length > 0 ? attachments : undefined)
}

/**
 * Server Action: 페이지네이션 Posts 조회
 * 서버의 createClient(런타임 env)를 사용하므로, Vercel Production에서도 환경 변수가 정상 적용됨.
 */
export async function getPostsPaginatedAction(
  userId: string,
  page: number,
  pageSize: number,
  options?: SearchPostsOptions
): Promise<{ data: PaginatedResponse<Post> | null; error: Error | null }> {
  const supabase = await createClient()
  return getPostsPaginatedWithClient(supabase, userId, page, pageSize, options)
}
