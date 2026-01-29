/**
 * Supabase Realtime 유틸리티
 * Post 변경사항을 실시간으로 구독하는 함수들
 */

import { createClient } from './client'
import { isMockMode } from './client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { postRowToDomain } from '@/lib/utils/types'
import type { Post } from '@/domain/posts/types'

type PostRow = Database['public']['Tables']['posts']['Row']

/**
 * Post 변경 이벤트 타입
 */
export type PostChangeEvent = 
  | { type: 'INSERT'; new: Post }
  | { type: 'UPDATE'; new: Post; old: Post }
  | { type: 'DELETE'; old: Post }

/**
 * Post 변경 콜백 함수 타입
 */
export type PostChangeCallback = (event: PostChangeEvent) => void

/**
 * 사용자의 Posts 변경사항을 실시간으로 구독합니다.
 * 
 * @param userId 사용자 ID
 * @param callback 변경사항 발생 시 호출될 콜백 함수
 * @returns Realtime 채널 (구독 해제용)
 */
export function subscribeToPosts(
  userId: string,
  callback: PostChangeCallback
): RealtimeChannel | null {
  // Mock 모드에서는 Realtime 구독을 지원하지 않음
  if (isMockMode()) {
    console.warn('Realtime subscriptions are not supported in mock mode')
    return null
  }

  const supabase = createClient()

  // posts 테이블 변경사항 구독
  const channel = supabase
    .channel(`posts:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE 모두 구독
        schema: 'public',
        table: 'posts',
        filter: `user_id=eq.${userId}`, // 해당 사용자의 Post만 구독
      },
      async (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
        try {
          if (payload.eventType === 'INSERT' && payload.new) {
            // 새 Post 생성
            const postRow = payload.new as PostRow
            
            // ai_results와 post_attachments를 가져오기 위해 추가 조회 필요
            // 하지만 실시간 이벤트에서는 기본 정보만 전달되므로,
            // 필요시 별도로 조회하거나 기본값 사용
            const post = postRowToDomain(postRow, undefined, undefined)
            
            callback({
              type: 'INSERT',
              new: post,
            })
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Post 수정
            const postRow = payload.new as PostRow
            const oldPostRow = payload.old as PostRow
            
            const newPost = postRowToDomain(postRow, undefined, undefined)
            const oldPost = postRowToDomain(oldPostRow, undefined, undefined)
            
            callback({
              type: 'UPDATE',
              new: newPost,
              old: oldPost,
            })
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Post 삭제
            const postRow = payload.old as PostRow
            const post = postRowToDomain(postRow, undefined, undefined)
            
            callback({
              type: 'DELETE',
              old: post,
            })
          }
        } catch (error) {
          console.error('Error processing realtime event:', error)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Realtime 채널 구독을 해제합니다.
 * 
 * @param channel 구독 해제할 채널
 */
export function unsubscribeFromPosts(channel: RealtimeChannel | null): void {
  if (!channel) {
    return
  }

  const supabase = createClient()
  supabase.removeChannel(channel)
}
