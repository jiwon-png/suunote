# AI 파이프라인 설정 가이드

## 📋 개요

SSU-Note의 AI 파이프라인은 학습글 작성 후 AI로 요약/핵심포인트/학습방향/퀴즈/타임라인을 자동 생성합니다.

## 🔧 설치 및 설정

### 1. 패키지 설치

```bash
npm install ai @ai-sdk/google @ai-sdk/groq
```

또는

```bash
pnpm add ai @ai-sdk/google @ai-sdk/groq
```

### 2. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Google Gemini API Key (필수)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Groq API Key (선택사항, auto 모드 fallback용)
GROQ_API_KEY=your_groq_api_key_here
```

#### API 키 발급 방법

**Google Gemini:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성
3. `.env.local`에 추가

**Groq:**
1. [Groq Console](https://console.groq.com/) 접속
2. API 키 생성
3. `.env.local`에 추가 (선택사항)

### 3. 데이터베이스 스키마 업데이트

Supabase SQL Editor에서 다음 파일을 실행하세요:

```sql
-- docs/ai-pipeline-schema.sql 파일 내용 실행
```

또는 직접 실행:

```sql
-- ai_responses 테이블 생성
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

-- ai_results 테이블 확장
ALTER TABLE public.ai_results 
  ADD COLUMN IF NOT EXISTS quiz JSONB,
  ADD COLUMN IF NOT EXISTS timeline JSONB;
```

## 🚀 사용 방법

### 1. 학습글 작성 시 AI 처리

1. `/posts/new` 페이지에서 학습글 작성
2. "AI 요약 생성" 체크박스 활성화
3. AI 엔진 선택:
   - **auto (권장)**: Google 기본 사용, 할당량 초과 시 Groq로 자동 전환
   - **google**: Google Gemini만 사용
   - **groq**: Groq Llama만 사용
4. "AI 요약 생성" 버튼 클릭

### 2. AI 결과 확인

생성된 학습글 상세 페이지(`/posts/[id]`)에서 다음을 확인할 수 있습니다:

- **요약**: 학습 내용의 핵심 요약
- **핵심 포인트**: 최대 7개의 핵심 포인트
- **학습 방향 제안**: 다음 학습을 위한 구체적 제안
- **복습 퀴즈**: 객관식 4지선다 문제 (최대 5문항)
- **학습 타임라인**: 학습 순서/단계 (최대 6개 아이템)

## 📊 AI 파이프라인 아키텍처

```
학습글 작성
  ↓
Post 저장 (posts 테이블)
  ↓
AI 파이프라인 API 호출 (/api/ai/pipeline)
  ↓
Provider 선택 (Google/Groq/Auto)
  ↓
AI 처리 (요약/핵심포인트/학습방향/퀴즈/타임라인)
  ↓
DB 저장
  ├─ ai_responses (호출 로그)
  └─ ai_results (결과 저장)
  ↓
상세 페이지에서 결과 표시
```

## 🔄 Auto Fallback 로직

`auto` 모드에서는:

1. **Google 먼저 시도**: 기본적으로 Google Gemini 사용
2. **에러 감지**: 다음 에러 발생 시 Groq로 fallback
   - Quota exceeded
   - Rate limit (429)
   - 5xx 서버 에러
   - Timeout
3. **Groq로 전환**: Google 실패 시 자동으로 Groq 사용
4. **응답에 providerUsed 포함**: UI에 사용된 엔진 표시

## 💰 비용 최적화

- **maxTokens: 300**: 모든 요청에 토큰 제한 적용
- **간결한 응답**: System prompt로 핵심만 간결하게 요청
- **구조화된 JSON**: 파싱 오류 최소화로 재시도 방지

## 🐛 에러 처리

### Google Quota Exceeded

```
에러: "구글 할당량이 초과되었습니다. Groq 엔진으로 변경하여 시도해 보세요."
해결: providerMode를 "groq"로 변경하거나 "auto" 모드 사용
```

### Rate Limit

```
에러: "잠시 후 다시 시도해 주세요"
해결: 잠시 후 재시도
```

### API Key 없음

```
에러: "GOOGLE_GENERATIVE_AI_API_KEY 환경 변수가 설정되지 않았습니다."
해결: .env.local에 API 키 추가
```

## 📝 API 엔드포인트

### POST /api/ai/pipeline

**요청:**
```json
{
  "postId": "uuid",
  "providerMode": "auto" | "google" | "groq",
  "category": "pipeline",
  "content": "학습 내용 텍스트"
}
```

**응답:**
```json
{
  "success": true,
  "providerUsed": "google" | "groq",
  "model": "gemini-1.5-flash" | "llama-3.3-70b-versatile",
  "summary": "요약 텍스트",
  "keyPoints": ["포인트1", "포인트2", ...],
  "studyDirection": "학습 방향 제안",
  "quiz": [
    {
      "question": "문제",
      "choices": ["A", "B", "C", "D"],
      "answerIndex": 0,
      "explanation": "설명"
    }
  ],
  "timeline": [
    {
      "title": "타임라인 제목",
      "order": 1,
      "detail": "상세 설명"
    }
  ],
  "usage": {
    "promptTokens": 100,
    "completionTokens": 200,
    "totalTokens": 300
  },
  "latencyMs": 1500,
  "dbSaved": true
}
```

## 🔍 모니터링

### 콘솔 로그

AI 파이프라인 실행 시 다음 로그가 출력됩니다:

```
[AI Pipeline] Google로 시도 중...
[AI Pipeline] Google 성공: { provider: 'google', model: 'gemini-1.5-flash', latencyMs: 1500, tokens: 300 }
[AI Pipeline API] 성공: { provider: 'google', model: 'gemini-1.5-flash', latencyMs: 1500, tokens: 300, postId: '...' }
```

Fallback 발생 시:

```
[AI Pipeline] Google 실패, Groq로 fallback: Error: ...
[AI Pipeline] Groq fallback 성공: { provider: 'groq', model: 'llama-3.3-70b-versatile', latencyMs: 800, tokens: 250 }
```

### DB 모니터링

`ai_responses` 테이블에서 모든 AI 호출 로그를 확인할 수 있습니다:

```sql
SELECT 
  provider,
  model,
  total_tokens,
  latency_ms,
  created_at
FROM ai_responses
ORDER BY created_at DESC
LIMIT 10;
```

## ✅ 검증 체크리스트

- [ ] 패키지 설치 완료 (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`)
- [ ] 환경 변수 설정 완료 (`.env.local`)
- [ ] DB 스키마 업데이트 완료 (`ai_responses` 테이블, `ai_results` 확장)
- [ ] 학습글 작성 시 AI 처리 동작 확인
- [ ] 상세 페이지에서 AI 결과 표시 확인
- [ ] Auto fallback 동작 확인 (Google 실패 시 Groq 전환)
- [ ] 에러 메시지 표시 확인

## 📚 참고 자료

- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Groq API](https://console.groq.com/docs)
