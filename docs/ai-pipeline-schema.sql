-- ============================================
-- AI 파이프라인 DB 스키마 업데이트
-- SSU-Note AI 처리 로그 및 결과 저장
-- ============================================

-- ============================================
-- 1. ai_responses 테이블 생성 (모든 AI 호출 로그/캐시)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('summary', 'quiz', 'timeline', 'pipeline')),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'groq')),
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_created 
  ON public.ai_responses(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_responses_post_created 
  ON public.ai_responses(post_id, created_at DESC) 
  WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_responses_category_created 
  ON public.ai_responses(category, created_at DESC);

-- RLS 활성화
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI responses"
  ON public.ai_responses FOR SELECT
  USING (
    user_id IS NULL OR 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = ai_responses.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create AI responses for own posts"
  ON public.ai_responses FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = ai_responses.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- ============================================
-- 2. ai_results 테이블 확장 (quiz/timeline/provider 컬럼 추가)
-- ============================================
ALTER TABLE public.ai_results 
  ADD COLUMN IF NOT EXISTS quiz JSONB,
  ADD COLUMN IF NOT EXISTS timeline JSONB,
  ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('google', 'groq')),
  ADD COLUMN IF NOT EXISTS model TEXT;

-- 기존 컬럼 설명 업데이트 (선택사항)
COMMENT ON COLUMN public.ai_results.quiz IS '퀴즈 데이터 (JSONB 배열)';
COMMENT ON COLUMN public.ai_results.timeline IS '타임라인 데이터 (JSONB 배열)';
COMMENT ON COLUMN public.ai_results.provider IS '사용된 AI Provider (google/groq)';
COMMENT ON COLUMN public.ai_results.model IS '사용된 AI 모델명';

-- ============================================
-- 완료
-- ============================================
-- ai_responses 테이블과 인덱스, RLS 정책이 생성되었습니다.
-- ai_results 테이블에 quiz/timeline 컬럼이 추가되었습니다.
