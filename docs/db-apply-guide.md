# SSU-Note 데이터베이스 적용 가이드

## 📋 목차
1. [Migration 파일 점검](#1-migration-파일-점검)
2. [Supabase에 테이블 생성하기](#2-supabase에-테이블-생성하기)
3. [적용 후 확인 체크리스트](#3-적용-후-확인-체크리스트)

---

## 1. Migration 파일 점검

### 1.1 Migration 파일 위치 확인

Supabase CLI를 사용하는 경우, migration 파일은 다음 위치에 있어야 합니다:
```
supabase/
  migrations/
    YYYYMMDDHHMMSS_migration_name.sql
```

또는 프로젝트 루트에 `supabase/migrations/` 폴더가 있을 수 있습니다.

### 1.2 Migration 파일 점검 체크리스트

#### ✅ 순서 확인
Migration 파일은 **타임스탬프 순서**로 실행됩니다. 다음 순서를 확인하세요:

1. **함수 생성** (가장 먼저)
   - `update_updated_at_column()` 함수
   - `handle_new_user()` 함수

2. **테이블 생성** (의존성 순서)
   - `profiles` (auth.users 참조)
   - `subjects` (profiles 참조)
   - `courses` (profiles, subjects 참조)
   - `posts` (profiles, courses, subjects 참조)
   - `ai_results` (posts 참조)
   - `post_attachments` (posts 참조)
   - `concepts` (profiles, courses 참조)
   - `quizzes` (profiles, courses, posts 참조)

3. **RLS 정책** (테이블 생성 후)
4. **인덱스** (테이블 생성 후)
5. **트리거** (함수와 테이블 생성 후)

#### ✅ 중복 CREATE 확인
각 migration 파일에서 다음이 중복되지 않는지 확인:
- `CREATE TABLE` 문이 여러 파일에 분산되어 있지 않은지
- `CREATE FUNCTION` 문이 중복되지 않는지 (대신 `CREATE OR REPLACE FUNCTION` 사용 권장)
- `CREATE POLICY` 문이 중복되지 않는지

#### ✅ 의존성 확인
- `profiles` 테이블이 다른 모든 테이블보다 먼저 생성되는지
- `posts` 테이블이 `ai_results`, `post_attachments`보다 먼저 생성되는지
- `courses` 테이블이 `concepts`, `quizzes`보다 먼저 생성되는지

### 1.3 권장 Migration 파일 구조

**단일 파일 방식 (권장)**:
```
supabase/migrations/
  20250129000000_initial_schema.sql  (전체 스키마를 한 파일에)
```

**분리된 파일 방식**:
```
supabase/migrations/
  20250129000000_create_functions.sql
  20250129000001_create_profiles.sql
  20250129000002_create_subjects.sql
  20250129000003_create_courses.sql
  20250129000004_create_posts.sql
  20250129000005_create_ai_results.sql
  20250129000006_create_post_attachments.sql
  20250129000007_create_concepts.sql
  20250129000008_create_quizzes.sql
```

---

## 2. Supabase에 테이블 생성하기

### 방법 1: Supabase Dashboard SQL Editor (가장 간단, 권장)

#### 단계별 가이드

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 버튼 클릭

3. **SQL 파일 내용 복사**
   - `docs/db-schema-final.sql` 파일 열기
   - 전체 내용 선택 (Ctrl+A)
   - 복사 (Ctrl+C)

4. **SQL 실행**
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - "Run" 버튼 클릭 또는 `Ctrl+Enter`
   - 실행 완료까지 대기 (약 10-30초)

5. **결과 확인**
   - 성공: "Success. No rows returned" 메시지 표시
   - 실패: 에러 메시지 확인

#### 장점
- ✅ 가장 간단하고 빠름
- ✅ 즉시 실행 가능
- ✅ 에러 메시지가 명확함
- ✅ Supabase CLI 설치 불필요

#### 단점
- ❌ Migration 히스토리 관리가 어려움
- ❌ 팀 협업 시 일관성 유지 어려움

---

### 방법 2: Supabase CLI `db push` (협업 환경 권장)

#### 사전 준비

1. **Supabase CLI 설치**
   ```bash
   npm install -g supabase
   # 또는
   pnpm add -g supabase
   ```

2. **Supabase 프로젝트 연결**
   ```bash
   # 프로젝트 루트에서
   supabase link --project-ref <YOUR_PROJECT_ID>
   ```
   
   예시:
   ```bash
   supabase link --project-ref abcdefghijklmnop
   ```

3. **Migration 파일 확인**
   - `supabase/migrations/` 폴더에 SQL 파일이 있는지 확인
   - 없으면 `docs/db-schema-final.sql`을 migrations 폴더로 복사

#### Migration 파일 준비

```bash
# 프로젝트 루트에서
# migrations 폴더가 없으면 생성
mkdir -p supabase/migrations

# db-schema-final.sql을 migrations 폴더로 복사
# 타임스탬프 형식으로 파일명 변경
cp docs/db-schema-final.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql
```

Windows PowerShell:
```powershell
# migrations 폴더 생성
New-Item -ItemType Directory -Force -Path supabase\migrations

# 파일 복사 (타임스탬프 포함)
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Copy-Item docs\db-schema-final.sql "supabase\migrations\${timestamp}_initial_schema.sql"
```

#### DB Push 실행

```bash
# 프로젝트 루트에서
supabase db push
```

#### 장점
- ✅ Migration 히스토리 관리 가능
- ✅ 팀 협업 시 일관성 유지
- ✅ 버전 관리 가능
- ✅ 롤백 가능

#### 단점
- ❌ Supabase CLI 설치 필요
- ❌ 초기 설정이 복잡함

---

### 방법 3: Supabase CLI `migration up` (로컬 개발 환경)

로컬 Supabase를 사용하는 경우:

```bash
# 로컬 Supabase 시작
supabase start

# Migration 적용
supabase migration up
```

---

## 3. 적용 후 확인 체크리스트

### 3.1 테이블 생성 확인

Supabase Dashboard > Table Editor에서 다음 테이블들이 생성되었는지 확인:

#### Phase 1 필수 테이블
- [ ] `profiles`
  - 컬럼: `id`, `email`, `full_name`, `avatar_url`, `role`, `created_at`, `updated_at`
- [ ] `subjects`
  - 컬럼: `id`, `user_id`, `name`, `slug`, `color`, `sort_order`, `created_at`, `updated_at`
- [ ] `courses`
  - 컬럼: `id`, `user_id`, `subject_id`, `title`, `description`, `course_date`, `created_at`, `updated_at`
- [ ] `posts`
  - 컬럼: `id`, `user_id`, `course_id`, `subject_id`, `title`, `content`, `combined_content`, `ai_processed`, `created_at`, `updated_at`
- [ ] `ai_results`
  - 컬럼: `id`, `post_id`, `summary`, `key_points`, `study_direction`, `raw_response`, `created_at`, `updated_at`
- [ ] `post_attachments`
  - 컬럼: `id`, `post_id`, `file_name`, `file_type`, `file_url`, `file_size`, `extracted_text`, `created_at`

#### Phase 2 테이블
- [ ] `concepts`
  - 컬럼: `id`, `user_id`, `course_id`, `name`, `description`, `parent_id`, `sort_order`, `created_at`, `updated_at`
- [ ] `quizzes`
  - 컬럼: `id`, `user_id`, `course_id`, `post_id`, `question`, `choices`, `correct_index`, `explanation`, `created_at`

---

### 3.2 RLS 정책 확인

각 테이블의 "Policies" 탭에서 RLS 정책이 생성되었는지 확인:

#### `profiles`
- [ ] "Users can view own profile" (SELECT)
- [ ] "Users can update own profile" (UPDATE)

#### `subjects`
- [ ] "Users can view own subjects" (SELECT)
- [ ] "Users can create own subjects" (INSERT)
- [ ] "Users can update own subjects" (UPDATE)
- [ ] "Users can delete own subjects" (DELETE)

#### `courses`
- [ ] "Users can view own courses" (SELECT)
- [ ] "Users can create own courses" (INSERT)
- [ ] "Users can update own courses" (UPDATE)
- [ ] "Users can delete own courses" (DELETE)

#### `posts`
- [ ] "Users can view own posts" (SELECT)
- [ ] "Users can create own posts" (INSERT)
- [ ] "Users can update own posts" (UPDATE)
- [ ] "Users can delete own posts" (DELETE)

#### `ai_results`
- [ ] "Users can view AI results of own posts" (SELECT)
- [ ] "Users can create AI results for own posts" (INSERT)
- [ ] "Users can update AI results of own posts" (UPDATE)
- [ ] "Users can delete AI results of own posts" (DELETE)

#### `post_attachments`
- [ ] "Users can view attachments of own posts" (SELECT)
- [ ] "Users can create attachments for own posts" (INSERT)
- [ ] "Users can delete attachments of own posts" (DELETE)

#### `concepts`
- [ ] "Users can view own concepts" (SELECT)
- [ ] "Users can create own concepts" (INSERT)
- [ ] "Users can update own concepts" (UPDATE)
- [ ] "Users can delete own concepts" (DELETE)

#### `quizzes`
- [ ] "Users can view own quizzes" (SELECT)
- [ ] "Users can create own quizzes" (INSERT)
- [ ] "Users can update own quizzes" (UPDATE)
- [ ] "Users can delete own quizzes" (DELETE)

---

### 3.3 인덱스 확인

각 테이블의 "Indexes" 탭에서 인덱스가 생성되었는지 확인:

#### `profiles`
- [ ] `idx_profiles_email`

#### `subjects`
- [ ] `idx_subjects_user_id`
- [ ] `idx_subjects_user_slug` (UNIQUE 제약으로 자동 생성)

#### `courses`
- [ ] `idx_courses_user_id`
- [ ] `idx_courses_subject_id` (Partial index: `WHERE subject_id IS NOT NULL`)
- [ ] `idx_courses_created_at`
- [ ] `idx_courses_user_created`

#### `posts`
- [ ] `idx_posts_user_id`
- [ ] `idx_posts_course_id` (Partial index: `WHERE course_id IS NOT NULL`)
- [ ] `idx_posts_subject_id` (Partial index: `WHERE subject_id IS NOT NULL`)
- [ ] `idx_posts_created_at`
- [ ] `idx_posts_user_created`

#### `ai_results`
- [ ] `idx_ai_results_post_id` (UNIQUE 제약으로 자동 생성)

#### `post_attachments`
- [ ] `idx_post_attachments_post_id`

#### `concepts`
- [ ] `idx_concepts_user_id`
- [ ] `idx_concepts_course_id` (Partial index: `WHERE course_id IS NOT NULL`)
- [ ] `idx_concepts_parent_id` (Partial index: `WHERE parent_id IS NOT NULL`)

#### `quizzes`
- [ ] `idx_quizzes_user_id`
- [ ] `idx_quizzes_course_id` (Partial index: `WHERE course_id IS NOT NULL`)
- [ ] `idx_quizzes_post_id` (Partial index: `WHERE post_id IS NOT NULL`)

---

### 3.4 트리거 확인

각 테이블의 "Triggers" 탭에서 트리거가 생성되었는지 확인:

#### `profiles`
- [ ] `update_profiles_updated_at` (BEFORE UPDATE)
- [ ] `on_auth_user_created` (AFTER INSERT on auth.users)

#### `subjects`
- [ ] `update_subjects_updated_at` (BEFORE UPDATE)

#### `courses`
- [ ] `update_courses_updated_at` (BEFORE UPDATE)

#### `posts`
- [ ] `update_posts_updated_at` (BEFORE UPDATE)

#### `ai_results`
- [ ] `update_ai_results_updated_at` (BEFORE UPDATE)

#### `concepts`
- [ ] `update_concepts_updated_at` (BEFORE UPDATE)

---

### 3.5 함수 확인

Supabase Dashboard > Database > Functions에서 다음 함수가 생성되었는지 확인:

- [ ] `update_updated_at_column()` - updated_at 자동 갱신 함수
- [ ] `handle_new_user()` - auth.users 신규 사용자 프로필 자동 생성 함수

---

### 3.6 외래키 제약 확인

각 테이블의 "Foreign Keys" 탭에서 외래키가 올바르게 설정되었는지 확인:

#### `profiles`
- [ ] `id` → `auth.users(id)` ON DELETE CASCADE

#### `subjects`
- [ ] `user_id` → `profiles(id)` ON DELETE CASCADE

#### `courses`
- [ ] `user_id` → `profiles(id)` ON DELETE CASCADE
- [ ] `subject_id` → `subjects(id)` ON DELETE SET NULL

#### `posts`
- [ ] `user_id` → `profiles(id)` ON DELETE CASCADE
- [ ] `course_id` → `courses(id)` ON DELETE SET NULL
- [ ] `subject_id` → `subjects(id)` ON DELETE SET NULL

#### `ai_results`
- [ ] `post_id` → `posts(id)` ON DELETE CASCADE (UNIQUE)

#### `post_attachments`
- [ ] `post_id` → `posts(id)` ON DELETE CASCADE

#### `concepts`
- [ ] `user_id` → `profiles(id)` ON DELETE CASCADE
- [ ] `course_id` → `courses(id)` ON DELETE CASCADE
- [ ] `parent_id` → `concepts(id)` ON DELETE CASCADE

#### `quizzes`
- [ ] `user_id` → `profiles(id)` ON DELETE CASCADE
- [ ] `course_id` → `courses(id)` ON DELETE SET NULL
- [ ] `post_id` → `posts(id)` ON DELETE SET NULL

---

### 3.7 테스트 쿼리 실행

Supabase Dashboard > SQL Editor에서 다음 쿼리를 실행하여 정상 작동 확인:

#### 테이블 존재 확인
```sql
-- 모든 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

예상 결과:
- ai_results
- concepts
- courses
- post_attachments
- posts
- profiles
- quizzes
- subjects

#### RLS 정책 확인
```sql
-- RLS 정책 목록 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### 함수 확인
```sql
-- 함수 목록 확인
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

예상 결과:
- handle_new_user (FUNCTION)
- update_updated_at_column (FUNCTION)

---

## 4. 문제 해결

### 4.1 일반적인 에러

#### "relation already exists"
- **원인**: 테이블이 이미 존재함
- **해결**: 
  - 기존 테이블 삭제 후 재실행
  - 또는 `DROP TABLE IF EXISTS` 사용

#### "function already exists"
- **원인**: 함수가 이미 존재함
- **해결**: 
  - `CREATE OR REPLACE FUNCTION` 사용 (이미 적용됨)
  - 또는 기존 함수 삭제 후 재실행

#### "permission denied"
- **원인**: RLS 정책 문제 또는 권한 문제
- **해결**: 
  - Supabase Dashboard에서 RLS 정책 확인
  - 서비스 역할 키 사용 확인

#### "foreign key constraint violation"
- **원인**: 참조하는 테이블이 아직 생성되지 않음
- **해결**: 
  - SQL 파일을 순서대로 실행
  - 의존성 순서 확인

---

## 5. 완료 확인

모든 체크리스트를 완료했다면:

✅ **데이터베이스 스키마가 정상적으로 생성되었습니다!**

다음 단계:
1. 타입 생성: `npx supabase gen types typescript --project-id <project-id> > types/database.ts`
2. 서비스 레이어에서 Supabase 클라이언트 연동
3. Context에서 Mock 데이터 대신 Supabase 데이터 사용
