# SSU-Note 데이터베이스 설계 가이드

## 📊 데이터베이스 개요

- **DBMS**: PostgreSQL (Supabase)
- **인증**: Supabase Auth (Google OAuth)
- **보안**: Row Level Security (RLS) 필수
- **타입 생성**: Supabase CLI를 통한 자동 타입 생성

## 🗄️ 테이블 구조

### 1. users (Supabase Auth 확장)

Supabase Auth의 `auth.users` 테이블을 확장하는 프로필 테이블입니다.

```sql
-- public.users (프로필 확장)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

### 2. subjects (과목)

Phase 2에서 Course와 연결되는 과목 테이블입니다.

```sql
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- UI에서 사용할 색상 코드
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);

-- RLS 정책
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

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
```

### 3. courses (코스)

Phase 2의 핵심 엔티티입니다. 주차/주제별 학습 단위를 나타냅니다.

```sql
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER, -- 주차 번호
  topic TEXT, -- 주제
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_courses_subject_id ON public.courses(subject_id);

-- RLS 정책
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

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
```

### 4. study_posts (학습 노트)

Phase 1의 핵심 엔티티입니다. 텍스트 기반 학습 노트를 저장합니다.

```sql
CREATE TABLE public.study_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL, -- Phase 2 연결
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL, -- Phase 1 선택적 연결
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  combined_content TEXT, -- 원본 + 추출된 텍스트 결합
  ai_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_study_posts_user_id ON public.study_posts(user_id);
CREATE INDEX idx_study_posts_course_id ON public.study_posts(course_id);
CREATE INDEX idx_study_posts_subject_id ON public.study_posts(subject_id);
CREATE INDEX idx_study_posts_created_at ON public.study_posts(created_at DESC);

-- RLS 정책
ALTER TABLE public.study_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study posts"
  ON public.study_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study posts"
  ON public.study_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study posts"
  ON public.study_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study posts"
  ON public.study_posts FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. post_attachments (첨부 파일)

학습 노트에 첨부된 파일 메타데이터를 저장합니다.

```sql
CREATE TABLE public.post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.study_posts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'image', 'audio', 'video'
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER, -- bytes
  extracted_text TEXT, -- OCR/STT로 추출된 텍스트 (Phase 2)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_post_attachments_post_id ON public.post_attachments(post_id);

-- RLS 정책
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of own posts"
  ON public.post_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_posts
      WHERE study_posts.id = post_attachments.post_id
      AND study_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for own posts"
  ON public.post_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_posts
      WHERE study_posts.id = post_attachments.post_id
      AND study_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments of own posts"
  ON public.post_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_posts
      WHERE study_posts.id = post_attachments.post_id
      AND study_posts.user_id = auth.uid()
    )
  );
```

### 6. ai_results (AI 처리 결과)

학습 노트에 대한 AI 처리 결과를 저장합니다.

```sql
CREATE TABLE public.ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.study_posts(id) ON DELETE CASCADE,
  summary TEXT, -- 요약
  key_points JSONB, -- 핵심 포인트 배열
  study_direction TEXT, -- 학습 방향 제안
  raw_response JSONB, -- 원본 AI 응답 (디버깅/확장용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_ai_results_post_id ON public.ai_results(post_id);

-- RLS 정책
ALTER TABLE public.ai_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI results of own posts"
  ON public.ai_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_posts
      WHERE study_posts.id = ai_results.post_id
      AND study_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create AI results for own posts"
  ON public.ai_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_posts
      WHERE study_posts.id = ai_results.post_id
      AND study_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update AI results of own posts"
  ON public.ai_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_posts
      WHERE study_posts.id = ai_results.post_id
      AND study_posts.user_id = auth.uid()
    )
  );
```

### 7. concepts (개념) - Phase 2

개념 맵을 위한 개념 노드입니다.

```sql
CREATE TABLE public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_concepts_user_id ON public.concepts(user_id);
CREATE INDEX idx_concepts_course_id ON public.concepts(course_id);

-- RLS 정책
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own concepts"
  ON public.concepts FOR ALL
  USING (auth.uid() = user_id);
```

