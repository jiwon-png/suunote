# SSU-Note 기능 구현 흐름 리스트 (Data Binding 중심)

## 📋 개요

이 문서는 **데이터 흐름 중심**의 기능 구현 계획입니다. 화면 단위가 아닌 "데이터 페칭 → 상태 관리 → UI 바인딩"의 흐름으로 단계를 나누어, 효율적인 개발 진행을 위한 체크리스트를 제공합니다.

**구현 원칙**:
- 데이터 흐름 우선: 화면보다 데이터 연결이 먼저
- 점진적 통합: Mock → Supabase 단계적 전환
- 검증 가능: 각 단계마다 명확한 검증 기준

---

## Phase 1: Foundation (공통 유틸리티 및 기본 데이터 연결)

### 1.1. Supabase 타입 생성 및 타입 시스템 구축

**목표**: Supabase CLI로 데이터베이스 타입 자동 생성 및 프로젝트 타입 시스템 통합

**데이터 흐름**:
```
Supabase DB Schema → Supabase CLI → types/database.ts → Domain Types
```

**구현 작업**:
1. Supabase CLI로 타입 생성
   ```bash
   npx supabase gen types typescript --project-id sjjsagljrmkkyuvpbtba > types/database.ts
   ```
2. `types/database.ts` 파일 검증 (테이블 타입이 올바르게 생성되었는지 확인)
3. Domain Types (`domain/posts/types.ts`, `domain/courses/types.ts`)와 Supabase 타입 매핑
4. 타입 유틸리티 함수 작성 (`lib/utils/types.ts`)
   - Supabase Row → Domain Entity 변환 함수
   - Domain Entity → Supabase Insert/Update 타입 변환 함수

**기술 스택**:
- Supabase CLI
- TypeScript
- `@supabase/supabase-js` 타입 시스템

**검증 기준**:
- [ ] `types/database.ts`에 모든 테이블 타입이 생성됨
- [ ] Domain Types와 Supabase 타입 간 변환 함수가 작동함
- [ ] 타입 에러 없이 빌드됨

**의존성**: 없음 (최우선 작업)

---

### 1.2. Google OAuth 인증 플로우 구현

**목표**: Supabase를 통한 Google OAuth 로그인 플로우 완전 구현 및 검증

**데이터 흐름**:
```
Login Button Click → signInWithGoogle() → Google OAuth → Callback Route → exchangeCodeForSession() → Supabase Session → Redirect to Target Page
```

**구현 작업**:
1. Supabase 프로젝트에서 Google OAuth Provider 설정
   - Supabase Dashboard → Authentication → Providers
   - Google Provider 활성화
   - Google Cloud Console에서 OAuth 클라이언트 ID/Secret 발급
   - Authorized redirect URI 설정: `https://{project-id}.supabase.co/auth/v1/callback`

2. `domain/auth/services/authService.ts`의 `signInWithGoogle()` 함수 검증 및 개선
   ```typescript
   // 현재 구현 확인 및 개선
   // - redirectTo 옵션 처리
   // - 에러 처리 강화
   // - Mock 모드와 실제 모드 분기 확인
   ```

3. `app/(auth)/callback/route.ts` 콜백 라우트 구현 및 검증
   - OAuth 인증 코드(`code`) 파라미터 처리
   - OAuth 에러(`error`) 파라미터 처리
   - `exchangeCodeForSession()` 호출
   - 세션 교환 실패 시 에러 처리
   - 원래 가려던 페이지로 리다이렉트 (`redirect` 쿼리 파라미터)

4. 에러 처리 및 사용자 피드백 개선
   - OAuth 취소 시 사용자 친화적 메시지
   - 세션 교환 실패 시 재시도 로직 (선택사항)
   - 에러 타입별 메시지 매핑

5. `app/(auth)/login/page.tsx` 로그인 페이지 연동 확인
   - Google 로그인 버튼 클릭 핸들러
   - 로딩 상태 표시
   - 에러 메시지 표시

6. `middleware.ts` 세션 관리 연동 확인
   - 보호된 경로 접근 시 세션 확인
   - 미인증 사용자 로그인 페이지로 리다이렉트
   - 원래 가려던 경로 저장 (`redirect` 쿼리 파라미터)

**기술 스택**:
- `@supabase/ssr` (브라우저 및 서버 클라이언트)
- `supabase.auth.signInWithOAuth()`
- `supabase.auth.exchangeCodeForSession()`
- Next.js Route Handlers
- Next.js Middleware

**검증 기준**:
- [ ] Google OAuth 로그인 버튼 클릭 시 Google 인증 페이지로 리다이렉트됨
- [ ] Google 인증 완료 후 콜백 라우트로 정상 리다이렉트됨
- [ ] 인증 코드가 세션으로 정상 교환됨
- [ ] 세션이 쿠키에 저장되고 유지됨
- [ ] 원래 가려던 페이지로 정상 리다이렉트됨
- [ ] OAuth 취소 시 적절한 에러 메시지 표시됨
- [ ] 세션 교환 실패 시 에러 처리 및 리다이렉트가 정상 작동함
- [ ] 미들웨어에서 세션 확인 및 보호된 경로 접근 제어가 정상 작동함

**의존성**: 1.1 (타입 시스템)

---

### 1.3. 인증 상태 관리 및 사용자 프로필 페칭

**목표**: Google OAuth 로그인 후 사용자 프로필 정보를 Supabase에서 가져와 상태 관리

**데이터 흐름**:
```
Google OAuth → Supabase Auth Session → auth.users → public.profiles → AuthContext State → UI
```

