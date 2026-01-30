/**
 * 타입 변환 유틸리티 함수
 * Supabase Row 타입을 Domain Entity 타입으로 변환
 */

import { Database, Json } from '@/types/database'
import { Post, PostAttachment } from '@/domain/posts/types'
import { Subject, Course } from '@/domain/courses/types'
import { AIResult } from '@/domain/ai/types'

// Supabase Row 타입 별칭
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type SubjectRow = Database['public']['Tables']['subjects']['Row']
type CourseRow = Database['public']['Tables']['courses']['Row']
type PostRow = Database['public']['Tables']['posts']['Row']
type AIResultRow = Database['public']['Tables']['ai_results']['Row']
type PostAttachmentRow = Database['public']['Tables']['post_attachments']['Row']

// Supabase Insert 타입 별칭
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert']
export type CourseInsert = Database['public']['Tables']['courses']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type AIResultInsert = Database['public']['Tables']['ai_results']['Insert']
export type PostAttachmentInsert = Database['public']['Tables']['post_attachments']['Insert']

// Supabase Update 타입 별칭
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update']
export type CourseUpdate = Database['public']['Tables']['courses']['Update']
export type PostUpdate = Database['public']['Tables']['posts']['Update']
export type AIResultUpdate = Database['public']['Tables']['ai_results']['Update']
export type PostAttachmentUpdate = Database['public']['Tables']['post_attachments']['Update']

/**
 * Profile 변환 함수
 */
export function profileRowToDomain(row: ProfileRow) {
  return {
    id: row.id,
    email: row.email ?? undefined,
    fullName: row.full_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Subject 변환 함수
 */
export function subjectRowToDomain(row: SubjectRow): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug ?? undefined,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Course 변환 함수
 */
export function courseRowToDomain(row: CourseRow): Course {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    courseDate: row.course_date ? new Date(row.course_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Post 변환 함수 (AI Result 및 Attachments 포함 가능)
 */
export function postRowToDomain(
  row: PostRow,
  aiResult?: AIResultRow | null,
  attachments?: PostAttachmentRow[]
): Post {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id ?? undefined,
    subjectId: row.subject_id ?? undefined,
    title: row.title,
    content: row.content,
    combinedContent: row.combined_content ?? undefined,
    aiProcessed: row.ai_processed,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    aiResult: aiResult ? aiResultRowToDomain(aiResult) : undefined,
    attachments: attachments
      ? attachments.map((att) => postAttachmentRowToDomain(att))
      : undefined,
  }
}

/**
 * AI Result 변환 함수
 */
export function aiResultRowToDomain(row: AIResultRow): AIResult {
  // quiz 파싱
  let quiz: AIResult['quiz'] = undefined
  if (row.quiz) {
    if (Array.isArray(row.quiz)) {
      quiz = row.quiz as AIResult['quiz']
    } else if (typeof row.quiz === 'object') {
      // JSONB 객체인 경우 배열로 변환 시도
      quiz = [row.quiz] as AIResult['quiz']
    }
  }

  // timeline 파싱
  let timeline: AIResult['timeline'] = undefined
  if (row.timeline) {
    if (Array.isArray(row.timeline)) {
      timeline = row.timeline as AIResult['timeline']
    } else if (typeof row.timeline === 'object') {
      // JSONB 객체인 경우 배열로 변환 시도
      timeline = [row.timeline] as AIResult['timeline']
    }
  }

  return {
    id: row.id,
    postId: row.post_id,
    summary: row.summary ?? undefined,
    keyPoints: Array.isArray(row.key_points)
      ? (row.key_points as string[])
      : row.key_points
      ? [String(row.key_points)]
      : undefined,
    studyDirection: row.study_direction ?? undefined,
    quiz,
    timeline,
    provider: (row.provider as 'google' | 'groq' | undefined) ?? undefined,
    model: row.model ?? undefined,
    rawResponse: row.raw_response as Record<string, unknown> | undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Post Attachment 변환 함수
 */
export function postAttachmentRowToDomain(
  row: PostAttachmentRow
): PostAttachment {
  return {
    id: row.id,
    postId: row.post_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileUrl: row.file_url,
    fileSize: row.file_size ?? undefined,
    extractedText: row.extracted_text ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

/**
 * Domain Entity를 Supabase Insert 타입으로 변환
 */

export function domainToPostInsert(
  userId: string,
  data: {
    title: string
    content: string
    courseId?: string
    subjectId?: string
    combinedContent?: string
    aiProcessed?: boolean
  }
): PostInsert {
  return {
    user_id: userId,
    title: data.title,
    content: data.content,
    course_id: data.courseId ?? null,
    subject_id: data.subjectId ?? null,
    combined_content: data.combinedContent ?? null,
    ai_processed: data.aiProcessed ?? false,
  }
}

export function domainToAIResultInsert(
  postId: string,
  data: {
    summary?: string
    keyPoints?: string[]
    studyDirection?: string
    rawResponse?: Record<string, unknown>
  }
): AIResultInsert {
  return {
    post_id: postId,
    summary: data.summary ?? null,
    key_points: data.keyPoints ?? null,
    study_direction: data.studyDirection ?? null,
    raw_response: (data.rawResponse ?? null) as Json | null,
  }
}

export function domainToSubjectInsert(
  userId: string,
  data: {
    name: string
    slug?: string
    color: string
    sortOrder?: number
  }
): SubjectInsert {
  return {
    user_id: userId,
    name: data.name,
    slug: data.slug ?? null,
    color: data.color,
    sort_order: data.sortOrder ?? 0,
  }
}

export function domainToCourseInsert(
  userId: string,
  data: {
    subjectId?: string
    title: string
    description?: string
    courseDate?: Date
  }
): CourseInsert {
  return {
    user_id: userId,
    subject_id: data.subjectId ?? null,
    title: data.title,
    description: data.description ?? null,
    course_date: data.courseDate?.toISOString().split('T')[0] ?? null,
  }
}

export function domainToPostAttachmentInsert(
  postId: string,
  data: {
    fileName: string
    fileType: 'pdf' | 'image' | 'audio' | 'video'
    fileUrl: string
    fileSize?: number
    extractedText?: string
  }
): PostAttachmentInsert {
  return {
    post_id: postId,
    file_name: data.fileName,
    file_type: data.fileType,
    file_url: data.fileUrl,
    file_size: data.fileSize ?? null,
    extracted_text: data.extractedText ?? null,
  }
}
