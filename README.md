# SSU-Note

Smart Study University Note - AI 기반 학습 구조화 플랫폼

## 📋 프로젝트 개요

SSU-Note는 대학생의 학습 자료를 구조화하고 AI를 활용하여 학습 효율을 높이는 플랫폼입니다.

### Phase 1 (MVP)
- Google OAuth 인증 (Mock)
- 텍스트 기반 학습 노트 CRUD
- AI 텍스트 처리 (요약, 핵심 포인트, 학습 방향 제안)
- AI 결과 저장 및 재조회

### Phase 2 (Advanced)
- Course/Session 구조화
- 개념 맵 시각화
- 학습 타임라인
- 퀴즈 및 해설

## 🏗️ 프로젝트 구조

```
suunote/
├── app/                    # Next.js 15 App Router
├── components/             # 전역 재사용 UI 컴포넌트
├── domain/                # 도메인별 비즈니스 로직
├── lib/                   # 공통 라이브러리 및 유틸리티
├── hooks/                 # 커스텀 훅
├── types/                 # 타입 정의
├── contexts/              # React Context
└── docs/                  # 프로젝트 문서
```

자세한 구조는 [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)를 참고하세요.

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- pnpm (권장) 또는 npm/yarn
- Supabase 프로젝트 (Phase 1 후반 또는 Phase 2)

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase 정보 입력
```

### 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📚 문서

- [프로젝트 구조](./docs/PROJECT_STRUCTURE.md) - 폴더 구조 및 설계 원칙
- [기술 명세서](./docs/tech-stack.md) - 사용 기술 스택 및 아키텍처
- [데이터베이스 설계](./docs/db-schema.md) - DB 스키마 및 RLS 정책
- [PRD](./PRD.md) - 제품 요구사항 문서
- [FLOW](./FLOW.md) - 사용자 플로우 및 시퀀스 다이어그램

## 🛠️ 기술 스택

### Core
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5**

### 스타일링
- **Tailwind CSS 4**
- **shadcn/ui** (예정)

### 데이터베이스 & 인증
- **Supabase** (PostgreSQL, Auth, Storage)

### 기타
- **Lucide React** (아이콘)
- **clsx** & **tailwind-merge** (스타일 유틸리티)

## 📦 주요 기능

### Phase 1
- ✅ 프로젝트 구조 설계
- ⏳ 인증 시스템 (Google OAuth)
- ⏳ 학습 노트 CRUD
- ⏳ AI 텍스트 처리
- ⏳ AI 결과 저장

### Phase 2
- ⏳ Course/Session 구조
- ⏳ 개념 맵
- ⏳ 학습 타임라인
- ⏳ 퀴즈 시스템

## 🔧 개발 가이드

### 코드 스타일
- TypeScript 엄격 모드 사용
- 컴포넌트는 PascalCase
- 훅은 `use` 접두사 사용
- 파일명은 컴포넌트명과 일치

### 폴더 구조 원칙
- 도메인 중심 설계 (Domain-Driven Design)
- 재사용 가능한 컴포넌트는 `components/`에
- 도메인별 비즈니스 로직은 `domain/`에
- 공통 유틸리티는 `lib/`에

## 📝 라이선스

Private
