# 초기 환경 구축 문서

## 1. 프로젝트 개요

### 프로젝트명
**SSU-Note (슈-노트)** - Smart Study University Note

### 목적

SSU-Note는 대학생의 분산된 학습 자료를 하나의 흐름으로 정리하고,  
AI의 도움을 받아 **학습 내용을 구조화·요약·확장**할 수 있도록 돕는  
개인 학습 관리 및 학습 보조 SaaS 플랫폼이다.

단순한 노트 작성 도구가 아니라,  
**"수업 → 정리 → 이해 → 복습"**의 전 과정을 하나의 학습 경험으로 연결하는 것을 목표로 한다.

### 핵심 가치

SSU-Note는 AI를 통해 학습 내용을 자동으로 구조화하여, 대학생이 수업 내용을 더 쉽게 이해하고 지속적으로 축적·확장할 수 있는 학습 경험을 제공한다.

---

## 2. 기술 스택 선정 이유 (Tech Stack)

### Framework: Next.js 15 (App Router)

**선정 이유**:
- **SEO 친화적 구조**: Server Components를 기본으로 사용하여 검색 엔진 최적화가 용이함
- **빠른 라우팅과 최적화된 사용자 경험**: 파일 기반 라우팅과 자동 코드 스플리팅으로 빠른 페이지 전환 제공
- **서버 컴포넌트 기본 사용**: 클라이언트 번들 크기 최소화 및 초기 로딩 속도 개선
- **Server Actions 지원**: API Routes 없이도 서버 로직을 직접 호출 가능

### Styling: Tailwind CSS 4, Lucide React

**선정 이유**:
- **빠른 UI 프로토타이핑**: 유틸리티 클래스를 통한 즉각적인 스타일링
- **일관된 디자인 시스템 유지**: Tailwind의 디자인 토큰을 활용한 일관성 있는 UI 구축
- **Tree-shaking 지원**: Lucide React는 사용하는 아이콘만 번들에 포함되어 번들 크기 최적화
- **커스터마이징 용이**: Tailwind 설정을 통한 프로젝트별 디자인 시스템 구축 가능

**추가 스타일 유틸리티**:
- `clsx`: 조건부 className 생성
- `tailwind-merge`: Tailwind 클래스 충돌 해결 및 병합
- `class-variance-authority`: 컴포넌트 variant 관리

### Backend / DB: Supabase

**선정 이유**:
- **서버리스 환경 기반**: 별도의 백엔드 서버 구축 없이 빠른 개발 가능
- **인증(Auth) 통합**: Google OAuth 등 소셜 로그인을 간편하게 구현 가능
- **PostgreSQL 데이터베이스**: 관계형 데이터베이스의 강력한 기능 활용
- **실시간 데이터 처리**: Realtime 구독을 통한 실시간 업데이트 지원
- **Row Level Security (RLS)**: 데이터베이스 레벨에서의 보안 정책 구현
- **자동 타입 생성**: Supabase CLI를 통한 TypeScript 타입 자동 생성

**사용 패키지**:
- `@supabase/ssr`: Next.js App Router 환경에서의 SSR 지원
- `@supabase/supabase-js`: Supabase 클라이언트 라이브러리

### Package Manager: pnpm

**선정 이유**:
- **빠른 의존성 설치 속도**: 하드 링크를 활용한 효율적인 패키지 관리
- **디스크 사용 효율 개선**: 중복 패키지를 공유하여 디스크 공간 절약
- **엄격한 의존성 관리**: `package.json`의 의존성 선언을 엄격하게 준수

### AI Tooling: Cursor

**선정 이유**:
- **v0 UI 이식 기반 개발**: v0.dev에서 생성된 UI 컴포넌트를 프로젝트에 이식하여 개발 속도 향상
- **Vibe Coding 전략을 통한 생산성 향상**: AI와의 협업을 통한 빠른 프로토타이핑 및 개발
- **프로젝트 규칙 기반 개발**: `.cursor/rules/*.mdc` 파일을 통한 일관된 코드 스타일 및 아키텍처 유지