**구현 작업**:
1. `domain/auth/services/authService.ts`에 프로필 조회 함수 추가
   ```typescript
   // Supabase: profiles 테이블에서 user_id로 조회
   // RLS 정책: auth.uid() = id
   export async function getProfile(userId: string)
   ```
2. `contexts/AuthContext.tsx`에서 Supabase 세션 변경 감지
   - `supabase.auth.onAuthStateChange()` 리스너 등록
   - 세션 변경 시 프로필 자동 페칭
3. 프로필 정보를 `AuthContext` 상태에 저장
4. `lib/supabase/client.ts`의 세션 갱신 로직 연동

**기술 스택**:
- `@supabase/ssr` (브라우저 클라이언트)
- `supabase.auth.onAuthStateChange()`
- React Context API

**검증 기준**:
- [ ] Google OAuth 로그인 후 프로필이 자동으로 로드됨
- [ ] `profiles` 테이블의 `email`, `full_name`이 UI에 표시됨
- [ ] 세션 만료 시 자동으로 로그아웃 처리됨

**의존성**: 1.2 (Google OAuth 플로우)

---

### 1.4. Supabase 쿼리 헬퍼 함수 작성

**목표**: 공통 쿼리 패턴을 재사용 가능한 헬퍼 함수로 추상화

**데이터 흐름**:
```
Domain Service → Query Helper → Supabase Client → PostgreSQL → Response → Domain Entity
```

**구현 작업**:
1. `lib/supabase/queries.ts` 파일 생성
2. 공통 쿼리 패턴 구현:
   ```typescript
   // 사용자별 데이터 조회 (RLS 자동 적용)
   export async function queryUserData<T>(
     table: string,
     userId: string,
     options?: QueryOptions
   ): Promise<T[]>
   
   // 단일 레코드 조회
   export async function queryById<T>(
     table: string,
     id: string
   ): Promise<T | null>
   
   // 페이지네이션 지원 조회
   export async function queryPaginated<T>(
     table: string,
     page: number,
     pageSize: number
   ): Promise<PaginatedResponse<T>>
   ```
3. 에러 처리 표준화 (RLS 위반, 네트워크 오류 등)
4. 쿼리 결과 캐싱 전략 정의 (선택사항)

**기술 스택**:
- `@supabase/supabase-js` Query Builder
- TypeScript Generics
- Error Handling

**검증 기준**:
- [ ] 모든 쿼리 헬퍼가 RLS 정책을 준수함
- [ ] 에러가 적절히 처리되고 사용자에게 전달됨
- [ ] 타입 안정성이 보장됨

**의존성**: 1.1 (타입 시스템)

---

### 1.5. 파일 업로드 인프라 구축 (Post Attachments)

**목표**: Supabase Storage를 활용한 파일 업로드 및 다운로드 기능 구현

**데이터 흐름**:
```
File Input → File Validation → Supabase Storage Upload → Storage URL → post_attachments 테이블 INSERT
```

**구현 작업**:
1. `lib/supabase/storage.ts` 파일 생성
   ```typescript
   // 파일 업로드
   export async function uploadFile(
     bucket: string,
     path: string,
     file: File
   ): Promise<string> // file_url 반환
   
   // 파일 다운로드 URL 생성
   export async function getFileUrl(
     bucket: string,
     path: string
   ): Promise<string>
   ```
2. Supabase Storage 버킷 설정 확인 (`post-attachments` 버킷)
3. Storage RLS 정책 설정 (사용자는 자신의 파일만 접근)
4. 파일 타입 검증 (`lib/utils/file.ts` 확장)
   - PDF, Image, Audio, Video 타입별 검증
   - 파일 크기 제한

**기술 스택**:
- Supabase Storage API
- `@supabase/supabase-js` Storage Client
- File API (Browser)

**검증 기준**:
- [ ] 파일 업로드가 성공적으로 완료됨
- [ ] 업로드된 파일 URL이 `post_attachments` 테이블에 저장됨
- [ ] RLS 정책으로 다른 사용자의 파일 접근이 차단됨

**의존성**: 1.1 (타입 시스템), 1.3 (인증 상태)

---

## Phase 2: Core Logic (주요 비즈니스 기능의 Read/Write)

### 2.1. Posts 데이터 페칭 및 목록 조회

**목표**: `posts` 테이블에서 사용자별 학습 노트 목록을 조회하고 상태 관리

**데이터 흐름**:
```
Page Load → usePosts Hook → postService.getPosts() → Supabase Query → posts 테이블 → PostsContext State → PostList Component
```

**구현 작업**:
1. `domain/posts/services/postService.ts` 구현
   ```typescript
   // Supabase: posts 테이블 조회 (user_id 필터, created_at DESC 정렬)
   // JOIN: ai_results 테이블 (LEFT JOIN)
   export async function getPosts(userId: string): Promise<Post[]>
   ```
2. `domain/posts/hooks/usePosts.ts` 구현
   - React Query 또는 SWR 사용 (선택사항)
   - 로딩 상태, 에러 상태 관리
   - `PostsContext`와 통합
3. `contexts/PostsContext.tsx` 수정
   - Mock 데이터 제거
   - Supabase에서 데이터 페칭하도록 변경
   - `usePosts` 훅과 연동
4. `app/(main)/posts/page.tsx`에서 데이터 바인딩 확인

**기술 스택**:
- `@supabase/supabase-js` Query Builder
- React Hooks (useState, useEffect)
- React Context API

**검증 기준**:
- [ ] `/posts` 페이지에서 사용자의 학습 노트 목록이 표시됨
- [ ] RLS 정책으로 다른 사용자의 데이터는 조회되지 않음
- [ ] 로딩 상태와 에러 상태가 올바르게 표시됨

**의존성**: 1.1, 1.2, 1.3, 1.4

---

