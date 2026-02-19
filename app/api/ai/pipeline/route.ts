/**
 * AI 파이프라인 API Route
 * POST /api/ai/pipeline
 *
 * 입력:
 * {
 *   postId: string,
 *   providerMode: "auto" | "google" | "groq",
 *   category: "pipeline",
 *   content: string
 * }
 */
export const runtime = 'nodejs'
// Vercel: AI 호출(Google/Groq)에 10초 이상 소요 → 기본 10초 타임아웃 방지
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAIPipeline, type ProviderMode } from '@/lib/ai/providers'
import type { AIPipelineResponse } from '@/domain/ai/types'
import type { Database, Json } from '@/types/database'

type AIResponseRow = Database['public']['Tables']['ai_responses']['Row']
type AIResultRow = Database['public']['Tables']['ai_results']['Row']
type PostAttachmentRow = Database['public']['Tables']['post_attachments']['Row']

interface PipelineRequest {
  postId: string
  providerMode?: ProviderMode
  category?: string
  content: string
}

/**
 * POST /api/ai/pipeline
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 본문 파싱
    const body: PipelineRequest = await request.json()
    const { postId, providerMode = 'auto', content } = body

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'postId와 content는 필수입니다.' },
        { status: 400 }
      )
    }

    // 2. 환경 변수 체크
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GENERATIVE_AI_API_KEY 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const groqKey = process.env.GROQ_API_KEY?.trim()
    if ((providerMode === 'groq' || providerMode === 'auto') && !groqKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY 환경 변수가 설정되지 않았습니다. (groq/auto 모드 사용 시 필요)' },
        { status: 500 }
      )
    }

    // 3. Supabase: auth 있으면 server, 없으면 admin(RLS 우회) 사용
    let supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let userId: string | null = user?.id || null

    // 4. Post 존재 확인 (RLS로 차단될 수 있으므로 실패 시 admin으로 재시도)
    let postRow: { id: string; user_id: string } | null = null
    const { data: serverPost, error: serverPostError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .single()

    if (!serverPostError && serverPost) {
      postRow = serverPost
      if (userId && postRow.user_id !== userId) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
      }
      if (!userId) userId = postRow.user_id
    }

    if (!postRow) {
      try {
        const admin = createAdminClient()
        const { data: adminPost, error: adminErr } = await admin
          .from('posts')
          .select('id, user_id')
          .eq('id', postId)
          .single()

        if (adminErr || !adminPost) {
          return NextResponse.json({ error: 'Post를 찾을 수 없습니다.' }, { status: 404 })
        }
        postRow = adminPost
        userId = adminPost.user_id
        supabase = admin
      } catch {
        return NextResponse.json({ error: 'Post를 찾을 수 없습니다.' }, { status: 404 })
      }
    }

    // 5. 첨부파일에서 extracted_text 가져오기 (있는 경우)
    const { data: attachments } = await supabase
      .from('post_attachments')
      .select('extracted_text')
      .eq('post_id', postId)
      .not('extracted_text', 'is', null)

    // combined_content 생성: content + 첨부파일 extracted_text
    // 토큰 절약을 위해 입력 텍스트 길이 제한 (약 2000자, 대략 500-800 토큰)
    const MAX_INPUT_LENGTH = 2000
    let combinedContent = content
    if (attachments && attachments.length > 0) {
      const extractedTexts = (attachments as Pick<PostAttachmentRow, 'extracted_text'>[])
        .map((att) => att.extracted_text)
        .filter((text): text is string => text !== null && text.trim().length > 0)
        .join('\n\n')

      if (extractedTexts) {
        combinedContent = `${content}\n\n--- 첨부파일 내용 ---\n\n${extractedTexts}`
      }
    }
    
    // 입력 텍스트가 너무 길면 앞부분만 사용 (토큰 절약)
    if (combinedContent.length > MAX_INPUT_LENGTH) {
      const originalLength = content.length + ((attachments as Pick<PostAttachmentRow, 'extracted_text'>[] | null)?.reduce((sum: number, att) => {
        const text = att.extracted_text
        return sum + (text?.length || 0)
      }, 0) || 0)
      combinedContent = combinedContent.substring(0, MAX_INPUT_LENGTH) + '\n\n[... 내용이 길어 일부만 사용되었습니다 ...]'
      console.log(`[AI Pipeline] 입력 텍스트가 ${combinedContent.length}자로 제한되었습니다. (원본: ${originalLength}자)`)
    }

    // 6. AI 파이프라인 실행
    let aiResult: AIPipelineResponse
    let providerUsed: 'google' | 'groq'
    let model: string
    let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined
    let latencyMs: number

    try {
      const result = await callAIPipeline(combinedContent, providerMode)
      aiResult = result.response
      providerUsed = result.providerUsed
      model = result.model
      usage = result.usage
      latencyMs = result.latencyMs

      // 콘솔 로그
      console.log('[AI Pipeline API] 성공:', {
        provider: providerUsed,
        model,
        latencyMs,
        tokens: usage?.totalTokens,
        postId,
      })
    } catch (aiError) {
      console.error('[AI Pipeline API] AI 호출 실패:', aiError)

      // Google quota exceeded 감지
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
      if (
        errorMessage.toLowerCase().includes('quota') ||
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('429')
      ) {
        return NextResponse.json(
          {
            error: '구글 할당량이 초과되었습니다. Groq 엔진으로 변경하여 시도해 보세요.',
            code: 'QUOTA_EXCEEDED',
          },
          { status: 429 }
        )
      }

      // 공통 rate-limit/quota
      if (errorMessage.toLowerCase().includes('429')) {
        return NextResponse.json(
          {
            error: '잠시 후 다시 시도해 주세요',
            code: 'RATE_LIMIT',
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: '요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
          code: 'AI_ERROR',
          details: errorMessage, // 디버깅용 상세 정보
        },
        { status: 500 }
      )
    }

    // 7. DB 저장: ai_responses (호출 로그)
    const aiResponseData: Omit<AIResponseRow, 'id' | 'created_at'> = {
      post_id: postId,
      user_id: userId,
      category: 'pipeline',
      provider: providerUsed,
      model,
      prompt: combinedContent.substring(0, 10000), // 최대 10KB
      response: aiResult as unknown as Json,
      prompt_tokens: usage?.promptTokens || null,
      completion_tokens: usage?.completionTokens || null,
      total_tokens: usage?.totalTokens || null,
      latency_ms: latencyMs,
    }

    let dbSaveError: string | null = null

    const { error: responseInsertError } = await supabase
      .from('ai_responses')
      .insert(aiResponseData)

    if (responseInsertError) {
      console.error('[AI Pipeline API] ai_responses 저장 실패:', responseInsertError)
      dbSaveError = 'AI 호출 로그 저장에 실패했습니다.'
    }

    // 8. DB 저장: ai_results (upsert)
    const aiResultData: Partial<AIResultRow> = {
      post_id: postId,
      summary: aiResult.summary,
      key_points: aiResult.keyPoints as unknown as Json,
      study_direction: aiResult.studyDirection,
      quiz: aiResult.quiz as unknown as Json,
      timeline: aiResult.timeline as unknown as Json,
      raw_response: aiResult as unknown as Json,
      provider: providerUsed, // Provider 정보 저장
      model: model, // Model 정보 저장
    }

    console.log('[AI Pipeline API] ai_results 저장 시도:', {
      postId,
      summary: aiResult.summary?.substring(0, 50),
      keyPointsCount: aiResult.keyPoints?.length ?? 0,
      studyDirection: aiResult.studyDirection?.substring(0, 50),
      provider: providerUsed,
      model,
    })

    const { error: resultUpsertError, data: upsertedData } = await supabase
      .from('ai_results')
      .upsert(
        {
          post_id: postId,
          ...aiResultData,
        },
        {
          onConflict: 'post_id',
        }
      )
      .select()

    if (resultUpsertError) {
      console.error('[AI Pipeline API] ai_results 저장 실패:', resultUpsertError)
      dbSaveError = 'AI 결과 저장에 실패했습니다. 다시 시도해 주세요.'
    } else {
      console.log('[AI Pipeline API] ai_results 저장 성공:', {
        postId,
        upsertedCount: upsertedData?.length ?? 0,
        upsertedData: upsertedData?.[0] ? {
          id: upsertedData[0].id,
          summary: upsertedData[0].summary?.substring(0, 50),
        } : null,
      })
    }

    // 9. posts 테이블의 ai_processed 플래그 업데이트
    const { error: updateProcessedError } = await supabase
      .from('posts')
      .update({ ai_processed: true })
      .eq('id', postId)

    if (updateProcessedError) {
      console.error('[AI Pipeline API] ai_processed 플래그 업데이트 실패:', updateProcessedError)
      // 에러가 발생해도 AI 결과는 저장되었으므로 계속 진행
    } else {
      console.log('[AI Pipeline API] ai_processed 플래그 업데이트 완료:', { postId })
    }

    // 10. 응답 반환
    return NextResponse.json({
      success: true,
      providerUsed,
      model,
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      studyDirection: aiResult.studyDirection,
      quiz: aiResult.quiz,
      timeline: aiResult.timeline,
      usage,
      latencyMs,
      dbSaved: !resultUpsertError && !responseInsertError, // DB 저장 성공 여부
      dbSaveError: dbSaveError || undefined, // DB 저장 실패 시 에러 메시지
    })
  } catch (error) {
    console.error('[AI Pipeline API] 예외 발생:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  }
}
