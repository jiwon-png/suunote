# AI 파이프라인 구현 완료 요약

## ✅ 구현 완료 항목

### 1. 데이터베이스 스키마
- ✅ `ai_responses` 테이블 생성 (모든 AI 호출 로그)
- ✅ `ai_results` 테이블 확장 (quiz/timeline 컬럼 추가)
- ✅ 인덱스 및 RLS 정책 설정
- 📄 파일: `docs/ai-pipeline-schema.sql`

### 2. AI Provider 모듈
- ✅ Google Provider (`lib/ai/providers/google.ts`)
  - 모델: `gemini-1.5-flash`
  - maxTokens: 300
  - 구조화된 JSON 응답
  
- ✅ Groq Provider (`lib/ai/providers/groq.ts`)
  - 모델: `llama-3.3-70b-versatile`
  - maxTokens: 300
  - 구조화된 JSON 응답

- ✅ Auto Fallback 로직 (`lib/ai/providers/index.ts`)
  - Google 기본 사용
  - Quota/Rate limit/5xx/Timeout 시 Groq로 자동 전환
  - 사용된 Provider 정보 반환

### 3. API Route
- ✅ `app/api/ai/pipeline/route.ts`
  - POST 엔드포인트 구현
  - 사용자 인증 및 권한 검증
  - 첨부파일 extracted_text 통합
  - AI 호출 및 결과 저장
  - 에러 처리 및 사용자 친화적 메시지

### 4. Frontend UI
- ✅ `app/(main)/posts/new/page.tsx`
  - Provider 선택 드롭다운 (auto/google/groq)
  - AI 처리 로딩 상태 표시
  - 에러 메시지 표시 (Quota exceeded, Rate limit 등)

- ✅ `app/(main)/posts/[id]/page.tsx`
  - 요약/핵심포인트/학습방향 표시 (기존)
  - 퀴즈 섹션 추가 (객관식 4지선다, 정답 표시)
  - 타임라인 섹션 추가 (순서별 학습 단계)

### 5. 타입 시스템
- ✅ `domain/ai/types.ts` 확장
  - `AIPipelineResponse` 인터페이스 추가
  - `QuizItem`, `TimelineItem` 인터페이스 추가
  - `AIResult`에 quiz/timeline 필드 추가

- ✅ `lib/utils/types.ts` 업데이트
  - `aiResultRowToDomain` 함수에 quiz/timeline 파싱 추가

## 📦 필요한 패키지

```bash
npm install ai @ai-sdk/google @ai-sdk/groq
```

## 🔧 환경 변수 설정

`.env.local`에 추가:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key  # 선택사항 (auto 모드 fallback용)
```

## 📊 AI 출력 스펙

```typescript
{
  summary: string,                    // 핵심 요약 (50-100자)
  keyPoints: string[],                // 최대 7개
  studyDirection: string,             // 학습 방향 제안
  quiz: [                             // 최대 5문항
    {
      question: string,
      choices: ["A", "B", "C", "D"],  // 4지선다
      answerIndex: 0,                 // 0-3
      explanation: string
    }
  ],
  timeline: [                          // 최대 6개 아이템
    {
      title: string,
      order: number,
      detail: string
    }
  ]
}
```

## 🔄 사용 흐름

1. **학습글 작성** (`/posts/new`)
   - 제목, 내용 입력
   - Provider 선택 (auto/google/groq)
   - "AI 요약 생성" 버튼 클릭

2. **Post 저장**
   - `posts` 테이블에 저장
   - 첨부파일 처리 (있는 경우)

3. **AI 파이프라인 실행**
   - `/api/ai/pipeline` 호출
   - Provider 선택 및 AI 처리
   - 결과 DB 저장 (`ai_responses`, `ai_results`)

4. **결과 표시** (`/posts/[id]`)
   - 요약/핵심포인트/학습방향
   - 퀴즈 (정답 표시)
   - 타임라인 (순서별)

## 🎯 주요 기능

### Provider 선택
- **auto (권장)**: Google 기본, 실패 시 Groq로 자동 전환
- **google**: Google Gemini만 사용
- **groq**: Groq Llama만 사용

### Auto Fallback
- Google Quota exceeded → Groq
- Google Rate limit (429) → Groq
- Google 5xx 에러 → Groq
- Google Timeout → Groq

### 비용 최적화
- maxTokens: 300 (모든 요청)
- 간결한 응답 요청 (System prompt)
- 구조화된 JSON (파싱 오류 최소화)

### 에러 처리
- Google Quota exceeded → 사용자 친화적 메시지
- Rate limit → 재시도 안내
- API Key 없음 → 명확한 에러 메시지
- DB 저장 실패 → 로깅 (응답에는 영향 없음)

## 📝 다음 단계 (선택사항)

1. **재생성 기능**: 상세 페이지에서 AI 결과 재생성 버튼 추가
2. **퀴즈 인터랙션**: 사용자가 답 선택 후 정답 확인
3. **타임라인 상세**: 각 단계별 상세 정보 모달
4. **비용 모니터링**: 사용자별/일별 토큰 사용량 대시보드
5. **캐싱**: 동일 내용에 대한 중복 AI 호출 방지

## 🐛 알려진 제한사항

1. **첨부파일 처리**: 현재는 `extracted_text`만 사용 (실제 OCR/STT는 Phase 2)
2. **재시도 로직**: 수동 재시도만 지원 (자동 재시도 없음)
3. **비용 추적**: 토큰 사용량은 로그만 (비용 계산 없음)

## ✅ 검증 체크리스트

- [x] DB 스키마 생성 SQL 작성
- [x] AI Provider 모듈 구현 (Google/Groq/Auto)
- [x] API Route 구현
- [x] Frontend UI 업데이트 (작성/상세 페이지)
- [x] 타입 시스템 확장
- [x] 에러 처리 구현
- [x] 문서화 완료

## 📚 관련 파일

- `docs/ai-pipeline-schema.sql` - DB 스키마
- `docs/ai-pipeline-setup.md` - 설정 가이드
- `lib/ai/providers/` - AI Provider 모듈
- `app/api/ai/pipeline/route.ts` - API Route
- `app/(main)/posts/new/page.tsx` - 작성 페이지
- `app/(main)/posts/[id]/page.tsx` - 상세 페이지
- `domain/ai/types.ts` - 타입 정의
