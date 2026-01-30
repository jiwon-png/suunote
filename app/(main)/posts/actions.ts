'use server'

import { createClient } from '@/lib/supabase/server'
import { getPostsPaginatedWithClient, type SearchPostsOptions } from '@/domain/posts/services/postService'
import type { Post } from '@/domain/posts/types'
import type { PaginatedResponse } from '@/types/api'

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