### 2.2. Post 생성 및 AI 결과 저장

**목표**: 학습 노트 생성 시 `posts` 테이블에 저장하고, AI 처리 후 `ai_results` 테이블에 저장

**데이터 흐름**:
```
Form Submit → Validation → postService.createPost() → posts INSERT → AI Processing → ai_results INSERT → PostsContext Update → UI Refresh
```

**구현 작업**:
1. `domain/posts/services/postService.ts`에 생성 함수 구현
   ```typescript
   // Supabase: posts 테이블 INSERT
   // 트랜잭션: posts INSERT → AI 처리 → ai_results INSERT
   export async function createPost(
     userId: string,
     data: CreatePostData
   ): Promise<Post>
   ```
2. `domain/ai/services/aiService.ts` 구현
   - AI API 호출 (Mock 또는 실제 API)
   - 응답 파싱 및 검증
3. `app/(main)/posts/new/page.tsx` 폼 제출 핸들러 구현
   - 폼 데이터 검증
   - `postService.createPost()` 호출
   - 성공 시 `/posts/{id}`로 리다이렉트
4. `contexts/PostsContext.tsx`에 새 Post 추가 로직 연동

**기술 스택**:
- `@supabase/supabase-js` Insert API
- Supabase Transactions (PostgreSQL)
- React Hook Form (선택사항)

**검증 기준**:
- [ ] 새 학습 노트가 `posts` 테이블에 저장됨
- [ ] AI 처리 후 `ai_results` 테이블에 결과가 저장됨
- [ ] 생성 후 목록 페이지에서 새 Post가 표시됨

**의존성**: 2.1, 1.5 (파일 첨부 시)

---

### 2.3. Post 상세 조회 및 AI 결과 표시

**목표**: 단일 Post와 연관된 AI 결과를 함께 조회하여 상세 페이지에 표시

**데이터 흐름**:
```
Route Param (id) → usePost Hook → postService.getPost() → Supabase Query (JOIN ai_results) → PostDetail Component
```

**구현 작업**:
1. `domain/posts/services/postService.ts`에 단일 조회 함수 구현
   ```typescript
   // Supabase: posts 테이블 조회 (id로)
   // JOIN: ai_results 테이블 (LEFT JOIN)
   // JOIN: post_attachments 테이블 (LEFT JOIN)
   export async function getPost(
     postId: string,
     userId: string
   ): Promise<Post | null>
   ```
2. `domain/posts/hooks/usePost.ts` 구현
   - 동적 라우트 파라미터에서 `postId` 추출
   - 로딩 상태, 에러 상태 관리
3. `app/(main)/posts/[id]/page.tsx` 구현
   - `usePost` 훅 사용
   - Post 상세 정보 표시
   - AI 결과 섹션 표시 (있을 경우)
   - 첨부 파일 목록 표시

**기술 스택**:
- `@supabase/supabase-js` Query Builder (JOIN)
- Next.js Dynamic Routes
- React Hooks

**검증 기준**:
- [ ] `/posts/{id}` 페이지에서 Post 상세 정보가 표시됨
- [ ] AI 결과가 있을 경우 올바르게 표시됨
- [ ] 첨부 파일이 있을 경우 목록이 표시됨
- [ ] 존재하지 않는 Post 접근 시 404 처리됨

**의존성**: 2.1

---

### 2.4. Post 수정 및 업데이트

**목표**: 기존 Post의 제목, 내용을 수정하고 `updated_at` 자동 갱신

**데이터 흐름**:
```
Edit Form → Validation → postService.updatePost() → posts UPDATE → PostsContext Update → UI Refresh
```

**구현 작업**:
1. `domain/posts/services/postService.ts`에 수정 함수 구현
   ```typescript
   // Supabase: posts 테이블 UPDATE (id와 user_id로 필터)
   // RLS 정책: auth.uid() = user_id
   export async function updatePost(
     postId: string,
     userId: string,
     updates: Partial<Post>
   ): Promise<Post>
   ```
2. `app/(main)/posts/[id]/page.tsx`에 수정 UI 추가
   - 수정 모드 토글
   - 폼 제출 핸들러
3. `contexts/PostsContext.tsx`에 업데이트 로직 연동

**기술 스택**:
- `@supabase/supabase-js` Update API
- React State Management

**검증 기준**:
- [ ] Post 수정이 `posts` 테이블에 반영됨
- [ ] `updated_at` 필드가 자동으로 갱신됨
- [ ] 목록 페이지에서 수정된 내용이 표시됨

**의존성**: 2.3

---

### 2.5. Post 삭제 및 관련 데이터 정리

**목표**: Post 삭제 시 CASCADE로 연관된 `ai_results`, `post_attachments` 자동 삭제

**데이터 흐름**:
```
Delete Action → Confirmation → postService.deletePost() → posts DELETE (CASCADE) → PostsContext Update → Redirect to List
```

**구현 작업**:
1. `domain/posts/services/postService.ts`에 삭제 함수 구현
   ```typescript
   // Supabase: posts 테이블 DELETE (id와 user_id로 필터)
   // CASCADE: ai_results, post_attachments 자동 삭제
   export async function deletePost(
     postId: string,
     userId: string
   ): Promise<void>
   ```
2. `app/(main)/posts/[id]/page.tsx`에 삭제 버튼 추가
   - 삭제 확인 다이얼로그
   - 삭제 후 목록 페이지로 리다이렉트
3. `contexts/PostsContext.tsx`에 삭제 로직 연동

**기술 스택**:
- `@supabase/supabase-js` Delete API
- PostgreSQL CASCADE DELETE