### 8. concept_relationships (개념 관계) - Phase 2

개념 간의 관계를 저장합니다.

```sql
CREATE TABLE public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  to_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relationship_type TEXT, -- 'prerequisite', 'related', 'example', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_concept_id, to_concept_id)
);

-- 인덱스
CREATE INDEX idx_concept_relationships_from ON public.concept_relationships(from_concept_id);
CREATE INDEX idx_concept_relationships_to ON public.concept_relationships(to_concept_id);

-- RLS 정책
ALTER TABLE public.concept_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage relationships of own concepts"
  ON public.concept_relationships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.concepts
      WHERE concepts.id = concept_relationships.from_concept_id
      AND concepts.user_id = auth.uid()
    )
  );
```

### 9. quizzes (퀴즈) - Phase 2

개념 기반 퀴즈를 저장합니다.

```sql
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.study_posts(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- 선택지 배열
  correct_answer INTEGER NOT NULL, -- 정답 인덱스
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_quizzes_post_id ON public.quizzes(post_id);
CREATE INDEX idx_quizzes_concept_id ON public.quizzes(concept_id);

-- RLS 정책
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quizzes"
  ON public.quizzes FOR ALL
  USING (auth.uid() = user_id);
```

## 🔐 Row Level Security (RLS) 정책 요약

### 기본 원칙
1. **사용자는 자신의 데이터만 접근 가능**
   - 모든 정책에서 `auth.uid() = user_id` 조건 사용
2. **관련 데이터 접근**
   - 외래키 관계를 가진 테이블은 부모 테이블의 user_id를 확인
3. **CASCADE 삭제**
   - 사용자 삭제 시 관련 데이터 자동 삭제
   - Post 삭제 시 AI 결과, 첨부파일 자동 삭제

### 정책 패턴
```sql
-- 조회 (SELECT)
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- 생성 (INSERT)
CREATE POLICY "policy_name"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 수정 (UPDATE)
CREATE POLICY "policy_name"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id);

-- 삭제 (DELETE)
CREATE POLICY "policy_name"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);
```

## 📁 Supabase Storage 구조

### 버킷: `attachments`
```
attachments/
  {user_id}/
    {post_id}/
      {file_name}
```

### Storage 정책
- 사용자는 자신의 폴더에만 파일 업로드/다운로드 가능
- Post 삭제 시 관련 파일 자동 삭제 (Database Trigger 활용)

## 🔄 데이터 관계도

```
users (1) ────< (N) subjects
users (1) ────< (N) courses
users (1) ────< (N) study_posts
users (1) ────< (N) concepts
users (1) ────< (N) quizzes

subjects (1) ────< (N) courses
subjects (1) ────< (N) study_posts

courses (1) ────< (N) study_posts
courses (1) ────< (N) concepts

study_posts (1) ──── (1) ai_results
study_posts (1) ────< (N) post_attachments
study_posts (1) ────< (N) quizzes

concepts (1) ────< (N) concept_relationships (from)
concepts (1) ────< (N) concept_relationships (to)
concepts (1) ────< (N) quizzes
```

## 🚀 마이그레이션 전략

### Phase 1 초기 설정
1. `users`, `subjects`, `study_posts`, `post_attachments`, `ai_results` 테이블 생성
2. 기본 RLS 정책 적용
3. 인덱스 생성

### Phase 2 확장
1. `courses`, `concepts`, `concept_relationships`, `quizzes` 테이블 추가
2. `study_posts`에 `course_id` 컬럼 추가 (기존 데이터는 NULL 허용)
3. 관계 데이터 마이그레이션

## 📝 타입 생성

Supabase CLI를 사용하여 TypeScript 타입 자동 생성:

```bash
# Supabase 프로젝트 연결 후
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

생성된 타입은 `types/database.ts`에 저장되며, 프로젝트 전역에서 사용합니다.
