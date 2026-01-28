# SSU-Note 프로젝트 구조 설계안

## 📁 폴더 트리 구조

```
suunote/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                  # 인증 관련 그룹 라우트
│   │   ├── layout.tsx           # 인증 레이아웃
│   │   └── login/               # 로그인 페이지
│   │       └── page.tsx
│   │
│   ├── (main)/                  # 메인 기능 그룹 라우트
│   │   ├── layout.tsx           # 메인 레이아웃 (네비게이션 포함)
│   │   │
│   │   ├── posts/               # 학습 노트 관리
│   │   │   ├── layout.tsx       # Posts 레이아웃
│   │   │   ├── page.tsx         # Posts 목록 (/posts)
│   │   │   ├── new/             # 새 노트 작성
│   │   │   │   └── page.tsx     # (/posts/new)
│   │   │   └── [id]/            # 노트 상세
│   │   │       └── page.tsx     # (/posts/[id])
│   │   │
│   │   ├── courses/             # 코스 관리 (Phase 2)
│   │   │   ├── layout.tsx       # Courses 레이아웃
│   │   │   ├── page.tsx         # Courses 목록 (/courses)
│   │   │   └── [id]/            # 코스 상세
│   │   │       └── page.tsx     # (/courses/[id])
│   │   │
│   │   └── dashboard/           # 대시보드 (Phase 2)
│   │       └── page.tsx         # (/dashboard)
│   │
│   ├── api/                     # API Routes (Server Actions 대체 가능)
│   │   ├── auth/                # 인증 API
│   │   ├── posts/               # Posts API
│   │   ├── courses/             # Courses API
│   │   └── ai/                  # AI 처리 API
│   │
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 루트 페이지 (리다이렉트)
│   ├── globals.css              # 전역 스타일
│   └── favicon.ico
│
├── components/                   # 전역 재사용 UI 컴포넌트
│   ├── ui/                      # shadcn/ui 기반 기본 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── layout/                  # 레이아웃 컴포넌트
│   │   ├── Header.tsx           # 헤더/네비게이션
│   │   ├── Sidebar.tsx          # 사이드바 (Phase 2)
│   │   └── Footer.tsx           # 푸터
│   │
│   └── common/                  # 공통 컴포넌트
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
│
├── domain/                      # 도메인별 비즈니스 로직 컴포넌트
│   ├── auth/                    # 인증 도메인
│   │   ├── components/
│   │   │   └── LoginForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── services/
│   │       └── authService.ts
│   │
│   ├── posts/                   # 학습 노트 도메인
│   │   ├── components/
│   │   │   ├── PostList.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostForm.tsx
│   │   │   ├── PostDetail.tsx
│   │   │   └── PostAttachmentUploader.tsx
│   │   ├── hooks/
│   │   │   ├── usePosts.ts
│   │   │   └── usePost.ts
│   │   ├── services/
│   │   │   └── postService.ts
│   │   └── types.ts
│   │
│   ├── courses/                 # 코스 도메인 (Phase 2)
│   │   ├── components/
│   │   │   ├── CourseList.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseDetail.tsx
│   │   │   └── ConceptMap.tsx
│   │   ├── hooks/
│   │   │   └── useCourses.ts
│   │   ├── services/
│   │   │   └── courseService.ts
│   │   └── types.ts
│   │
│   ├── ai/                      # AI 처리 도메인
│   │   ├── components/
│   │   │   ├── AIResultView.tsx
│   │   │   └── AIProcessingIndicator.tsx
│   │   ├── hooks/
│   │   │   └── useAIProcessing.ts
│   │   ├── services/
│   │   │   └── aiService.ts
│   │   └── types.ts
│   │
│   └── quiz/                    # 퀴즈 도메인 (Phase 2)
│       ├── components/
│       │   ├── QuizDialog.tsx
│       │   └── QuizQuestion.tsx
│       ├── hooks/
│       │   └── useQuiz.ts
│       ├── services/
│       │   └── quizService.ts
│       └── types.ts
│
├── lib/                         # 공통 라이브러리 및 유틸리티
│   ├── supabase/
│   │   ├── client.ts            # Supabase 클라이언트 (Client-side)
│   │   ├── server.ts             # Supabase 클라이언트 (Server-side)
│   │   └── middleware.ts        # Supabase 미들웨어
│   │
│   ├── utils/
│   │   ├── cn.ts                # className 유틸리티 (clsx, tailwind-merge)
│   │   ├── date.ts              # 날짜 포맷팅
│   │   ├── validation.ts        # 폼 검증
│   │   └── file.ts              # 파일 처리 유틸리티
│   │
│   └── constants/
│       ├── routes.ts             # 라우트 상수
│       └── config.ts             # 앱 설정
│
├── hooks/                       # 프로젝트 전용 커스텀 훅
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
│
├── types/                       # 공통 타입 정의
│   ├── database.ts              # Supabase DB 타입 (자동 생성)
│   ├── api.ts                   # API 응답 타입
│   └── global.ts                # 전역 타입
│
├── contexts/                    # React Context (Phase 1 전환용)
│   ├── PostsContext.tsx         # Posts 상태 관리
│   ├── AppContext.tsx           # 전역 앱 상태
│   └── AuthContext.tsx          # 인증 상태
│
├── docs/                        # 프로젝트 문서
│   ├── tech-stack.md            # 기술 명세서
│   ├── db-schema.md             # 데이터베이스 설계
│   └── PROJECT_STRUCTURE.md     # 이 파일
│
├── public/                      # 정적 파일
│   └── ...
│
├── .env.local                   # 환경 변수 (로컬)
├── .env.example                 # 환경 변수 예시
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 설계 원칙

### 1. **도메인 중심 설계 (Domain-Driven Design)**
- 각 도메인(auth, posts, courses, ai, quiz)은 독립적인 폴더 구조를 가짐
- 도메인 내부에 components, hooks, services, types를 포함하여 응집도 향상
- 도메인 간 의존성 최소화

### 2. **레이어 분리**
- **UI Layer**: `components/` - 순수 UI 컴포넌트
- **Domain Layer**: `domain/` - 비즈니스 로직이 포함된 도메인 컴포넌트
- **Data Layer**: `lib/supabase/`, `domain/*/services/` - 데이터 접근
- **Infrastructure Layer**: `lib/utils/`, `hooks/` - 공통 유틸리티

### 3. **확장성 고려**
- Phase 1 기능은 최소 구현, Phase 2 확장을 위한 구조 준비
- 새로운 도메인 추가 시 동일한 패턴 적용 가능
- API Routes와 Server Actions 병행 가능한 구조

### 4. **코드 중복 최소화**
- 공통 UI 컴포넌트는 `components/ui/`에 집중
- 비즈니스 로직은 `domain/*/services/`에 분리
- 커스텀 훅으로 로직 재사용

### 5. **타입 안정성**
- `types/` 폴더에 중앙화된 타입 정의
- Supabase 타입 자동 생성 활용
- 도메인별 타입은 각 도메인 폴더 내부에 정의

## 📝 다음 단계

1. ✅ 폴더 구조 설계 (현재 단계)
2. ⏳ 사용자 확인 대기
3. ⏳ 빈 파일 구조 생성
4. ⏳ 기술 명세서 작성
5. ⏳ 데이터베이스 설계 가이드 작성