**검증 기준**:
- [ ] Post 삭제 시 `posts` 테이블에서 레코드가 삭제됨
- [ ] 연관된 `ai_results`, `post_attachments`도 자동 삭제됨
- [ ] 목록 페이지에서 삭제된 Post가 제거됨

**의존성**: 2.3

---

### 2.6. Subjects 데이터 페칭 및 관리

**목표**: `subjects` 테이블에서 사용자별 과목 목록 조회 및 CRUD

**데이터 흐름**:
```
App Load → useSubjects Hook → subjectService.getSubjects() → Supabase Query → subjects 테이블 → AppContext State → UI Components
```

**구현 작업**:
1. `domain/courses/services/subjectService.ts` 파일 생성 및 구현
   ```typescript
   // Supabase: subjects 테이블 조회 (user_id 필터, sort_order 정렬)
   export async function getSubjects(userId: string): Promise<Subject[]>
   export async function createSubject(userId: string, data: CreateSubjectData): Promise<Subject>
   export async function updateSubject(subjectId: string, userId: string, updates: Partial<Subject>): Promise<Subject>
   export async function deleteSubject(subjectId: string, userId: string): Promise<void>
   ```
2. `domain/courses/hooks/useSubjects.ts` 구현
3. `contexts/AppContext.tsx` 수정
   - Mock 데이터 제거
   - Supabase에서 데이터 페칭
4. Post 생성 폼에 Subject 선택 드롭다운 추가

**기술 스택**:
- `@supabase/supabase-js` Query Builder
- React Context API

**검증 기준**:
- [ ] 사용자의 과목 목록이 올바르게 조회됨
- [ ] 새 과목 생성이 가능함
- [ ] Post 생성 시 과목 선택이 가능함

**의존성**: 1.1, 1.2, 1.3, 1.4

---

### 2.7. Courses 데이터 페칭 및 관리 (Phase 2)

**목표**: `courses` 테이블에서 사용자별 코스 목록 조회 및 CRUD

**데이터 흐름**:
```
Courses Page → useCourses Hook → courseService.getCourses() → Supabase Query → courses 테이블 → AppContext State → CourseList Component
```

**구현 작업**:
1. `domain/courses/services/courseService.ts` 구현
   ```typescript
   // Supabase: courses 테이블 조회 (user_id 필터, created_at DESC 정렬)
   // JOIN: subjects 테이블 (LEFT JOIN)
   export async function getCourses(userId: string): Promise<Course[]>
   export async function getCourse(courseId: string, userId: string): Promise<Course | null>
   export async function createCourse(userId: string, data: CreateCourseData): Promise<Course>
   ```
2. `domain/courses/hooks/useCourses.ts` 구현
3. `contexts/AppContext.tsx`에 Courses 상태 추가
4. `app/(main)/courses/page.tsx` 구현
   - 코스 목록 표시
   - 코스 생성 폼

**기술 스택**:
- `@supabase/supabase-js` Query Builder (JOIN)
- React Context API

**검증 기준**:
- [ ] 사용자의 코스 목록이 올바르게 조회됨
- [ ] 코스 생성 시 `subjects`와 연관됨
- [ ] Post 생성 시 코스 선택이 가능함

**의존성**: 2.6 (Subjects)

---

## Phase 3: Interaction & Feedback (상태 변경, 알림, 에러 핸들링)

### 3.1. 로딩 상태 및 스켈레톤 UI 구현

**목표**: 데이터 페칭 중 로딩 상태를 명확히 표시하고 사용자 경험 개선

**데이터 흐름**:
```
Data Fetch Start → Loading State = true → Skeleton UI → Data Fetch Complete → Loading State = false → Actual Content
```

**구현 작업**:
1. `components/common/LoadingSpinner.tsx` 개선
   - 다양한 크기 옵션 추가
   - 인라인/풀스크린 모드 지원
2. `components/common/SkeletonLoader.tsx` 생성
   - PostCard 스켈레톤
   - PostDetail 스켈레톤
3. 각 Hook에서 로딩 상태 반환
   - `usePosts`, `usePost`, `useCourses` 등
4. 페이지 컴포넌트에서 로딩 상태에 따라 스켈레톤 표시

**기술 스택**:
- React State Management
- Tailwind CSS (애니메이션)
- Shadcn/ui Skeleton 컴포넌트 (선택사항)

**검증 기준**:
- [ ] 데이터 페칭 중 스켈레톤 UI가 표시됨
- [ ] 로딩 상태가 명확하게 구분됨
- [ ] 사용자가 대기 중임을 인지할 수 있음

**의존성**: 2.1, 2.3, 2.7

---

### 3.2. 에러 처리 및 사용자 피드백

**목표**: 네트워크 오류, RLS 위반, 유효성 검증 오류 등을 사용자 친화적으로 처리

**데이터 흐름**:
```
API Call → Error Occurred → Error Handler → Error Type Detection → User-Friendly Message → UI Display
```

**구현 작업**:
1. `lib/utils/errors.ts` 파일 생성
   ```typescript
   // Supabase 에러 코드 매핑
   export function getErrorMessage(error: unknown): string
   export function isRLSError(error: unknown): boolean
   export function isNetworkError(error: unknown): boolean
   ```
2. `components/common/ErrorBoundary.tsx` 개선
   - React Error Boundary 구현
   - 에러 타입별 UI 표시
3. 각 Service 함수에 에러 처리 추가
   - Try-catch 블록
   - 에러 로깅 (개발 환경)
   - 사용자 친화적 메시지 반환
4. Toast 알림 시스템 추가 (선택사항)
   - `react-hot-toast` 또는 Shadcn/ui Toast

**기술 스택**:
- React Error Boundary
- TypeScript Error Handling
- Toast Notification Library (선택사항)