---

## 3. 초기 환경 구축 내역

### Boilerplate

**Next.js 기본 App Router 구조 세팅**:
- Next.js 16.1.6 (App Router) 프로젝트 초기화
- React 19.2.3 및 TypeScript 5 설정
- ESLint 및 Next.js 기본 설정 적용

**폴더 구조 확립**:
```
suunote/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 그룹 라우트
│   ├── (main)/            # 메인 기능 그룹 라우트
│   └── api/               # API Routes
├── components/             # 전역 재사용 UI 컴포넌트
│   ├── ui/                # shadcn/ui 기반 기본 컴포넌트
│   ├── common/            # 공통 컴포넌트
│   └── layout/            # 레이아웃 컴포넌트
├── domain/                # 도메인별 비즈니스 로직
│   ├── auth/              # 인증 도메인
│   ├── posts/             # 학습 노트 도메인
│   ├── courses/            # 코스 도메인 (Phase 2)
│   ├── ai/                # AI 처리 도메인
│   └── quiz/              # 퀴즈 도메인 (Phase 2)
├── lib/                   # 공통 라이브러리 및 유틸리티
│   ├── supabase/          # Supabase 클라이언트 설정
│   ├── utils/             # 유틸리티 함수
│   └── constants/         # 상수 정의
├── hooks/                 # 커스텀 훅
├── types/                 # 타입 정의
├── contexts/              # React Context
└── docs/                  # 프로젝트 문서
```

**주요 설정 파일**:
- `tsconfig.json`: TypeScript 엄격 모드 설정
- `next.config.ts`: Next.js 설정
- `postcss.config.mjs`: Tailwind CSS 설정
- `middleware.ts`: Next.js 미들웨어 (인증 처리)

### Design Assets

**v0.dev를 활용한 초기 UI 설계**:
- v0.dev에서 생성된 UI 컴포넌트를 `tmp-v0/` 폴더에 백업 보관
- 필요한 UI 컴포넌트를 프로젝트에 선택적으로 이식
- shadcn/ui 기반 컴포넌트 시스템 구축

**이식된 UI 컴포넌트**:
- `components/ui/button.tsx`: 버튼 컴포넌트 (variant 지원)
- `components/ui/card.tsx`: 카드 컴포넌트
- `components/ui/dialog.tsx`: 다이얼로그 컴포넌트
- `components/ui/input.tsx`: 입력 필드 컴포넌트
- `components/ui/textarea.tsx`: 텍스트 영역 컴포넌트
- `components/ui/tabs.tsx`: 탭 컴포넌트
- `components/ui/select.tsx`: 선택 드롭다운 컴포넌트
- `components/ui/alert-dialog.tsx`: 확인 다이얼로그 컴포넌트
- `components/ui/dropdown-menu.tsx`: 드롭다운 메뉴 컴포넌트
- `components/ui/radio-group.tsx`: 라디오 버튼 그룹 컴포넌트
- `components/ui/label.tsx`: 레이블 컴포넌트
- `components/ui/badge.tsx`: 배지 컴포넌트

**재사용 가능한 UI 자산 확보**:
- Radix UI 기반 접근성 컴포넌트
- Tailwind CSS를 활용한 일관된 스타일링
- Lucide React 아이콘 세트 통합

### Project Rules

**`.cursor/rules/*.mdc` 파일을 통한 AI 협업 규칙 수립**:

1. **`00-project-context.mdc`**: 프로젝트 컨텍스트 및 제외 규칙 정의
   - SSU-Note의 핵심 목표 및 범위 명시
   - `tmp-v0/` 폴더 제외 규칙

2. **`01-prd-and-flow.mdc`**: PRD 및 플로우 준수 규칙
   - 페이지 플로우 강제 (Login → Post List → Post Create → Post Detail)
   - Study Post 생명주기 규칙
   - Phase 1/2 경계 규칙

