# SSU-Note 데이터베이스 마이그레이션 가이드

## 📋 목차
1. [사전 준비](#1-사전-준비)
2. [SQL 실행](#2-sql-실행)
3. [타입 생성](#3-타입-생성)
4. [확인 사항](#4-확인-사항)

---

## 1. 사전 준비

### 1.1 Supabase 프로젝트 확인
- [ ] Supabase 프로젝트가 생성되어 있고 접근 가능한지 확인
- [ ] Supabase Dashboard에 로그인 가능한지 확인
- [ ] 프로젝트 ID 확인 (타입 생성 시 필요)

### 1.2 필요한 정보
- Supabase 프로젝트 URL
- Supabase 프로젝트 ID (Dashboard > Settings > General)
- Supabase API Key (Dashboard > Settings > API)

---

## 2. SQL 실행

### 2.1 Supabase SQL Editor에서 실행

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **SQL 파일 복사**
   - `docs/db-schema-final.sql` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)

4. **SQL 실행**
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - "Run" 버튼 클릭 또는 Ctrl+Enter
   - 실행 완료까지 대기 (약 10-30초)

5. **결과 확인**
   - 에러가 없으면 성공
   - 에러 발생 시 에러 메시지 확인 및 수정

### 2.2 실행 순서 (중요)

SQL 파일은 **순서대로 실행**되도록 작성되어 있습니다:
1. 공통 함수 생성 (`update_updated_at_column`)
2. 테이블 생성 (profiles → subjects → courses → posts → ai_results → post_attachments → concepts → quizzes)
3. RLS 정책 적용
4. 인덱스 생성
5. 트리거 생성

**한 번에 전체 실행하는 것을 권장합니다.**

---

## 3. 타입 생성

### 3.1 Supabase CLI 설치 (필요 시)

```bash
npm install -g supabase
# 또는
pnpm add -g supabase
```

### 3.2 프로젝트 ID 확인

Supabase Dashboard > Settings > General > Reference ID

### 3.3 타입 생성 명령어

```bash
# 프로젝트 루트에서 실행
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > types/database.ts
```

예시:
```bash
npx supabase gen types typescript --project-id abcdefghijklmnop > types/database.ts
```

### 3.4 생성된 타입 확인

`types/database.ts` 파일이 생성되었는지 확인:
- 파일이 생성되었으면 성공
- 에러 발생 시 프로젝트 ID 확인

---

## 4. 확인 사항

### 4.1 테이블 생성 확인

Supabase Dashboard > Table Editor에서 다음 테이블들이 생성되었는지 확인:

**Phase 1 필수 테이블:**
- [ ] `profiles`
- [ ] `subjects`
- [ ] `courses`
- [ ] `posts`
- [ ] `ai_results`
- [ ] `post_attachments`

**Phase 2 테이블:**
- [ ] `concepts`
- [ ] `quizzes`

### 4.2 RLS 정책 확인

각 테이블의 "Policies" 탭에서 RLS 정책이 생성되었는지 확인:
- [ ] `profiles`: SELECT, UPDATE 정책
- [ ] `subjects`: SELECT, INSERT, UPDATE, DELETE 정책
- [ ] `courses`: SELECT, INSERT, UPDATE, DELETE 정책
- [ ] `posts`: SELECT, INSERT, UPDATE, DELETE 정책
- [ ] `ai_results`: SELECT, INSERT, UPDATE, DELETE 정책 (부모 post 확인)
- [ ] `post_attachments`: SELECT, INSERT, DELETE 정책 (부모 post 확인)
- [ ] `concepts`: SELECT, INSERT, UPDATE, DELETE 정책
- [ ] `quizzes`: SELECT, INSERT, UPDATE, DELETE 정책

### 4.3 인덱스 확인

각 테이블의 "Indexes" 탭에서 인덱스가 생성되었는지 확인:
- [ ] `profiles`: `idx_profiles_email`
- [ ] `subjects`: `idx_subjects_user_id`, `idx_subjects_user_slug`
- [ ] `courses`: `idx_courses_user_id`, `idx_courses_subject_id`, `idx_courses_created_at`, `idx_courses_user_created`
- [ ] `posts`: `idx_posts_user_id`, `idx_posts_course_id`, `idx_posts_subject_id`, `idx_posts_created_at`, `idx_posts_user_created`
- [ ] `ai_results`: `idx_ai_results_post_id`
- [ ] `post_attachments`: `idx_post_attachments_post_id`
- [ ] `concepts`: `idx_concepts_user_id`, `idx_concepts_course_id`, `idx_concepts_parent_id`
- [ ] `quizzes`: `idx_quizzes_user_id`, `idx_quizzes_course_id`, `idx_quizzes_post_id`

### 4.4 트리거 확인

각 테이블의 "Triggers" 탭에서 트리거가 생성되었는지 확인:
- [ ] `profiles`: `update_profiles_updated_at`, `on_auth_user_created`
- [ ] `subjects`: `update_subjects_updated_at`
- [ ] `courses`: `update_courses_updated_at`
- [ ] `posts`: `update_posts_updated_at`
- [ ] `ai_results`: `update_ai_results_updated_at`
- [ ] `concepts`: `update_concepts_updated_at`

### 4.5 함수 확인

Supabase Dashboard > Database > Functions에서 다음 함수가 생성되었는지 확인:
- [ ] `update_updated_at_column()` - updated_at 자동 갱신 함수
- [ ] `handle_new_user()` - auth.users 신규 사용자 프로필 자동 생성 함수

---

## 5. 테스트

### 5.1 프로필 자동 생성 테스트

1. Supabase Dashboard > Authentication > Users에서 새 사용자 생성 (또는 Google OAuth 로그인)
2. `profiles` 테이블에서 해당 사용자의 프로필이 자동 생성되었는지 확인

### 5.2 RLS 정책 테스트

1. Supabase Dashboard > SQL Editor에서 다음 쿼리 실행:

```sql
-- 현재 인증된 사용자 확인 (없으면 에러 발생)
SELECT auth.uid();

-- 본인 프로필 조회 (성공해야 함)
SELECT * FROM profiles WHERE id = auth.uid();

-- 다른 사용자 프로필 조회 시도 (실패해야 함)
SELECT * FROM profiles LIMIT 1;
```

### 5.3 데이터 생성 테스트

```sql
-- 과목 생성 테스트
INSERT INTO subjects (user_id, name, slug, color)
VALUES (auth.uid(), '테스트 과목', 'test', '#3B82F6');

-- 코스 생성 테스트
INSERT INTO courses (user_id, subject_id, title, description)
VALUES (
  auth.uid(),
  (SELECT id FROM subjects WHERE user_id = auth.uid() LIMIT 1),
  '테스트 코스',
  '테스트 설명'
);

-- 학습 노트 생성 테스트
INSERT INTO posts (user_id, course_id, title, content)
VALUES (
  auth.uid(),
  (SELECT id FROM courses WHERE user_id = auth.uid() LIMIT 1),
  '테스트 노트',
  '테스트 내용'
);
```

---

## 6. 문제 해결

### 6.1 일반적인 에러

#### "relation already exists"
- 테이블이 이미 존재하는 경우
- 해결: 기존 테이블 삭제 후 재실행 또는 `DROP TABLE IF EXISTS` 사용

#### "permission denied"
- RLS 정책 문제 또는 권한 문제
- 해결: Supabase Dashboard에서 RLS 정책 확인

#### "function does not exist"
- 함수가 생성되지 않은 경우
- 해결: SQL 파일을 처음부터 순서대로 실행

### 6.2 타입 생성 에러

#### "Project not found"
- 프로젝트 ID가 잘못된 경우
- 해결: Supabase Dashboard에서 정확한 프로젝트 ID 확인

#### "Authentication failed"
- API 키가 잘못되었거나 만료된 경우
- 해결: Supabase Dashboard > Settings > API에서 새 API 키 확인

---

## 7. 다음 단계

마이그레이션 완료 후:

1. **타입 파일 업데이트 확인**
   - `types/database.ts` 파일이 최신 상태인지 확인
   - `domain/posts/types.ts`, `domain/courses/types.ts` 등이 업데이트되었는지 확인

2. **서비스 레이어 연동**
   - `domain/posts/services/postService.ts`에서 Supabase 클라이언트 사용
   - `domain/courses/services/courseService.ts`에서 Supabase 클라이언트 사용

3. **Context 업데이트**
   - `contexts/PostsContext.tsx`에서 Mock 데이터 대신 Supabase 데이터 사용
   - `contexts/AppContext.tsx`에서 Mock 데이터 대신 Supabase 데이터 사용

4. **테스트**
   - 로그인 후 데이터 생성/조회 테스트
   - RLS 정책이 올바르게 작동하는지 확인

---

## 완료 ✅

모든 단계를 완료하면 데이터베이스 스키마가 준비되었습니다!