**검증 기준**:
- [ ] 네트워크 오류 시 적절한 메시지 표시
- [ ] RLS 위반 시 권한 오류 메시지 표시
- [ ] 유효성 검증 오류 시 필드별 에러 표시

**의존성**: 모든 Phase 2 작업

---

### 3.3. 낙관적 업데이트 (Optimistic Updates)

**목표**: 사용자 액션에 즉시 반응하여 UI를 업데이트하고, 백그라운드에서 서버 동기화

**데이터 흐름**:
```
User Action → Optimistic UI Update → API Call → Success/Failure → Rollback if Failed
```

**구현 작업**:
1. `contexts/PostsContext.tsx`에 낙관적 업데이트 로직 추가
   - Post 생성: 즉시 목록에 추가 → API 호출 → 실패 시 롤백
   - Post 수정: 즉시 UI 업데이트 → API 호출 → 실패 시 롤백
   - Post 삭제: 즉시 목록에서 제거 → API 호출 → 실패 시 롤백
2. 에러 발생 시 롤백 메커니즘 구현
3. 사용자에게 실패 알림 표시

**기술 스택**:
- React State Management
- Error Handling

**검증 기준**:
- [ ] Post 생성 시 즉시 목록에 표시됨
- [ ] API 실패 시 변경사항이 롤백됨
- [ ] 사용자에게 실패 알림이 표시됨

**의존성**: 2.2, 2.4, 2.5

---

### 3.4. 실시간 데이터 동기화 (선택사항)

**목표**: Supabase Realtime을 활용하여 여러 탭/기기 간 데이터 자동 동기화

**데이터 흐름**:
```
Supabase Realtime Subscription → Post Changes → Context Update → UI Auto Refresh
```

**구현 작업**:
1. `lib/supabase/realtime.ts` 파일 생성
   ```typescript
   // Realtime 구독 설정
   export function subscribeToPosts(
     userId: string,
     callback: (payload: RealtimePayload) => void
   ): RealtimeChannel
   ```
2. `contexts/PostsContext.tsx`에 Realtime 구독 추가
   - Post 생성/수정/삭제 이벤트 구독
   - 이벤트 발생 시 Context 상태 업데이트
3. 컴포넌트 언마운트 시 구독 해제

**기술 스택**:
- Supabase Realtime API
- WebSocket

**검증 기준**:
- [ ] 다른 탭에서 Post 생성 시 현재 탭에 자동 반영됨
- [ ] 구독 해제가 올바르게 작동함

**의존성**: 2.1, 2.2, 2.4, 2.5

---

### 3.5. 폼 유효성 검증 및 사용자 피드백

**목표**: 클라이언트 사이드 폼 검증으로 즉각적인 피드백 제공

**데이터 흐름**:
```
User Input → Validation Rules → Validation Result → Error Display → Submit Prevention
```

**구현 작업**:
1. `lib/utils/validation.ts` 확장
   - Post 제목/내용 검증 규칙
   - Subject/Course 생성 검증 규칙
2. `components/posts/PostForm.tsx`에 검증 로직 추가
   - 실시간 검증 (onChange)
   - 제출 전 최종 검증
   - 필드별 에러 메시지 표시
3. React Hook Form 통합 (선택사항)

**기술 스택**:
- TypeScript Validation
- React Hook Form (선택사항)
- Zod 또는 Yup (선택사항)

**검증 기준**:
- [ ] 필수 필드 미입력 시 제출 불가
- [ ] 잘못된 형식 입력 시 즉시 에러 표시
- [ ] 검증 통과 시에만 API 호출

**의존성**: 2.2, 2.6, 2.7

---

### 3.6. 검색 및 필터링 기능

**목표**: Post 목록에서 제목/내용 검색 및 Subject/Course 필터링

**데이터 흐름**:
```
Search Input → Debounce → postService.searchPosts() → Supabase Full-Text Search → Filtered Results → UI Update
```

**구현 작업**:
1. `domain/posts/services/postService.ts`에 검색 함수 추가
   ```typescript
   // Supabase: posts 테이블 Full-Text Search
   // PostgreSQL: to_tsvector, to_tsquery 활용
   export async function searchPosts(
     userId: string,
     query: string
   ): Promise<Post[]>
   ```
2. `hooks/useDebounce.ts` 활용하여 검색어 디바운싱
3. `app/(main)/posts/page.tsx`에 검색 UI 추가
   - 검색 입력 필드
   - Subject/Course 필터 드롭다운
4. URL 쿼리 파라미터와 동기화 (선택사항)

**기술 스택**:
- PostgreSQL Full-Text Search
- React Hooks (useState, useEffect)
- URL Search Params (선택사항)

**검증 기준**:
- [ ] 검색어 입력 시 관련 Post가 필터링됨
- [ ] Subject/Course 필터가 올바르게 작동함
- [ ] 검색 성능이 적절함 (디바운싱)

**의존성**: 2.1, 2.6

---

### 3.7. 페이지네이션 구현

**목표**: Post 목록을 페이지 단위로 나누어 성능 최적화

**데이터 흐름**:
```
Page Load → Current Page State → postService.getPostsPaginated() → Supabase LIMIT/OFFSET → Paginated Results → UI
```

**구현 작업**:
1. `domain/posts/services/postService.ts`에 페이지네이션 함수 추가
   ```typescript
   // Supabase: posts 테이블 LIMIT/OFFSET 쿼리
   export async function getPostsPaginated(
     userId: string,
     page: number,
     pageSize: number
   ): Promise<PaginatedResponse<Post>>
   ```
2. `domain/posts/hooks/usePosts.ts`에 페이지네이션 상태 추가
3. `components/posts/PostList.tsx`에 페이지네이션 UI 추가
   - 이전/다음 버튼
   - 페이지 번호 표시