3. **`02-ux-ui-style.mdc`**: UX/UI 스타일 규칙
   - 선형 플로우 원칙
   - AI 결과 표시 규칙
   - Phase 2 UX 요소 제약

4. **`03-architecture-and-state.mdc`**: 아키텍처 및 상태 관리 규칙
   - Next.js App Router 사용 규칙
   - Context 기반 상태 관리 (Phase 1)
   - 데이터 플로우 규칙

5. **`04-ai-and-data-rules.mdc`**: AI 및 데이터 규칙
   - AI 처리 로직 규칙
   - 데이터 저장 및 조회 규칙

6. **`05-history-logging.mdc`**: 히스토리 로깅 규칙
   - 주요 변경사항 문서화 규칙

7. **`99-cursor-standard.mdc`**: Cursor 표준 규칙
   - 일반적인 코딩 표준 및 베스트 프랙티스

**코드 스타일 및 문서화 기준**:
- TypeScript 엄격 모드 사용
- 컴포넌트는 PascalCase, 훅은 `use` 접두사 사용
- 도메인 중심 설계 (Domain-Driven Design) 원칙 준수
- 주요 변경사항은 `docs/history/` 폴더에 문서화

---

## 4. 주요 문서화 현황

### `docs/PRD.md`
**제품 요구사항 정의서**

- 프로젝트 개요 및 Phase 1 목표
- 제품 범위 (In Scope / Out of Scope)
- 기능 명세 (인증, 학습 노트 CRUD, AI 처리)
- 데이터 모델 설계
- Phase 2 로드맵

### `docs/FLOW.md`
**사용자 시나리오 및 데이터 흐름 구조**

- 사용자 플로우 시퀀스 다이어그램
- 페이지별 상세 플로우 정의
- 데이터 흐름 및 상태 관리 흐름
- AI 처리 프로세스 정의

### `docs/PROJECT_STRUCTURE.md`
**프로젝트 구조 설계안**

- 폴더 트리 구조 상세 설명
- 각 폴더의 역할 및 책임
- 파일 네이밍 컨벤션
- 아키텍처 설계 원칙

### `docs/tech-stack.md`
**기술 명세서**

- 사용 기술 스택 상세 설명
- 아키텍처 설계 원칙
- 주요 라이브러리 사용 가이드
- 개발 도구 및 설정

### `docs/db-schema.md`
**데이터베이스 설계**

- 데이터베이스 스키마 정의
- 테이블 구조 및 관계
- Row Level Security (RLS) 정책
- 인덱스 및 제약 조건

### `docs/history/`
**프로젝트 히스토리 문서**

- `001-initial-setup.md`: 초기 환경 구축 이력 (현재 문서)
- `002-ui-migration-and-dependencies.md`: UI 마이그레이션 및 의존성 설치 이력

---

## 5. 개발 환경 설정

### 필수 요구사항
- **Node.js**: 18 이상
- **Package Manager**: pnpm (권장)
- **Supabase**: 프로젝트 계정 (Phase 1 후반 또는 Phase 2에서 사용)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase 정보 입력

# 개발 서버 실행
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 주요 스크립트

```bash
pnpm dev      # 개발 서버 실행
pnpm build    # 프로덕션 빌드
pnpm start    # 프로덕션 서버 실행
pnpm lint     # ESLint 실행
```

---

## 6. 다음 단계

### Phase 1 진행 사항
- ✅ 프로젝트 구조 설계
- ✅ 초기 환경 구축
- ✅ UI 컴포넌트 시스템 구축
- ✅ 문서화 체계 수립
- ⏳ 인증 시스템 구현 (Google OAuth)
- ⏳ 학습 노트 CRUD 구현
- ⏳ AI 텍스트 처리 연동
- ⏳ AI 결과 저장 및 재조회

### Phase 2 계획
- Course/Session 구조화
- 개념 맵 시각화
- 학습 타임라인
- 퀴즈 시스템

---

**작성일**: 2026년 1월 28일  
**작성자**: 시니어 개발자 & AI 파트너
