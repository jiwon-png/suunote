/**
 * AI 서비스 레이어
 * 텍스트를 AI로 처리하여 요약, 핵심 포인트, 학습 방향을 생성
 */

import type { AIProcessingRequest, AIProcessingResponse } from '@/domain/ai/types'

/**
 * 텍스트를 AI로 처리합니다.
 * 현재는 Mock 구현이며, 실제 AI API 연동 시 수정 필요합니다.
 * 
 * @param text 처리할 텍스트
 * @returns AI 처리 결과
 */
export async function processText(text: string): Promise<AIProcessingResponse> {
  // TODO: 실제 AI API 연동
  // 예: OpenAI API, Anthropic API 등
  
  // Mock 구현: 간단한 요약 생성
  // 실제 환경에서는 AI API를 호출하여 처리
  return new Promise((resolve) => {
    setTimeout(() => {
      // 간단한 Mock 응답
      const sentences = text.split(/[.!?]\s+/).filter(s => s.length > 10)
      const summary = sentences.slice(0, 3).join('. ') + '.'
      
      const keyPoints = sentences
        .slice(0, 5)
        .map((s, i) => `${i + 1}. ${s.substring(0, 100)}${s.length > 100 ? '...' : ''}`)
      
      resolve({
        summary: summary || '학습 내용을 요약한 내용입니다.',
        keyPoints: keyPoints.length > 0 ? keyPoints : ['핵심 내용을 정리해보세요.'],
        studyDirection: '추가 학습이 필요한 부분을 찾아 깊이 있게 공부해보세요.',
      })
    }, 1000) // 1초 지연 (실제 API 호출 시뮬레이션)
  })
}

// Legacy aiService 객체 (하위 호환성)
export const aiService = {
  processText,
}
