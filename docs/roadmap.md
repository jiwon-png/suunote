# SSU-Note Google OAuth 구현 로드맵

## 📋 개요

이 문서는 Supabase SDK를 활용한 Google OAuth 인증 구현을 위한 단계별 구현 계획입니다. 현재 프로젝트의 상태를 분석하여 실제 구현에 필요한 모든 단계를 상세히 정리했습니다.

---

## 🔍 현재 상태 분석

### ✅ 이미 구현된 부분

1. **Supabase 클라이언트 설정**
   - `lib/supabase/client.ts`: 브라우저 클라이언트 (Mock 모드 지원)
   - `lib/supabase/server.ts`: 서버 클라이언트 (Mock 모드 지원)
   - `lib/supabase/middleware.ts`: 미들웨어 세션 관리

2. **인증 서비스 레이어**
   - `domain/auth/services/authService.ts`: `signInWithGoogle`, `signOut`, `getCurrentUser` 구현
   - Mock 모드와 실제 모드 분기 처리

3. **UI 컴포넌트**
   - `app/(auth)/login/page.tsx`: Google 로그인 버튼 UI 완성
   - `app/(auth)/callback/route.ts`: OAuth 콜백 라우트 구현

4. **상태 관리**
   - `contexts/AuthContext.tsx`: 사용자 인증 상태 관리
   - `middleware.ts`: 보호된 경로 인증 체크

5. **데이터베이스 스키마**
   - `profiles` 테이블 정의 완료
   - `handle_new_user()` 트리거로 프로필 자동 생성
   - RLS 정책 설정 완료

### ⚠️ 보완이 필요한 부분

1. Supabase 프로젝트에서 Google OAuth Provider 설정 미완료
2. 환경 변수 설정 검증 필요
3. 에러 처리 및 사용자 피드백 강화 필요
4. 세션 갱신 로직 보완 필요

---

## 🗺️ Step-by-Step 구현 계획

### Phase 1: Supabase 프로젝트 설정

#### Step 1.1: Supabase 프로젝트에서 Google OAuth 활성화

**목표**: Supabase 대시보드에서 Google OAuth Provider 설정

**작업 내용**:
1. Supabase 대시보드 접속
   - URL: `https://supabase.com/dashboard/project/{PROJECT_ID}`
   - PROJECT_ID: `sjjsagljrmkkyuvpbtba` (`.env.local` 참조)

2. Authentication → Providers 메뉴 이동
   - 좌측 사이드바에서 `Authentication` 클릭
   - `Providers` 탭 선택

3. Google Provider 활성화
   - Google Provider 토글 ON
   - Google OAuth 설정 정보 입력 필요:
     - **Client ID**: Google Cloud Console에서 발급
     - **Client Secret**: Google Cloud Console에서 발급

**검증 방법**:
- Supabase 대시보드에서 Google Provider가 활성화되어 있는지 확인
- `Enabled` 상태가 `true`인지 확인

