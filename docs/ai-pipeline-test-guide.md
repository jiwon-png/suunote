# AI 파이프라인 테스트 가이드

## ✅ 사전 준비 완료 확인

- [x] 패키지 설치 완료 (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`)
- [x] DB 스키마 적용 완료 (`ai_responses`, `ai_results` 확장)

## 🧪 테스트 시나리오

### 테스트 1: 기본 플로우 (Auto 모드)

1. **학습글 작성**
   - `/posts/new` 접속
   - 제목 입력: "React Hooks 학습"
   - 내용 입력: "useState와 useEffect를 사용하여 컴포넌트 상태를 관리하는 방법을 학습했습니다..."
   - Provider: "auto (권장)" 선택
   - "AI 요약 생성" 체크박스 활성화
   - "AI 요약 생성" 버튼 클릭

2. **예상 결과**
   - 로딩 스피너 표시
   - `/posts/[id]`로 자동 이동
   - AI 결과 표시:
     - ✅ 요약 섹션
     - ✅ 핵심 포인트 (최대 7개)
     - ✅ 학습 방향 제안
     - ✅ 복습 퀴즈 (최대 5문항, 정답 표시)
     - ✅ 학습 타임라인 (최대 6개 아이템)
     - ✅ AI 엔진 정보 (Google Gemini 또는 Groq Llama)

### 테스트 2: Google 고정 모드

1. **Provider 선택**
   - Provider: "google (gemini-1.5-flash)" 선택
   - AI 처리 실행

2. **예상 결과**
   - AI 엔진 정보에 "Google Gemini (gemini-1.5-flash)" 표시
   - 콘솔에 `[AI Pipeline] Google 성공` 로그

### 테스트 3: Groq 고정 모드

1. **Provider 선택**
   - Provider: "groq (llama-3.3-70b-versatile)" 선택
   - AI 처리 실행

2. **예상 결과**
   - AI 엔진 정보에 "Groq Llama (llama-3.3-70b-versatile)" 표시
   - 콘솔에 `[AI Pipeline] Groq 성공` 로그

### 테스트 4: 첨부파일 통합 (선택사항)

1. **첨부파일 업로드**
   - 학습글 작성 시 PDF/이미지 파일 첨부
   - `post_attachments.extracted_text`에 텍스트가 있는 경우
   - AI 처리 실행

2. **예상 결과**
   - 첨부파일의 extracted_text가 AI 입력에 포함됨
   - 콘솔에서 `combined_content` 확인 가능

### 테스트 5: 에러 처리

#### 5-1. Google Quota Exceeded
- Google API 할당량 초과 시나리오 (테스트용으로 API 키를 임시로 잘못 설정)
- Auto 모드로 실행
- **예상 결과**: Groq로 자동 fallback, "Groq Llama" 표시

#### 5-2. Rate Limit
- Rate limit 발생 시나리오
- **예상 결과**: "잠시 후 다시 시도해 주세요" 메시지

#### 5-3. API 키 없음
- `.env.local`에서 API 키 제거
- **예상 결과**: 명확한 에러 메시지 표시

## 🔍 검증 체크리스트

### Frontend 검증
- [ ] `/posts/new`에서 Provider 드롭다운 표시 확인
- [ ] Provider 선택 시 설명 텍스트 변경 확인
- [ ] 로딩 중 버튼 disabled 확인
- [ ] 로딩 스피너 표시 확인
- [ ] `/posts/[id]`에서 AI 결과 모든 섹션 표시 확인
- [ ] Provider 정보 표시 확인

### Backend 검증
- [ ] 콘솔에 AI 처리 로그 출력 확인:
  ```
  [AI Pipeline] Google로 시도 중...
  [AI Pipeline] Google 성공: { provider: 'google', model: 'gemini-1.5-flash', latencyMs: ..., tokens: ... }
  [AI Pipeline API] 성공: { provider: 'google', model: 'gemini-1.5-flash', ... }
  ```
- [ ] Fallback 발생 시:
  ```
  [AI Pipeline] Google 실패, Groq로 fallback: ...
  [AI Pipeline] Groq fallback 성공: { provider: 'groq', ... }
  ```

### DB 검증

#### ai_responses 테이블 확인
```sql
SELECT 
  provider,
  model,
  total_tokens,
  latency_ms,
  created_at
FROM ai_responses
ORDER BY created_at DESC
LIMIT 5;
```

**예상 결과**: 모든 AI 호출이 로그로 저장됨

#### ai_results 테이블 확인
```sql
SELECT 
  post_id,
  summary,
  key_points,
  study_direction,
  quiz,
  timeline,
  provider,
  model
FROM ai_results
ORDER BY created_at DESC
LIMIT 1;
```

**예상 결과**: 
- summary, key_points, study_direction 값 존재
- quiz, timeline JSONB 배열 존재
- provider, model 값 존재

## 🐛 문제 해결

### 문제 1: "GOOGLE_GENERATIVE_AI_API_KEY 환경 변수가 설정되지 않았습니다"
**해결**: `.env.local`에 `GOOGLE_GENERATIVE_AI_API_KEY=your_key` 추가

### 문제 2: "GROQ_API_KEY 환경 변수가 설정되지 않았습니다"
**해결**: `.env.local`에 `GROQ_API_KEY=your_key` 추가 (auto 모드 fallback용)

### 문제 3: "Post를 찾을 수 없습니다"
**해결**: Post가 먼저 생성되어야 함. Post 생성 후 AI 처리 실행

### 문제 4: AI 결과가 표시되지 않음
**해결**: 
1. 브라우저 콘솔에서 에러 확인
2. Network 탭에서 `/api/ai/pipeline` 응답 확인
3. DB에서 `ai_results` 테이블 확인

### 문제 5: 타입 에러 발생
**해결**:
1. `npm run build` 실행하여 타입 에러 확인
2. `types/database.ts`가 최신인지 확인 (Supabase 타입 재생성 필요할 수 있음)

## 📊 성능 확인

### 응답 시간
- Google: 일반적으로 1-3초
- Groq: 일반적으로 0.5-2초
- 콘솔에서 `latencyMs` 확인 가능

### 토큰 사용량
- maxTokens: 300으로 제한
- 콘솔에서 `tokens` 확인 가능
- DB의 `ai_responses.total_tokens`에서 확인 가능

## ✅ 성공 기준

다음이 모두 확인되면 성공:

1. ✅ Provider 선택 및 AI 처리 실행 가능
2. ✅ AI 결과가 DB에 저장됨 (`ai_results`, `ai_responses`)
3. ✅ 상세 페이지에 모든 AI 결과 표시됨
4. ✅ Provider 정보가 표시됨
5. ✅ 에러 메시지가 사용자 친화적으로 표시됨
6. ✅ Auto fallback이 정상 동작함 (Google 실패 시 Groq)

## 🎯 다음 단계

테스트 완료 후:
1. 실제 사용자 피드백 수집
2. 성능 모니터링 (latency, token usage)
3. 에러 로그 분석
4. 필요시 추가 기능 구현 (재생성 버튼 등)

---

**테스트 완료 후 결과를 공유해주시면 추가 개선 사항을 제안하겠습니다!**
