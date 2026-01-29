import { AIResult } from '@/domain/ai/types'

/**
 * 학습 노트 (Post)
 * DB 테이블: public.posts
 */
export interface Post {
  id: string
  userId: string
  courseId?: string
  subjectId?: string
  title: string
  content: string
  combinedContent?: string
  aiProcessed: boolean
  createdAt: Date
  updatedAt: Date
  // 관계 데이터 (JOIN 결과)
  aiResult?: AIResult
  attachments?: PostAttachment[]
}

/**
 * 학습 노트 첨부 파일
 * DB 테이블: public.post_attachments
 */
export interface PostAttachment {
  id: string
  postId: string
  fileName: string
  fileType: 'pdf' | 'image' | 'audio' | 'video'
  fileUrl: string
  fileSize?: number
  extractedText?: string
  createdAt: Date
}

/**
 * 학습 노트 생성 데이터
 */
export interface CreatePostData {
  title: string
  content: string
  courseId?: string
  subjectId?: string
  attachments?: File[]
}

/**
 * UI 카드용 Post ViewModel
 */
export interface PostCardModel {
  id: string
  title: string
  createdAt: Date
  aiProcessed: boolean
  subjectId?: string
  courseId?: string
}