**참고 문서**:
- [Supabase Auth - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

#### Step 1.2: Google Cloud Console 설정

**목표**: Google OAuth 2.0 클라이언트 ID 및 Secret 생성

**작업 내용**:
1. Google Cloud Console 접속
   - URL: `https://console.cloud.google.com/`

2. 프로젝트 생성 또는 선택
   - 새 프로젝트 생성 또는 기존 프로젝트 선택

3. OAuth 동의 화면 설정
   - APIs & Services → OAuth consent screen
   - User Type: External 선택
   - 앱 정보 입력:
     - 앱 이름: `SSU-Note`
     - 사용자 지원 이메일: 본인 이메일
     - 개발자 연락처 정보: 본인 이메일
   - 범위(Scopes) 추가:
     - `openid`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

4. OAuth 2.0 클라이언트 ID 생성
   - APIs & Services → Credentials
   - `+ CREATE CREDENTIALS` → `OAuth client ID` 선택
   - Application type: `Web application`
   - Authorized redirect URIs 추가:
     ```
     https://sjjsagljrmkkyuvpbtba.supabase.co/auth/v1/callback
     ```
   - 클라이언트 ID와 Secret 복사

5. Supabase에 클라이언트 정보 입력
   - Step 1.1에서 열어둔 Supabase 대시보드로 돌아가기
   - Google Provider 설정에 Client ID와 Secret 입력
   - 저장

**검증 방법**:
- Google Cloud Console에서 Authorized redirect URIs가 올바르게 설정되었는지 확인
- Supabase 대시보드에서 Google Provider 설정이 저장되었는지 확인

**주의사항**:
- Client Secret은 절대 공개 저장소에 커밋하지 않기
- 로컬 개발 환경과 프로덕션 환경의 redirect URI가 다를 수 있음

---

#### Step 1.3: 환경 변수 검증

**목표**: `.env.local` 파일의 Supabase 설정 확인 및 검증

**작업 내용**:
1. `.env.local` 파일 확인
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://sjjsagljrmkkyuvpbtba.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. 환경 변수 유효성 검증
   - `NEXT_PUBLIC_SUPABASE_URL`이 올바른 형식인지 확인
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 유효한 JWT 토큰인지 확인

3. 개발 서버 재시작
   ```bash
   pnpm dev
   ```

4. Mock 모드 비활성화 확인
   - `lib/supabase/client.ts`의 `isMockMode()` 함수가 `false`를 반환하는지 확인
   - 브라우저 콘솔에서 확인:
     ```javascript
     // 개발자 도구 콘솔에서
     console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
     ```

**검증 방법**:
- 로그인 페이지에서 "Mock 모드" 안내 문구가 사라졌는지 확인
- 브라우저 네트워크 탭에서 Supabase API 호출이 발생하는지 확인

---

### Phase 2: OAuth 플로우 구현 강화

#### Step 2.1: OAuth 콜백 라우트 개선

**목표**: `app/(auth)/callback/route.ts`의 에러 처리 및 세션 관리 강화

**현재 코드 위치**: `app/(auth)/callback/route.ts`

**개선 사항**:
1. **에러 처리 강화**
   ```typescript
   // OAuth 에러 코드별 사용자 친화적 메시지 매핑
   const errorMessages: Record<string, string> = {
     'access_denied': '로그인이 취소되었습니다.',
     'server_error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
     'temporarily_unavailable': '일시적으로 서비스를 사용할 수 없습니다.',
   }
   ```

2. **세션 교환 실패 시 재시도 로직**
   - 일시적 오류인 경우 재시도 메커니즘 추가
   - 영구적 오류인 경우 명확한 에러 메시지 표시

3. **로그ging 추가**
   - 개발 환경에서만 상세 로그 출력
   - 프로덕션에서는 에러만 로깅

**구현 파일**: `app/(auth)/callback/route.ts`

**검증 방법**:
- Google OAuth 취소 시 에러 메시지가 올바르게 표시되는지 확인
- 세션 교환 실패 시 적절한 에러 페이지로 리다이렉트되는지 확인

---

#### Step 2.2: 세션 갱신 로직 구현

**목표**: 만료된 세션 자동 갱신 및 사용자 경험 개선

**작업 내용**:
1. **클라이언트 사이드 세션 체크**
   - `lib/supabase/client.ts`에 세션 갱신 헬퍼 함수 추가
   ```typescript
   export async function refreshSessionIfNeeded() {
     const supabase = createClient()
     const { data: { session } } = await supabase.auth.getSession()
     
     if (session && session.expires_at) {
       const expiresAt = session.expires_at * 1000 // 초를 밀리초로 변환
       const now = Date.now()
       const timeUntilExpiry = expiresAt - now
       
       // 만료 5분 전에 갱신
       if (timeUntilExpiry < 5 * 60 * 1000) {
         const { error } = await supabase.auth.refreshSession()
         if (error) {
           console.error('Session refresh error:', error)
         }
       }
     }
   }
   ```

2. **주기적 세션 체크**
   - `AuthContext.tsx`에서 주기적으로 세션 상태 확인
   - 또는 `middleware.ts`에서 서버 사이드 세션 체크 강화

**구현 파일**:
- `lib/supabase/client.ts`
- `contexts/AuthContext.tsx` (선택사항)

**검증 방법**:
- 세션이 만료되기 전에 자동으로 갱신되는지 확인
- 갱신 실패 시 적절한 에러 처리 및 로그아웃 플로우 동작 확인

---

#### Step 2.3: 프로필 자동 생성 검증

**목표**: Google OAuth 로그인 후 `profiles` 테이블에 자동으로 프로필이 생성되는지 확인

**작업 내용**:
1. **데이터베이스 트리거 확인**
   - `docs/db-schema-final.sql`의 `handle_new_user()` 함수가 올바르게 생성되었는지 확인
   - Supabase SQL Editor에서 확인:
     ```sql
     SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
     ```

2. **프로필 생성 테스트**
   - Google OAuth로 로그인
   - Supabase 대시보드에서 `profiles` 테이블 확인
   - 새 사용자의 프로필이 자동으로 생성되었는지 확인

3. **프로필 데이터 검증**
   - `auth.users` 테이블의 `raw_user_meta_data`에서 `full_name` 추출 확인
   - `profiles` 테이블의 `email`, `full_name` 필드가 올바르게 채워졌는지 확인

**문제 발생 시 대응**:
- 트리거가 없으면 `db-schema-final.sql`을 Supabase SQL Editor에서 실행
- 프로필이 생성되지 않으면 수동으로 트리거 재생성

**검증 방법**:
- Google OAuth 로그인 후 즉시 `profiles` 테이블에 레코드가 생성되는지 확인
- `profiles.email`과 `profiles.full_name`이 올바르게 설정되었는지 확인

---

### Phase 3: 사용자 경험 개선

#### Step 3.1: 로그인 페이지 에러 처리 개선

**목표**: `app/(auth)/login/page.tsx`의 에러 메시지 개선

**현재 상태**: 기본적인 에러 메시지만 표시

**개선 사항**:
1. **에러 타입별 메시지 분기**
   ```typescript
   const getErrorMessage = (error: string | null): string => {
     if (!error) return ''
     
     const errorMessages: Record<string, string> = {
       'session_exchange_failed': '세션 생성에 실패했습니다. 다시 로그인해주세요.',
       'unexpected_error': '예상치 못한 오류가 발생했습니다.',
       'access_denied': '로그인이 취소되었습니다.',
     }
     
     return errorMessages[error] || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
   }
   ```

2. **로딩 상태 개선**
   - OAuth 리다이렉트 중 로딩 인디케이터 표시
   - 사용자가 중복 클릭하지 않도록 버튼 비활성화

**구현 파일**: `app/(auth)/login/page.tsx`

**검증 방법**:
- 다양한 에러 시나리오에서 적절한 메시지가 표시되는지 확인
- 로그인 버튼 클릭 후 로딩 상태가 올바르게 표시되는지 확인

---

#### Step 3.2: AuthContext 세션 동기화 개선

**목표**: `contexts/AuthContext.tsx`에서 Supabase 세션 변경 감지 및 자동 업데이트

**작업 내용**:
1. **Supabase Auth 상태 리스너 추가**
   ```typescript
   useEffect(() => {
     if (isMockMode()) {
       // Mock 모드 처리 (기존 로직 유지)
       return
     }
     
     const supabase = createClient()
     
     // 초기 사용자 정보 가져오기
     supabase.auth.getUser().then(({ data: { user }, error }) => {
       if (!error && user) {
         setUser(user as User | null)
       } else {
         setUser(null)
       }
       setIsLoading(false)
     })
     
     // Auth 상태 변경 리스너
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
         if (event === 'SIGNED_IN' && session?.user) {
           setUser(session.user as User | null)
         } else if (event === 'SIGNED_OUT') {
           setUser(null)
         } else if (event === 'TOKEN_REFRESHED' && session?.user) {
           setUser(session.user as User | null)
         }
       }
     )
     
     return () => {
       subscription.unsubscribe()
     }
   }, [])
   ```

2. **프로필 정보 가져오기**
   - `profiles` 테이블에서 추가 사용자 정보 가져오기
   - `auth.users`와 `profiles` 조인하여 완전한 사용자 정보 제공

**구현 파일**: `contexts/AuthContext.tsx`

**검증 방법**:
- 다른 탭에서 로그아웃 시 현재 탭의 인증 상태가 자동으로 업데이트되는지 확인
- 세션 갱신 시 사용자 정보가 자동으로 업데이트되는지 확인

---

#### Step 3.3: 미들웨어 세션 관리 개선

**목표**: `lib/supabase/middleware.ts`의 세션 관리 로직 강화

**현재 상태**: 기본적인 세션 체크만 수행

**개선 사항**:
1. **세션 만료 시 자동 리다이렉트**
   - 만료된 세션 감지 시 로그인 페이지로 리다이렉트
   - 원래 가려던 경로를 `redirect` 쿼리 파라미터로 전달

2. **에러 처리 강화**
   - 세션 확인 중 오류 발생 시 적절한 처리
   - 네트워크 오류와 인증 오류 구분

**구현 파일**: `lib/supabase/middleware.ts`

**검증 방법**:
- 만료된 세션으로 보호된 경로 접근 시 로그인 페이지로 리다이렉트되는지 확인
- 로그인 후 원래 가려던 경로로 자동 리다이렉트되는지 확인

---

### Phase 4: 데이터베이스 연동 검증

#### Step 4.1: 프로필 조회 및 업데이트 기능 구현

**목표**: `profiles` 테이블과의 연동을 위한 서비스 함수 구현

**작업 내용**:
1. **프로필 조회 함수 추가**
   - `domain/auth/services/authService.ts`에 함수 추가
   ```typescript
   export async function getProfile(userId: string) {
     const supabase = createClient()
     const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', userId)
       .single()
     
     if (error) {
       return { profile: null, error }
     }
     
     return { profile: data, error: null }
   }
   ```

2. **프로필 업데이트 함수 추가**
   ```typescript
   export async function updateProfile(
     userId: string,
     updates: { full_name?: string; avatar_url?: string }
   ) {
     const supabase = createClient()
     const { data, error } = await supabase
       .from('profiles')
       .update(updates)
       .eq('id', userId)
       .select()
       .single()
     
     if (error) {
       return { profile: null, error }
     }
     
     return { profile: data, error: null }
   }
   ```

**구현 파일**: `domain/auth/services/authService.ts`

**검증 방법**:
- 로그인 후 프로필 정보가 올바르게 조회되는지 확인
- 프로필 업데이트가 RLS 정책을 준수하며 동작하는지 확인

---

#### Step 4.2: RLS 정책 검증

**목표**: Row Level Security 정책이 올바르게 작동하는지 확인

**작업 내용**:
1. **RLS 정책 확인**
   - Supabase 대시보드에서 `profiles` 테이블의 RLS 정책 확인
   - 다음 정책들이 존재하는지 확인:
     - `Users can view own profile`
     - `Users can update own profile`

2. **RLS 정책 테스트**
   - 다른 사용자의 프로필 조회 시도 → 실패해야 함
   - 자신의 프로필 조회 시도 → 성공해야 함
   - 자신의 프로필 업데이트 시도 → 성공해야 함

3. **RLS 정책이 없는 경우**
   - `docs/db-schema-final.sql`의 RLS 정책 부분을 Supabase SQL Editor에서 실행

**검증 방법**:
- Supabase 대시보드의 Table Editor에서 직접 테스트
- 또는 애플리케이션에서 다른 사용자 데이터 접근 시도 시 에러 발생 확인

---

### Phase 5: 테스트 및 문서화

#### Step 5.1: 통합 테스트 시나리오 작성

**목표**: Google OAuth 플로우 전체 테스트 시나리오 작성 및 실행

**테스트 시나리오**:
1. **정상 로그인 플로우**
   - 로그인 페이지 접근
   - "Google로 시작하기" 버튼 클릭
   - Google OAuth 동의 화면에서 계정 선택 및 동의
   - 콜백 라우트를 통한 세션 생성
   - `/posts` 페이지로 리다이렉트
   - 사용자 정보가 올바르게 표시되는지 확인

2. **로그인 취소 플로우**
   - 로그인 페이지 접근
   - "Google로 시작하기" 버튼 클릭
   - Google OAuth 동의 화면에서 취소
   - 로그인 페이지로 리다이렉트
   - 적절한 에러 메시지 표시 확인

3. **세션 만료 플로우**
   - 로그인 상태에서 시간 경과 (또는 수동으로 세션 만료)
   - 보호된 경로 접근 시도
   - 로그인 페이지로 리다이렉트
   - 원래 가려던 경로가 `redirect` 파라미터로 전달되는지 확인

4. **로그아웃 플로우**
   - 로그인 상태에서 로그아웃 버튼 클릭
   - 세션 제거 확인
   - 로그인 페이지로 리다이렉트 확인

**테스트 결과 문서화**:
- 각 시나리오별 테스트 결과 기록
- 발견된 이슈 및 해결 방법 문서화

---

#### Step 5.2: 환경별 설정 가이드 작성

**목표**: 개발/스테이징/프로덕션 환경별 설정 가이드 작성

**작업 내용**:
1. **개발 환경 설정**
   - 로컬 개발 환경의 `.env.local` 설정
   - Google OAuth redirect URI 설정 (로컬 개발용)

2. **프로덕션 환경 설정**
   - Vercel/배포 환경의 환경 변수 설정
   - Google OAuth redirect URI 설정 (프로덕션용)
   - 도메인별 redirect URI 설정

3. **설정 가이드 문서 작성**
   - `docs/setup-guide.md` 파일 생성
   - 단계별 설정 방법 상세 기록

**구현 파일**: `docs/setup-guide.md` (새로 생성)

---

#### Step 5.3: 에러 처리 가이드 작성

**목표**: 일반적인 에러 상황 및 해결 방법 문서화

**작업 내용**:
1. **일반적인 에러 상황 정리**
   - OAuth 리다이렉트 실패
   - 세션 교환 실패
   - 프로필 생성 실패
   - RLS 정책 위반

2. **에러 해결 방법 문서화**
   - 각 에러 상황별 원인 분석
   - 해결 방법 단계별 설명
   - 디버깅 팁 제공

**구현 파일**: `docs/troubleshooting.md` (새로 생성)

---

## 📝 구현 체크리스트

### Phase 1: Supabase 프로젝트 설정
- [ ] Step 1.1: Supabase에서 Google OAuth Provider 활성화
- [ ] Step 1.2: Google Cloud Console에서 OAuth 클라이언트 생성
- [ ] Step 1.3: 환경 변수 검증

### Phase 2: OAuth 플로우 구현 강화
- [ ] Step 2.1: OAuth 콜백 라우트 개선
- [ ] Step 2.2: 세션 갱신 로직 구현
- [ ] Step 2.3: 프로필 자동 생성 검증

### Phase 3: 사용자 경험 개선
- [ ] Step 3.1: 로그인 페이지 에러 처리 개선
- [ ] Step 3.2: AuthContext 세션 동기화 개선
- [ ] Step 3.3: 미들웨어 세션 관리 개선

### Phase 4: 데이터베이스 연동 검증
- [ ] Step 4.1: 프로필 조회 및 업데이트 기능 구현
- [ ] Step 4.2: RLS 정책 검증

### Phase 5: 테스트 및 문서화
- [ ] Step 5.1: 통합 테스트 시나리오 작성 및 실행
- [ ] Step 5.2: 환경별 설정 가이드 작성
- [ ] Step 5.3: 에러 처리 가이드 작성

---

## 🔗 참고 자료

### Supabase 공식 문서
- [Supabase Auth - Social Login](https://supabase.com/docs/guides/auth/social-login)
- [Supabase Auth - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth - Session Management](https://supabase.com/docs/guides/auth/sessions)
- [Supabase Auth - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Next.js 공식 문서
- [Next.js - Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Google Cloud 문서
- [Google OAuth 2.0 설정 가이드](https://developers.google.com/identity/protocols/oauth2/web-server)

---

## 📌 중요 사항

### 보안
1. **환경 변수 보호**
   - `.env.local` 파일은 절대 Git에 커밋하지 않기
   - `.gitignore`에 `.env.local`이 포함되어 있는지 확인

2. **RLS 정책 필수**
   - 모든 `public` 스키마 테이블에 RLS 활성화
   - 사용자는 자신의 데이터만 접근 가능하도록 정책 설정

3. **Client Secret 보호**
   - Google OAuth Client Secret은 Supabase 대시보드에만 저장
   - 코드나 환경 변수에 노출하지 않기

### 성능
1. **세션 갱신 최적화**
   - 불필요한 세션 갱신 요청 최소화
   - 만료 시간 임계값 적절히 설정 (권장: 만료 5분 전)

2. **프로필 조회 캐싱**
   - 사용자 프로필 정보는 적절히 캐싱
   - 불필요한 데이터베이스 쿼리 최소화

### 사용자 경험
1. **로딩 상태 표시**
   - OAuth 리다이렉트 중 로딩 인디케이터 표시
   - 사용자가 중복 클릭하지 않도록 버튼 비활성화

2. **에러 메시지 명확성**
   - 사용자 친화적인 에러 메시지 제공
   - 기술적인 에러는 개발자 콘솔에만 표시

---

## 🎯 완료 기준

이 로드맵의 모든 단계가 완료되면 다음이 가능해야 합니다:

1. ✅ 사용자가 Google 계정으로 로그인할 수 있음
2. ✅ 로그인 후 자동으로 프로필이 생성됨
3. ✅ 세션이 적절히 관리되고 자동으로 갱신됨
4. ✅ 보호된 경로에 대한 접근 제어가 올바르게 작동함
5. ✅ 에러 상황에 대한 적절한 처리 및 사용자 피드백 제공
6. ✅ 로그아웃 기능이 정상적으로 작동함

---

**작성일**: 2026-01-29  
**프로젝트**: SSU-Note  
**버전**: 1.0