**기술 스택**:
- PostgreSQL LIMIT/OFFSET
- React State Management

**검증 기준**:
- [ ] 페이지당 Post 수가 제한됨
- [ ] 페이지 이동이 올바르게 작동함
- [ ] 성능이 개선됨 (대량 데이터)

**의존성**: 2.1

---

## 구현 우선순위 요약

### 🔴 Critical Path (필수)
1. **1.1** - 타입 시스템 구축
2. **1.2** - Google OAuth 인증 플로우 구현
3. **1.3** - 인증 상태 관리
4. **1.4** - 쿼리 헬퍼 함수
5. **2.1** - Posts 목록 조회
6. **2.2** - Post 생성
7. **2.3** - Post 상세 조회
8. **3.1** - 로딩 상태
9. **3.2** - 에러 처리

### 🟡 High Priority (중요)
9. **2.4** - Post 수정
10. **2.5** - Post 삭제
11. **2.6** - Subjects 관리
12. **3.5** - 폼 유효성 검증

### 🟢 Medium Priority (선택)
13. **1.5** - 파일 업로드
14. **2.7** - Courses 관리
15. **3.3** - 낙관적 업데이트
16. **3.6** - 검색 및 필터링
17. **3.7** - 페이지네이션

### ⚪ Low Priority (향후)
18. **3.4** - 실시간 동기화

---

## 체크리스트 사용 가이드

1. **단계별 진행**: 각 단계를 순서대로 완료하고 검증 기준을 확인
2. **의존성 확인**: 의존성이 있는 작업은 먼저 완료되어야 함
3. **컨펌 후 진행**: 각 단계 완료 후 검증 기준을 모두 통과했는지 확인
4. **점진적 통합**: Mock 데이터에서 Supabase로 점진적으로 전환

---

## 📋 구현 체크리스트

### Phase 1: Foundation (공통 유틸리티 및 기본 데이터 연결)

#### 1.1. Supabase 타입 생성 및 타입 시스템 구축 🔴
- [ ] Supabase CLI로 타입 생성 실행
- [ ] `types/database.ts` 파일 생성 및 검증
- [ ] Domain Types와 Supabase 타입 매핑 함수 작성
- [ ] 타입 변환 유틸리티 함수 구현 (`lib/utils/types.ts`)
- [ ] 타입 에러 없이 빌드 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 1.2. Google OAuth 인증 플로우 구현 🔴
- [ ] Supabase 프로젝트에서 Google OAuth Provider 활성화
- [ ] Google Cloud Console에서 OAuth 클라이언트 ID/Secret 발급
- [ ] Authorized redirect URI 설정 확인
- [ ] `signInWithGoogle()` 함수 검증 및 개선
- [ ] `app/(auth)/callback/route.ts` 콜백 라우트 구현 및 검증
- [ ] OAuth 인증 코드(`code`) 파라미터 처리 확인
- [ ] OAuth 에러(`error`) 파라미터 처리 확인
- [ ] `exchangeCodeForSession()` 호출 및 에러 처리
- [ ] 세션 교환 실패 시 에러 처리 및 리다이렉트
- [ ] 원래 가려던 페이지로 리다이렉트 (`redirect` 쿼리 파라미터)
- [ ] 에러 타입별 메시지 매핑 구현
- [ ] `app/(auth)/login/page.tsx` 로그인 페이지 연동 확인
- [ ] 로그인 버튼 클릭 핸들러 동작 확인
- [ ] 로딩 상태 표시 확인
- [ ] 에러 메시지 표시 확인
- [ ] `middleware.ts` 세션 관리 연동 확인
- [ ] 보호된 경로 접근 시 세션 확인 동작 확인
- [ ] 미인증 사용자 로그인 페이지 리다이렉트 확인
- [ ] 원래 가려던 경로 저장 및 복원 확인
- [ ] 전체 OAuth 플로우 End-to-End 테스트

**완료일**: ___________  
**담당자**: ___________

---

#### 1.3. 인증 상태 관리 및 사용자 프로필 페칭 🔴
- [ ] `authService.ts`에 `getProfile()` 함수 구현
- [ ] `AuthContext.tsx`에 Supabase 세션 변경 리스너 추가
- [ ] 프로필 자동 페칭 로직 구현
- [ ] 프로필 정보를 Context 상태에 저장
- [ ] 세션 갱신 로직 연동
- [ ] Google OAuth 로그인 후 프로필 자동 로드 확인
- [ ] UI에 프로필 정보 표시 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 1.4. Supabase 쿼리 헬퍼 함수 작성 🔴
- [ ] `lib/supabase/queries.ts` 파일 생성
- [ ] `queryUserData()` 함수 구현
- [ ] `queryById()` 함수 구현
- [ ] `queryPaginated()` 함수 구현
- [ ] 에러 처리 표준화
- [ ] RLS 정책 준수 확인
- [ ] 타입 안정성 검증

**완료일**: ___________  
**담당자**: ___________

---

#### 1.5. 파일 업로드 인프라 구축 (Post Attachments) 🟢
- [ ] `lib/supabase/storage.ts` 파일 생성
- [ ] `uploadFile()` 함수 구현
- [ ] `getFileUrl()` 함수 구현
- [ ] Supabase Storage 버킷 설정 (`post-attachments`)
- [ ] Storage RLS 정책 설정
- [ ] 파일 타입 검증 로직 확장 (`lib/utils/file.ts`)
- [ ] 파일 업로드 테스트
- [ ] `post_attachments` 테이블 연동 확인

**완료일**: ___________  
**담당자**: ___________

---

### Phase 2: Core Logic (주요 비즈니스 기능의 Read/Write)

