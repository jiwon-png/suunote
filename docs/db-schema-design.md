# SSU-Note DB 스키마 설계안 (승인 전 초안)

## 📋 목차
1. [코드 스캔 결과](#1-코드-스캔-결과)
2. [최종 스키마 설계안](#2-최종-스키마-설계안)
3. [RLS/인덱스/트리거 설계안](#3-rls인덱스트리거-설계안)
4. [Supabase 적용 단계](#4-supabase-적용-단계)
5. [초안 SQL](#5-초안-sql)
6. [types/index.ts 변경 요약](#6-typesindexts-변경-요약)

---

## 1. 코드 스캔 결과

### 1.1 UI에서 실제로 사용하는 필드 목록

#### A. Profiles (사용자 프로필)
**사용 위치**: `components/common/Header.tsx`, `contexts/AuthContext.tsx`
- `id`: UUID (auth.users와 1:1)
- `email`: string (Header에서 표시)
- `fullName`: string (Header에서 표시: `user?.fullName || user?.email || "사용자"`)
- `avatarUrl`: string (현재는 User 아이콘 사용, 향후 아바타 표시용)
- `role`: 'user' | 'admin' (types/global.ts에 정의, 현재 UI에서는 미사용이지만 확장 대비)

#### B. Subjects (과목)
**사용 위치**: `components/common/Header.tsx`, `app/(main)/courses/page.tsx`, `app/(main)/courses/[id]/page.tsx`
- `id`: string (URL 쿼리 파라미터로 필터링: `?subject=os`)
- `userId`: string (RLS용)
- `name`: string (드롭다운/칩에 표시: "운영체제", "데이터베이스")
- `color`: string (헥스 색상 코드: "#3B82F6", Header와 CourseCard에서 칩 배경색으로 사용)
- `createdAt`: Date (정렬용, 현재 UI에서는 미사용)
- `updatedAt`: Date

**추가 필요 필드 (UI 요구사항)**:
- `slug`: string (쿼리용, 현재는 id를 사용하지만 명시적 slug 권장)
- `sortOrder`: number (드롭다운 정렬용, 현재는 배열 순서 사용)

#### C. Courses (코스)
**사용 위치**: `app/(main)/courses/page.tsx`, `app/(main)/courses/[id]/page.tsx`, `domain/courses/components/TimelineTab.tsx`
- `id`: string
- `userId`: string
- `subjectId`: string | undefined (과목 연결, CourseCard에서 과목 칩 표시)
- `title`: string (CourseCard 제목: "프로세스 스케줄링")
- `description`: string | undefined (CourseCard 설명, CourseDetail 헤더)
- `createdAt`: Date (CourseCard에 날짜 표시: `formatDate(course.createdAt)`, 정렬 기준)
- `updatedAt`: Date

**추가 필요 필드 (UI 요구사항)**:
- `startDate` 또는 `courseDate`: Date (코스 시작일, 현재는 createdAt 사용하지만 명시적 날짜 필드 권장)

#### D. Posts (학습 노트)
**사용 위치**: 전역 (가장 많이 사용되는 엔티티)

**기본 필드**:
- `id`: string
- `userId`: string
- `courseId`: string | undefined (코스 연결, TimelineTab에서 필터링: `posts.filter((post) => post.courseId === courseId)`)
- `subjectId`: string | undefined (과목 연결, `/posts` 페이지에서 필터링: `posts.filter((post) => post.subjectId === subjectId)`)
- `title`: string (PostCard, PostDetail, TimelineTab에 표시)
- `content`: string (PostDetail 원본 내용, PostCard에서 제목 없을 때 fallback)
- `aiProcessed`: boolean (PostCard에서 "AI 요약 완료" / "처리 중" 표시)
- `createdAt`: Date (PostCard 날짜, TimelineTab 정렬 기준, PostDetail 표시)
- `updatedAt`: Date

**AI 결과 필드** (Post.aiResult):
- `summary`: string | undefined (PostDetail, TimelineTab에 표시: `post.aiResult?.summary`)
- `keyPoints`: string[] | undefined (PostDetail, ConceptMapTab에서 개념 추출: `post.aiResult.keyPoints.map(...)`)
- `studyDirection`: string | undefined (PostDetail에 표시)

**추가 필요 필드 (UI 요구사항)**:
- `combinedContent`: string | undefined (원문 + 첨부파일 추출 텍스트, 현재 타입에는 있지만 실제 사용 미확인)

#### E. Post Attachments (첨부 파일)
**사용 위치**: `components/posts/FileAttachmentSection.tsx`, `domain/posts/types.ts`
- `id`: string
- `postId`: string
- `fileName`: string
- `fileType`: string ("pdf"|"image"|"audio"|"video")
- `fileUrl`: string (Supabase Storage URL)
- `fileSize`: number | undefined (bytes)
- `extractedText`: string | undefined (OCR/STT 결과, Phase 2)
- `createdAt`: Date

#### F. Concepts (개념 노드) - Phase 2
**사용 위치**: `domain/courses/components/ConceptMapTab.tsx`
- 현재는 `post.aiResult.keyPoints`를 개념으로 사용
- 향후 구조화된 개념 노드 필요:
  - `id`: string
  - `courseId`: string
  - `name`: string (개념명)
  - `level`: number 또는 `parentId`: string (중심/하위 구분)
  - `sortOrder`: number

#### G. Quizzes (복습 문제) - Phase 2
**사용 위치**: `domain/courses/components/ReviewTab.tsx`
- 현재는 Mock 데이터 사용
- 실제 구조 필요:
  - `id`: string
  - `courseId`: string (또는 `postId`: string)
  - `question`: string
  - `options`: string[] (선택지 배열)
  - `correctIndex`: number (정답 인덱스, Phase 1은 nullable 가능)
  - `explanation`: string | undefined
  - `createdAt`: Date

---

## 2. 최종 스키마 설계안

### 2.1 ERD 관계도

```
auth.users (1) ──── (1) profiles
                    │
                    ├───< (N) subjects
                    ├───< (N) courses
                    ├───< (N) posts
                    ├───< (N) concepts (Phase 2)
                    └───< (N) quizzes (Phase 2)

subjects (1) ────< (N) courses
subjects (1) ────< (N) posts

courses (1) ────< (N) posts
courses (1) ────< (N) concepts (Phase 2)
courses (1) ────< (N) quizzes (Phase 2)

posts (1) ──── (1) ai_results
posts (1) ────< (N) post_attachments
posts (1) ────< (N) quizzes (Phase 2, optional)
```

### 2.2 테이블별 컬럼 정의

#### profiles
```sql
- id: UUID PRIMARY KEY (auth.users.id 참조)
- email: TEXT (auth.users.email과 동기화)
- full_name: TEXT (nullable, Header 표시용)
- avatar_url: TEXT (nullable, 향후 아바타)
- role: TEXT DEFAULT 'user' (CHECK: 'user' | 'admin')
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### subjects
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL (profiles.id 참조)
- name: TEXT NOT NULL (표시명: "운영체제")
- slug: TEXT (nullable, 쿼리용: "os", "db")
- color: TEXT NOT NULL (헥스 색상: "#3B82F6")
- sort_order: INTEGER DEFAULT 0 (드롭다운 정렬)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

UNIQUE(user_id, slug) -- 같은 사용자 내에서 slug 중복 방지
```

#### courses
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL (profiles.id 참조)
- subject_id: UUID (nullable, subjects.id 참조, ON DELETE SET NULL)
- title: TEXT NOT NULL ("프로세스 스케줄링")
- description: TEXT (nullable, CourseCard 설명)
- course_date: DATE (nullable, 코스 시작일, 현재는 createdAt 사용)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### posts
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL (profiles.id 참조)
- course_id: UUID (nullable, courses.id 참조, ON DELETE SET NULL)
- subject_id: UUID (nullable, subjects.id 참조, ON DELETE SET NULL)
- title: TEXT NOT NULL
- content: TEXT NOT NULL (원문 학습 내용)
- combined_content: TEXT (nullable, 원문 + 첨부파일 추출 텍스트)
- ai_processed: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### ai_results
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- post_id: UUID NOT NULL UNIQUE (posts.id 참조, ON DELETE CASCADE)
- summary: TEXT (nullable, AI 요약)
- key_points: JSONB (nullable, 핵심 포인트 배열: ["포인트1", "포인트2"])
- study_direction: TEXT (nullable, 학습 방향 제안)
- raw_response: JSONB (nullable, 원본 AI 응답, 디버깅용)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### post_attachments
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- post_id: UUID NOT NULL (posts.id 참조, ON DELETE CASCADE)
- file_name: TEXT NOT NULL
- file_type: TEXT NOT NULL (CHECK: 'pdf' | 'image' | 'audio' | 'video')
- file_url: TEXT NOT NULL (Supabase Storage URL)
- file_size: INTEGER (nullable, bytes)
- extracted_text: TEXT (nullable, OCR/STT 결과, Phase 2)
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

#### concepts (Phase 2 - 선택)
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL (profiles.id 참조)
- course_id: UUID (nullable, courses.id 참조, ON DELETE CASCADE)
- name: TEXT NOT NULL (개념명)
- description: TEXT (nullable)
- parent_id: UUID (nullable, concepts.id 참조, 하위 개념 연결)
- sort_order: INTEGER DEFAULT 0
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### quizzes (Phase 2 - 선택)
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL (profiles.id 참조)
- course_id: UUID (nullable, courses.id 참조, ON DELETE SET NULL)
- post_id: UUID (nullable, posts.id 참조, ON DELETE SET NULL)
- question: TEXT NOT NULL
- choices: JSONB NOT NULL (선택지 배열: ["선택지1", "선택지2", ...])
- correct_index: INTEGER (nullable, 정답 인덱스, Phase 1은 비워도 됨)
- explanation: TEXT (nullable, 해설)
- created_at: TIMESTAMPTZ DEFAULT NOW()
```

---

## 3. RLS/인덱스/트리거 설계안

### 3.1 Row Level Security (RLS) 정책

#### 기본 원칙
1. **사용자는 자신의 데이터만 접근 가능**: 모든 정책에서 `auth.uid() = user_id` 조건 사용
2. **관련 데이터 접근**: 외래키 관계를 가진 테이블은 부모 테이블의 user_id를 확인
3. **CASCADE 삭제**: 사용자 삭제 시 관련 데이터 자동 삭제

#### profiles
- SELECT: 본인만 조회 가능
- UPDATE: 본인만 수정 가능
- INSERT: auth trigger로 자동 생성 (또는 서버 액션 경유)

#### subjects, courses, posts
- SELECT: 본인 데이터만 조회
- INSERT: 본인 데이터만 생성 (`WITH CHECK (auth.uid() = user_id)`)
- UPDATE: 본인 데이터만 수정
- DELETE: 본인 데이터만 삭제

#### ai_results, post_attachments
- 부모 테이블(posts)의 user_id를 확인하는 EXISTS 서브쿼리 사용
- SELECT/INSERT/UPDATE/DELETE 모두 부모 post의 소유자 확인

#### concepts, quizzes (Phase 2)
- 본인 데이터만 접근 가능 (user_id 직접 확인)

### 3.2 인덱스 설계

#### 필수 인덱스 (조회 패턴 기반)
```sql
-- profiles
CREATE INDEX idx_profiles_user_id ON profiles(id); -- PK이므로 자동 생성

-- subjects
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_subjects_user_slug ON subjects(user_id, slug); -- UNIQUE 제약으로 자동 생성

-- courses
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_subject_id ON courses(subject_id);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC); -- 최신순 정렬

-- posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_course_id ON posts(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_posts_subject_id ON posts(subject_id) WHERE subject_id IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC); -- 최신순 정렬, TimelineTab 정렬용
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC); -- 사용자별 최신순

-- ai_results
CREATE INDEX idx_ai_results_post_id ON ai_results(post_id); -- UNIQUE 제약으로 자동 생성

-- post_attachments
CREATE INDEX idx_post_attachments_post_id ON post_attachments(post_id);

-- concepts (Phase 2)
CREATE INDEX idx_concepts_user_id ON concepts(user_id);
CREATE INDEX idx_concepts_course_id ON concepts(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_concepts_parent_id ON concepts(parent_id) WHERE parent_id IS NOT NULL;

-- quizzes (Phase 2)
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_quizzes_post_id ON quizzes(post_id) WHERE post_id IS NOT NULL;
```

### 3.3 트리거 설계

#### updated_at 자동 갱신 트리거
```sql
-- 모든 테이블에 적용 (profiles, subjects, courses, posts, ai_results, concepts)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 부착
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles ...
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects ...
-- ... (나머지 테이블)
```

#### profiles 자동 생성 트리거 (auth.users 신규 사용자)
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 4. Supabase 적용 단계

### 4.1 마이그레이션 절차

#### Step 1: 프로필 테이블 생성
1. `profiles` 테이블 생성
2. RLS 정책 적용
3. auth.users 트리거 설정 (자동 프로필 생성)

#### Step 2: 과목/코스 테이블 생성 (Phase 1 필수)
1. `subjects` 테이블 생성
2. `courses` 테이블 생성
3. RLS 정책 및 인덱스 적용

#### Step 3: 학습 노트 테이블 생성
1. `posts` 테이블 생성
2. `ai_results` 테이블 생성
3. `post_attachments` 테이블 생성 (Phase 1 기본, Phase 2 확장)
4. RLS 정책 및 인덱스 적용

#### Step 4: Phase 2 테이블 (선택, 나중에 추가 가능)
1. `concepts` 테이블 생성
2. `quizzes` 테이블 생성
3. RLS 정책 및 인덱스 적용

### 4.2 주의사항

⚠️ **중요 체크리스트** (승인 전 확인 필요):

1. **테이블명 일관성**
   - [ ] `posts` vs `study_posts`: 현재 코드에서는 `posts` 사용, 기존 문서는 `study_posts`. **어느 것으로 통일할지 결정 필요**
   - [ ] `profiles` vs `users`: Supabase Auth의 `auth.users`와 구분하기 위해 `profiles` 권장

2. **과목(Subject) 구조**
   - [ ] `slug` 필드 필요 여부: 현재는 `id`를 사용하지만, URL-friendly slug 권장
   - [ ] `sort_order` 기본값: 0으로 시작할지, NULL 허용할지

3. **코스(Course) 날짜 필드**
   - [ ] `course_date` vs `start_date`: 명칭 통일 필요
   - [ ] `created_at`과 별도로 `course_date` 필요 여부: 현재 UI는 `created_at` 사용

4. **AI 결과 저장 방식**
   - [ ] `ai_results` 별도 테이블 vs `posts` 내 JSONB 컬럼: 현재 코드는 별도 객체로 관리하지만, 별도 테이블이 확장성 좋음
   - [ ] `ai_status` 필드: 현재 `aiProcessed` boolean 사용, 더 세밀한 상태 관리 필요 시 `ai_status` enum 추가 고려

5. **Phase 2 테이블 포함 여부**
   - [ ] `concepts`, `quizzes` 테이블을 Phase 1에 포함할지, Phase 2로 미룰지 결정
   - 현재 UI에서 Mock 데이터 사용 중이므로, Phase 2로 미루는 것도 가능

6. **인덱스 최적화**
   - [ ] Partial index (`WHERE course_id IS NOT NULL`) 사용 여부: NULL이 많은 경우 성능 향상
   - [ ] Composite index (`user_id, created_at DESC`) 필요 여부: 사용자별 최신순 조회 최적화

7. **트리거 및 함수**
   - [ ] `updated_at` 자동 갱신 트리거: 모든 테이블에 적용할지 확인
   - [ ] `profiles` 자동 생성 트리거: Supabase Auth와 연동 방식 확인

---

## 5. 초안 SQL

### 5.1 Phase 1 필수 테이블 (승인 후 확정)

```sql
-- ============================================
-- 1. Profiles (사용자 프로필)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Trigger: Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Subjects (과목)
-- ============================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX idx_subjects_user_slug ON public.subjects(user_id, slug);

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Courses (코스)
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  course_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_courses_subject_id ON public.courses(subject_id) WHERE subject_id IS NOT NULL;
CREATE INDEX idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX idx_courses_user_created ON public.courses(user_id, created_at DESC);

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Posts (학습 노트)
-- ============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  combined_content TEXT,
  ai_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_course_id ON public.posts(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_posts_subject_id ON public.posts(subject_id) WHERE subject_id IS NOT NULL;
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_user_created ON public.posts(user_id, created_at DESC);

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. AI Results (AI 처리 결과)
-- ============================================
CREATE TABLE public.ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  summary TEXT,
  key_points JSONB,
  study_direction TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies (부모 post의 user_id 확인)
CREATE POLICY "Users can view AI results of own posts"
  ON public.ai_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = ai_results.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create AI results for own posts"
  ON public.ai_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = ai_results.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update AI results of own posts"
  ON public.ai_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = ai_results.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete AI results of own posts"
  ON public.ai_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = ai_results.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_ai_results_post_id ON public.ai_results(post_id);

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_ai_results_updated_at
  BEFORE UPDATE ON public.ai_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Post Attachments (첨부 파일)
-- ============================================
CREATE TABLE public.post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'audio', 'video')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (부모 post의 user_id 확인)
CREATE POLICY "Users can view attachments of own posts"
  ON public.post_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_attachments.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for own posts"
  ON public.post_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_attachments.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments of own posts"
  ON public.post_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_attachments.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_post_attachments_post_id ON public.post_attachments(post_id);

-- ============================================
-- 공통 함수: updated_at 자동 갱신
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Phase 2 테이블 (선택, 나중에 추가 가능)

```sql
-- ============================================
-- 7. Concepts (개념 노드) - Phase 2
-- ============================================
CREATE TABLE public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own concepts"
  ON public.concepts FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_concepts_user_id ON public.concepts(user_id);
CREATE INDEX idx_concepts_course_id ON public.concepts(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_concepts_parent_id ON public.concepts(parent_id) WHERE parent_id IS NOT NULL;

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_concepts_updated_at
  BEFORE UPDATE ON public.concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Quizzes (복습 문제) - Phase 2
-- ============================================
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_index INTEGER,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own quizzes"
  ON public.quizzes FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_quizzes_course_id ON public.quizzes(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_quizzes_post_id ON public.quizzes(post_id) WHERE post_id IS NOT NULL;
```

---

## 6. types/index.ts 변경 요약

### 6.1 현재 타입 구조 (domain/posts/types.ts, domain/courses/types.ts)

```typescript
// 현재
export interface Post {
  id: string
  userId: string
  courseId?: string
  subjectId?: string
  title: string
  content: string
  combinedContent?: string
  aiProcessed: boolean
  aiResult?: {
    summary?: string
    keyPoints?: string[]
    studyDirection?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  userId: string
  subjectId?: string
  title: string
  description?: string
  weekNumber?: number
  topic?: string
  createdAt: Date
  updatedAt: Date
}

export interface Subject {
  id: string
  userId: string
  name: string
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}
```

### 6.2 변경 요약

#### A. types/database.ts (Supabase 자동 생성 타입)
- Supabase CLI로 자동 생성되므로 수동 수정 불필요
- `npx supabase gen types typescript --project-id <project-id> > types/database.ts` 실행

#### B. domain/posts/types.ts 업데이트
```typescript
// 변경 사항:
// 1. aiResult를 별도 타입으로 분리 (ai_results 테이블 반영)
// 2. PostAttachment 타입 추가
// 3. ViewModel 타입 추가 (UI 카드용)

export interface AIResult {
  id: string
  postId: string
  summary?: string
  keyPoints?: string[]  // JSONB 배열
  studyDirection?: string
  rawResponse?: Record<string, unknown>  // JSONB
  createdAt: Date
  updatedAt: Date
}

export interface Post {
  id: string
  userId: string
  courseId?: string
  subjectId?: string
  title: string
  content: string
  combinedContent?: string
  aiProcessed: boolean
  createdAt: Date
  updatedAt: Date
  // 관계 데이터 (JOIN 결과)
  aiResult?: AIResult
}

export interface PostAttachment {
  id: string
  postId: string
  fileName: string
  fileType: 'pdf' | 'image' | 'audio' | 'video'
  fileUrl: string
  fileSize?: number
  extractedText?: string
  createdAt: Date
}

// ViewModel: UI 카드용
export interface PostCardModel {
  id: string
  title: string
  createdAt: Date
  aiProcessed: boolean
  subjectId?: string
}
```

#### C. domain/courses/types.ts 업데이트
```typescript
// 변경 사항:
// 1. Subject에 slug, sortOrder 추가
// 2. Course에 courseDate 추가 (weekNumber, topic 제거 또는 유지 결정 필요)
// 3. ViewModel 타입 추가

export interface Subject {
  id: string
  userId: string
  name: string
  slug?: string  // 추가
  color: string  // required로 변경
  sortOrder: number  // 추가
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  userId: string
  subjectId?: string
  title: string
  description?: string
  courseDate?: Date  // 추가 (또는 startDate)
  createdAt: Date
  updatedAt: Date
}

// ViewModel: UI 카드용
export interface CourseCardModel {
  id: string
  title: string
  description?: string
  subjectId?: string
  subjectName?: string
  subjectColor?: string
  postCount: number
  createdAt: Date
}
```

#### D. domain/quiz/types.ts (신규 생성, Phase 2)
```typescript
export interface Quiz {
  id: string
  userId: string
  courseId?: string
  postId?: string
  question: string
  choices: string[]  // JSONB 배열
  correctIndex?: number
  explanation?: string
  createdAt: Date
}
```

#### E. domain/concepts/types.ts (신규 생성, Phase 2)
```typescript
export interface Concept {
  id: string
  userId: string
  courseId?: string
  name: string
  description?: string
  parentId?: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

---

## ✅ 승인 요청 체크리스트

다음 항목들을 확인하고 승인해주세요:

### 필수 확인 사항
- [ ] **테이블명**: `posts` vs `study_posts` 중 선택 (현재 코드는 `posts` 사용)
- [ ] **Subject slug**: `slug` 필드를 포함할지 여부
- [ ] **Course 날짜**: `course_date` vs `start_date` 명칭 및 필요 여부
- [ ] **AI 상태**: `ai_processed` boolean만 사용할지, `ai_status` enum 추가할지
- [ ] **Phase 2 테이블**: `concepts`, `quizzes`를 Phase 1에 포함할지 여부

### 선택 확인 사항
- [ ] **인덱스 전략**: Partial index 사용 여부
- [ ] **트리거**: `updated_at` 자동 갱신 트리거 적용 범위
- [ ] **타입 정의**: ViewModel 타입 추가 여부

---

**승인 후 다음 단계**: 최종 SQL 확정 및 Supabase 적용 가이드 제공
