/**
 * Supabase Admin 클라이언트 (Service Role)
 * RLS를 우회하여 서버 전용 작업에 사용
 * API Route, Server Action 등에서만 사용
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceRoleKey) {
    throw new Error(
      '[createAdminClient] SUPABASE_SERVICE_ROLE 또는 NEXT_PUBLIC_SUPABASE_URL이 없습니다.'
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
