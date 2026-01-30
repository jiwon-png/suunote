/**
 * AI Provider 통합 모듈
 * Auto fallback 로직 포함 (Google -> Groq)
 */

import { callGoogleAI } from './google'
import { callGroqAI } from './groq'
import type { AIPipelineResponse } from '@/domain/ai/types'

export type ProviderMode = 'auto' | 'google' | 'groq'

export interface AIProviderResult {
  response: AIPipelineResponse
  providerUsed: 'google' | 'groq'
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  latencyMs: number
}

const SYSTEM_PROMPT = `당신은 학습 내용을 분석하는 AI 어시스턴트입니다.
주어진 학습 내용을 바탕으로 다음을 생성해주세요:

1. **요약** (summary): 핵심만 간결하게 (50-100자)
2. **핵심 포인트** (keyPoints): 최대 7개, 각 포인트는 간결하게 (10-20자)
3. **학습 방향** (studyDirection): 다음 학습을 위한 구체적 제안 (30-50자로 매우 간결하게, 절대 50자 초과 금지)
4. **퀴즈** (quiz): 빈 배열 [] (Phase 2에서 구현 예정)
5. **타임라인** (timeline): 빈 배열 [] (Phase 2에서 구현 예정)

**JSON 구조 (반드시 이 형식을 정확히 따라야 합니다):**
{
  "summary": "간결한 요약 텍스트 (50-100자)",
  "keyPoints": ["포인트1", "포인트2", "포인트3"],
  "studyDirection": "학습 방향 제안 (30-50자, 매우 간결하게)",
  "quiz": [],
  "timeline": []
}

**중요**: 
- 불필요한 수식이나 장문 금지
- 핵심만 간결하게 작성
- 반드시 영어 키 이름을 사용하세요: summary, keyPoints, studyDirection, quiz, timeline
- studyDirection은 반드시 30-50자 이내로 작성하세요 (50자 초과 금지)
- quiz와 timeline은 반드시 빈 배열 []로 반환하세요 (Phase 2에서 구현 예정)
- JSON 형식으로 구조화된 응답 필수
- 모든 필드를 완전히 생성하세요 (중간에 끊기지 않도록)
- studyDirection은 짧고 명확하게 작성하세요 (예: "사고 원인 분석 및 예방 대책 학습")`

/**
 * Google AI 호출 시 발생할 수 있는 에러 타입 체크
 */
function isGoogleErrorRetryable(error: unknown): boolean {
  if (!error) return false

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = errorMessage.toLowerCase()

  // Quota/Rate limit 관련 에러
  if (
    errorString.includes('quota') ||
    errorString.includes('rate limit') ||
    errorString.includes('429') ||
    errorString.includes('resource exhausted')
  ) {
    return true
  }

  // 5xx 서버 에러
  if (
    errorString.includes('500') ||
    errorString.includes('503') ||
    errorString.includes('502') ||
    errorString.includes('504')
  ) {
    return true
  }

  // 타임아웃
  if (errorString.includes('timeout') || errorString.includes('timed out')) {
    return true
  }

  return false
}

/**
 * AI 파이프라인 실행 (Provider 선택 및 Auto fallback)
 */
export async function callAIPipeline(
  content: string,
  providerMode: ProviderMode = 'auto'
): Promise<AIProviderResult> {
  // Auto 모드: Google 먼저 시도, 실패 시 Groq로 fallback
  if (providerMode === 'auto') {
    try {
      console.log('[AI Pipeline] Google로 시도 중...')
      const googleResult = await callGoogleAI(content, SYSTEM_PROMPT)
      
      console.log('[AI Pipeline] Google 성공:', {
        provider: 'google',
        model: 'gemini-2.5-flash',
        latencyMs: googleResult.latencyMs,
        tokens: googleResult.usage?.totalTokens,
      })

      return {
        response: googleResult.response,
        providerUsed: 'google',
        model: 'gemini-2.5-flash',
        usage: googleResult.usage,
        latencyMs: googleResult.latencyMs,
      }
    } catch (error) {
      // Google 실패 시 Groq로 fallback
      if (isGoogleErrorRetryable(error)) {
        console.warn('[AI Pipeline] Google 실패, Groq로 fallback:', error)
        
        try {
          const groqResult = await callGroqAI(content, SYSTEM_PROMPT)
          
          console.log('[AI Pipeline] Groq fallback 성공:', {
            provider: 'groq',
            model: 'llama-3.3-70b-versatile',
            latencyMs: groqResult.latencyMs,
            tokens: groqResult.usage?.totalTokens,
          })

          return {
            response: groqResult.response,
            providerUsed: 'groq',
            model: 'llama-3.3-70b-versatile',
            usage: groqResult.usage,
            latencyMs: groqResult.latencyMs,
          }
        } catch (groqError) {
          console.error('[AI Pipeline] Groq fallback도 실패:', groqError)
          throw new Error(
            `Google과 Groq 모두 실패했습니다. Google: ${error instanceof Error ? error.message : String(error)}, Groq: ${groqError instanceof Error ? groqError.message : String(groqError)}`
          )
        }
      } else {
        // 재시도 불가능한 에러 (예: API 키 없음)
        throw error
      }
    }
  }

  // 특정 Provider 지정 모드
  if (providerMode === 'google') {
    const result = await callGoogleAI(content, SYSTEM_PROMPT)
    return {
      response: result.response,
      providerUsed: 'google',
      model: 'gemini-2.5-flash',
      usage: result.usage,
      latencyMs: result.latencyMs,
    }
  }

  if (providerMode === 'groq') {
    const result = await callGroqAI(content, SYSTEM_PROMPT)
    return {
      response: result.response,
      providerUsed: 'groq',
      model: 'llama-3.3-70b-versatile',
      usage: result.usage,
      latencyMs: result.latencyMs,
    }
  }

  throw new Error(`지원하지 않는 provider 모드: ${providerMode}`)
}