#### 2.1. Posts 데이터 페칭 및 목록 조회 🔴
- [ ] `postService.getPosts()` 함수 구현
- [ ] `ai_results` 테이블 LEFT JOIN 구현
- [ ] `usePosts` 훅 구현
- [ ] 로딩 상태, 에러 상태 관리
- [ ] `PostsContext.tsx`에서 Mock 데이터 제거
- [ ] Supabase 데이터 페칭으로 전환
- [ ] `/posts` 페이지 데이터 바인딩 확인
- [ ] RLS 정책 검증 (다른 사용자 데이터 접근 차단)

**완료일**: ___________  
**담당자**: ___________

---

#### 2.2. Post 생성 및 AI 결과 저장 🔴
- [ ] `postService.createPost()` 함수 구현
- [ ] `posts` 테이블 INSERT 로직
- [ ] `aiService.processText()` 함수 구현
- [ ] AI API 호출 및 응답 파싱
- [ ] `ai_results` 테이블 INSERT 로직
- [ ] 트랜잭션 처리 (posts → AI 처리 → ai_results)
- [ ] `app/(main)/posts/new/page.tsx` 폼 제출 핸들러 구현
- [ ] 폼 데이터 검증
- [ ] 성공 시 리다이렉트 처리
- [ ] `PostsContext`에 새 Post 추가 로직 연동
- [ ] 생성 후 목록 페이지에서 새 Post 표시 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 2.3. Post 상세 조회 및 AI 결과 표시 🔴
- [ ] `postService.getPost()` 함수 구현
- [ ] `ai_results` 테이블 LEFT JOIN 구현
- [ ] `post_attachments` 테이블 LEFT JOIN 구현
- [ ] `usePost` 훅 구현
- [ ] 동적 라우트 파라미터에서 `postId` 추출
- [ ] 로딩 상태, 에러 상태 관리
- [ ] `app/(main)/posts/[id]/page.tsx` 구현
- [ ] Post 상세 정보 표시
- [ ] AI 결과 섹션 표시 (있을 경우)
- [ ] 첨부 파일 목록 표시
- [ ] 404 처리 (존재하지 않는 Post)

**완료일**: ___________  
**담당자**: ___________

---

#### 2.4. Post 수정 및 업데이트 🟡
- [ ] `postService.updatePost()` 함수 구현
- [ ] `posts` 테이블 UPDATE 로직 (RLS 정책 준수)
- [ ] `updated_at` 자동 갱신 확인
- [ ] `app/(main)/posts/[id]/page.tsx`에 수정 UI 추가
- [ ] 수정 모드 토글 기능
- [ ] 폼 제출 핸들러 구현
- [ ] `PostsContext`에 업데이트 로직 연동
- [ ] 목록 페이지에서 수정된 내용 표시 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 2.5. Post 삭제 및 관련 데이터 정리 🟡
- [ ] `postService.deletePost()` 함수 구현
- [ ] `posts` 테이블 DELETE 로직 (RLS 정책 준수)
- [ ] CASCADE 삭제 확인 (ai_results, post_attachments)
- [ ] `app/(main)/posts/[id]/page.tsx`에 삭제 버튼 추가
- [ ] 삭제 확인 다이얼로그 구현
- [ ] 삭제 후 목록 페이지로 리다이렉트
- [ ] `PostsContext`에 삭제 로직 연동
- [ ] 목록 페이지에서 삭제된 Post 제거 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 2.6. Subjects 데이터 페칭 및 관리 🟡
- [ ] `domain/courses/services/subjectService.ts` 파일 생성
- [ ] `getSubjects()` 함수 구현
- [ ] `createSubject()` 함수 구현
- [ ] `updateSubject()` 함수 구현
- [ ] `deleteSubject()` 함수 구현
- [ ] `useSubjects` 훅 구현
- [ ] `AppContext.tsx`에서 Mock 데이터 제거
- [ ] Supabase 데이터 페칭으로 전환
- [ ] Post 생성 폼에 Subject 선택 드롭다운 추가
- [ ] 사용자별 과목 목록 조회 확인
- [ ] 새 과목 생성 기능 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 2.7. Courses 데이터 페칭 및 관리 (Phase 2) 🟢
- [ ] `courseService.getCourses()` 함수 구현
- [ ] `subjects` 테이블 LEFT JOIN 구현
- [ ] `getCourse()` 함수 구현
- [ ] `createCourse()` 함수 구현
- [ ] `useCourses` 훅 구현
- [ ] `AppContext.tsx`에 Courses 상태 추가
- [ ] `app/(main)/courses/page.tsx` 구현
- [ ] 코스 목록 표시
- [ ] 코스 생성 폼 구현
- [ ] Post 생성 시 코스 선택 기능 확인

**완료일**: ___________  
**담당자**: ___________

---

### Phase 3: Interaction & Feedback (상태 변경, 알림, 에러 핸들링)

