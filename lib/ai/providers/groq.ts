/**
 * Groq AI Provider
 * 모델: llama-3.3-70b-versatile
 * 
 * ⚠️ 중요: generateObject는 반드시 Zod schema를 사용해야 합니다.
 * JSON Schema 객체를 전달하면 typeName undefined 에러가 발생합니다.
 */

import { groq } from '@ai-sdk/groq'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { AIPipelineResponse } from '@/domain/ai/types'

const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOKENS = 700 // 학습 요약만 생성 (summary, keyPoints, studyDirection)

/**
 * AI 파이프라인 응답을 위한 Zod Schema 정의
 * 
 * ❗ generateObject는 Zod schema를 기대하므로, 반드시 z.object() 형태로 정의해야 합니다.
 * JSON Schema 객체를 전달하면 내부적으로 typeName 속성을 읽으려 할 때 undefined가 되어 에러가 발생합니다.
 * 
 * 현재는 학습 요약만 생성 (quiz, timeline은 Phase 2에서 추가 예정)
 */
const AIPipelineResponseSchema = z.object({
  summary: z.string().describe('학습 내용의 핵심 요약 (간결하게)'),
  keyPoints: z
    .array(z.string())
    .max(7)
    .describe('핵심 포인트 목록 (최대 7개)'),
  studyDirection: z.string().describe('학습 방향 제안 (간결하게)'),
  quiz: z
    .array(
      z.object({
        question: z.string(),
        choices: z.array(z.string()).length(4), // 4지선다
        answerIndex: z.number().int().min(0).max(3), // 0-3
        explanation: z.string(),
      })
    )
    .max(0) // Phase 1: 생성하지 않음 (빈 배열)
    .describe('퀴즈 문제 (Phase 2에서 구현 예정)'),
  timeline: z
    .array(
      z.object({
        title: z.string(),
        order: z.number().int().positive(),
        detail: z.string(),
      })
    )
    .max(0) // Phase 1: 생성하지 않음 (빈 배열)
    .describe('타임라인 (Phase 2에서 구현 예정)'),
})

/**
 * Groq로 AI 파이프라인 실행
 */
export async function callGroqAI(
  content: string,
  systemPrompt: string
): Promise<{
  response: AIPipelineResponse
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  latencyMs: number
}> {
  const startTime = Date.now()

  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('GROQ_API_KEY 환경 변수가 설정되지 않았습니다.')
  }

  // 환경 변수를 명시적으로 설정 (Next.js 서버 환경에서 필요할 수 있음)
  // @ai-sdk/groq는 process.env.GROQ_API_KEY를 자동으로 읽음
  const originalApiKey = process.env.GROQ_API_KEY
  if (!originalApiKey || originalApiKey !== apiKey) {
    process.env.GROQ_API_KEY = apiKey
  }

  // ✅ Zod schema를 generateObject에 전달
  // ❌ 이전: JSON Schema 객체를 전달하여 typeName undefined 에러 발생
  // ✅ 현재: Zod schema (z.object)를 전달하여 타입 안정성과 런타임 검증 보장
  const result = await generateObject({
    model: groq(MODEL),
    system: systemPrompt,
    prompt: content,
    maxTokens: MAX_TOKENS,
    schema: AIPipelineResponseSchema, // Zod schema 전달
  })

  const latencyMs = Date.now() - startTime

  // Usage 정보 추출 (가능한 경우)
  const usage = result.usage
    ? {
        promptTokens: result.usage.promptTokens || 0,
        completionTokens: result.usage.completionTokens || 0,
        totalTokens: result.usage.totalTokens || 0,
      }
    : undefined

  return {
    response: result.object as AIPipelineResponse,
    usage,
    latencyMs,
  }
}