#### 3.1. 로딩 상태 및 스켈레톤 UI 구현 🔴
- [ ] `LoadingSpinner.tsx` 개선 (크기 옵션, 모드 지원)
- [ ] `SkeletonLoader.tsx` 생성
- [ ] PostCard 스켈레톤 컴포넌트 구현
- [ ] PostDetail 스켈레톤 컴포넌트 구현
- [ ] 각 Hook에서 로딩 상태 반환 (`usePosts`, `usePost`, `useCourses`)
- [ ] 페이지 컴포넌트에서 스켈레톤 표시 로직 구현
- [ ] 데이터 페칭 중 스켈레톤 UI 표시 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 3.2. 에러 처리 및 사용자 피드백 🔴
- [ ] `lib/utils/errors.ts` 파일 생성
- [ ] `getErrorMessage()` 함수 구현
- [ ] `isRLSError()` 함수 구현
- [ ] `isNetworkError()` 함수 구현
- [ ] `ErrorBoundary.tsx` 개선
- [ ] React Error Boundary 구현
- [ ] 에러 타입별 UI 표시
- [ ] 각 Service 함수에 에러 처리 추가 (try-catch)
- [ ] 에러 로깅 (개발 환경)
- [ ] 사용자 친화적 메시지 반환
- [ ] Toast 알림 시스템 추가 (선택사항)
- [ ] 네트워크 오류 처리 확인
- [ ] RLS 위반 오류 처리 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 3.3. 낙관적 업데이트 (Optimistic Updates) 🟢
- [ ] `PostsContext.tsx`에 낙관적 업데이트 로직 추가
- [ ] Post 생성: 즉시 목록에 추가 → API 호출 → 실패 시 롤백
- [ ] Post 수정: 즉시 UI 업데이트 → API 호출 → 실패 시 롤백
- [ ] Post 삭제: 즉시 목록에서 제거 → API 호출 → 실패 시 롤백
- [ ] 에러 발생 시 롤백 메커니즘 구현
- [ ] 사용자에게 실패 알림 표시
- [ ] 낙관적 업데이트 동작 확인
- [ ] 롤백 동작 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 3.4. 실시간 데이터 동기화 (선택사항) ⚪
- [ ] `lib/supabase/realtime.ts` 파일 생성
- [ ] `subscribeToPosts()` 함수 구현
- [ ] `PostsContext.tsx`에 Realtime 구독 추가
- [ ] Post 생성/수정/삭제 이벤트 구독
- [ ] 이벤트 발생 시 Context 상태 업데이트
- [ ] 컴포넌트 언마운트 시 구독 해제
- [ ] 다른 탭에서 Post 생성 시 자동 반영 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 3.5. 폼 유효성 검증 및 사용자 피드백 🟡
- [ ] `lib/utils/validation.ts` 확장
- [ ] Post 제목/내용 검증 규칙 추가
- [ ] Subject/Course 생성 검증 규칙 추가
- [ ] `PostForm.tsx`에 검증 로직 추가
- [ ] 실시간 검증 (onChange)
- [ ] 제출 전 최종 검증
- [ ] 필드별 에러 메시지 표시
- [ ] React Hook Form 통합 (선택사항)
- [ ] 필수 필드 검증 확인
- [ ] 형식 검증 확인

**완료일**: ___________  
**담당자**: ___________

---

#### 3.6. 검색 및 필터링 기능 🟢
- [ ] `postService.searchPosts()` 함수 구현
- [ ] PostgreSQL Full-Text Search 구현 (`to_tsvector`, `to_tsquery`)
- [ ] `useDebounce` 훅 활용
- [ ] `app/(main)/posts/page.tsx`에 검색 UI 추가
- [ ] 검색 입력 필드 구현
- [ ] Subject/Course 필터 드롭다운 구현
- [ ] URL 쿼리 파라미터와 동기화 (선택사항)
- [ ] 검색 기능 동작 확인
- [ ] 필터 기능 동작 확인
- [ ] 검색 성능 확인 (디바운싱)

**완료일**: ___________  
**담당자**: ___________

---

#### 3.7. 페이지네이션 구현 🟢
- [ ] `postService.getPostsPaginated()` 함수 구현
- [ ] PostgreSQL LIMIT/OFFSET 쿼리 구현
- [ ] `usePosts` 훅에 페이지네이션 상태 추가
- [ ] `PostList.tsx`에 페이지네이션 UI 추가
- [ ] 이전/다음 버튼 구현
- [ ] 페이지 번호 표시 구현
- [ ] 페이지 이동 기능 확인
- [ ] 성능 개선 확인 (대량 데이터)

**완료일**: ___________  
**담당자**: ___________

---

## 📊 전체 진행 상황

### Phase 1: Foundation
- [ ] 1.1 타입 시스템 구축
- [ ] 1.2 Google OAuth 인증 플로우 구현
- [ ] 1.3 인증 상태 관리
- [ ] 1.4 쿼리 헬퍼 함수
- [ ] 1.5 파일 업로드 인프라

**진행률**: 0 / 5 (0%)

### Phase 2: Core Logic
- [ ] 2.1 Posts 목록 조회
- [ ] 2.2 Post 생성
- [ ] 2.3 Post 상세 조회
- [ ] 2.4 Post 수정
- [ ] 2.5 Post 삭제
- [ ] 2.6 Subjects 관리
- [ ] 2.7 Courses 관리

**진행률**: 0 / 7 (0%)

### Phase 3: Interaction & Feedback
- [ ] 3.1 로딩 상태
- [ ] 3.2 에러 처리
- [ ] 3.3 낙관적 업데이트
- [ ] 3.4 실시간 동기화
- [ ] 3.5 폼 유효성 검증
- [ ] 3.6 검색 및 필터링
- [ ] 3.7 페이지네이션

**진행률**: 0 / 7 (0%)

**전체 진행률**: 0 / 19 (0%)

---

## 📝 체크리스트 사용 방법

1. **단계별 체크**: 각 작업 항목을 완료할 때마다 체크박스에 체크
2. **완료일 기록**: 각 단계 완료 시 완료일과 담당자 기록
3. **검증 기준 확인**: 각 단계의 검증 기준을 모두 통과했는지 확인
4. **의존성 확인**: 의존성이 있는 작업은 선행 작업 완료 후 진행
5. **진행률 업데이트**: Phase별 진행률과 전체 진행률을 주기적으로 업데이트

---

**작성일**: 2026-01-29  
**프로젝트**: SSU-Note  
**버전**: 1.0
