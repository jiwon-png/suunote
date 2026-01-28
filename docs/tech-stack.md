# SSU-Note 기술 명세서

## 📚 기술 스택

### Core Framework
- **Next.js 15** (App Router)
  - Server Components 기본 사용
  - Server Actions를 통한 데이터 변이
  - 파일 기반 라우팅
  - 병렬 라우팅 및 인터셉팅 라우트 지원

### UI Framework
- **React 19**
  - Server Components
  - Client Components (필요 시 'use client' 지시어 사용)
  - React Context API (Phase 1 전환용)

### 스타일링
- **Tailwind CSS 4**
  - 유틸리티 퍼스트 CSS 프레임워크
  - 반응형 디자인 기본 지원
  - 커스텀 디자인 시스템 구축

- **shadcn/ui**
  - Radix UI 기반 접근성 컴포넌트
  - Tailwind CSS로 스타일링
  - 복사-붙여넣기 방식의 컴포넌트 라이브러리
  - 완전한 커스터마이징 가능

### 아이콘
- **Lucide React**
  - 일관된 아이콘 세트
  - Tree-shaking 지원
  - 커스터마이징 가능한 SVG 아이콘

### 데이터베이스 & 인증
- **Supabase**
  - PostgreSQL 데이터베이스
  - Row Level Security (RLS)
  - 실시간 구독 (Realtime)
  - 인증 (Google OAuth)
  - 파일 스토리지
  - 자동 생성 타입 지원

### 타입 안정성
- **TypeScript 5**
  - 엄격한 타입 체크
  - Supabase 타입 자동 생성
  - 도메인별 타입 정의

### 개발 도구
- **ESLint**
  - Next.js 기본 설정
  - 코드 품질 유지

- **pnpm**
  - 빠른 패키지 관리
  - 디스크 공간 효율성

## 🏗️ 아키텍처 설계 원칙

### 1. App Router 기반 구조

#### 라우팅 전략
```
app/
├── (auth)/          # 인증 관련 그룹 라우트
├── (main)/          # 메인 기능 그룹 라우트
└── api/             # API Routes (필요 시)
```

- **Route Groups**: `(auth)`, `(main)`으로 논리적 그룹화
- **Dynamic Routes**: `[id]`를 통한 동적 라우팅
- **Layouts**: 중첩 레이아웃으로 공통 UI 재사용

#### Server vs Client Components
- **기본**: Server Components 사용
- **Client Components 전환 조건**:
  - `useState`, `useEffect` 등 훅 사용
  - 브라우저 이벤트 핸들러
  - Context API 사용
  - 실시간 업데이트 필요

### 2. 컴포넌트 설계 원칙

#### 계층 구조
```
components/ui/          # 순수 UI 컴포넌트 (재사용 가능)
domain/*/components/    # 도메인별 비즈니스 컴포넌트
```

#### 컴포넌트 분리 기준
- **UI 컴포넌트**: 스타일과 기본 인터랙션만 담당
- **도메인 컴포넌트**: 비즈니스 로직과 데이터 처리 포함
- **페이지 컴포넌트**: 라우트별 최상위 컴포넌트

### 3. 상태 관리 전략

#### Phase 1 (전환 기간)
- **React Context API**: 클라이언트 상태 관리
  - `PostsContext`: Posts 상태
  - `AppContext`: 전역 앱 상태
  - `AuthContext`: 인증 상태

#### Phase 2 (Supabase 전환 후)
- **Server Components**: 기본 데이터 페칭
- **Server Actions**: 데이터 변이
- **Supabase Realtime**: 실시간 업데이트 (필요 시)
- **React Query** (선택적): 복잡한 캐싱이 필요한 경우

### 4. 데이터 페칭 패턴

#### Server Components
```typescript
// app/posts/page.tsx
async function PostsPage() {
  const posts = await getPosts() // Server Component에서 직접 호출
  return <PostList posts={posts} />
}
```

#### Server Actions
```typescript
// app/posts/actions.ts
'use server'
export async function createPost(data: PostData) {
  // Supabase 호출
}
```

#### Client Components
```typescript
// domain/posts/hooks/usePosts.ts
'use client'
export function usePosts() {
  // Context 또는 React Query 사용
}
```

### 5. 타입 안정성

#### Supabase 타입 생성
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

#### 도메인별 타입
- 각 도메인 폴더 내부에 `types.ts` 정의
- 공통 타입은 `types/` 폴더에 중앙화

### 6. 파일 구조 규칙

#### 네이밍 컨벤션
- **컴포넌트**: PascalCase (`PostCard.tsx`)
- **훅**: camelCase with `use` prefix (`usePosts.ts`)
- **유틸리티**: camelCase (`cn.ts`, `date.ts`)
- **타입**: camelCase (`types.ts`, `database.ts`)
- **상수**: UPPER_SNAKE_CASE (`routes.ts`)

#### 파일 위치 규칙
- 같은 도메인 내의 파일은 같은 폴더에 배치
- 공통으로 사용되는 것은 상위 폴더로 이동
- 3개 이상 재사용되면 공통 폴더로 이동 고려

## 🔧 주요 라이브러리 상세

### shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button input card dialog
```

**사용 예시**:
- `Button`: 모든 버튼 UI
- `Input`: 폼 입력 필드
- `Card`: 콘텐츠 카드
- `Dialog`: 모달/다이얼로그
- `Toast`: 알림 메시지

### Supabase 클라이언트 설정
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Lucide React
```typescript
import { Book, Plus, Trash2 } from 'lucide-react'

<Book className="w-5 h-5" />
```

## 📦 추가 예정 라이브러리

### Phase 1
- `@supabase/ssr`: Supabase SSR 지원
- `@supabase/supabase-js`: Supabase 클라이언트
- `clsx`: className 유틸리티
- `tailwind-merge`: Tailwind 클래스 병합

### Phase 2 (필요 시)
- `react-query` 또는 `@tanstack/react-query`: 복잡한 데이터 캐싱
- `zod`: 런타임 타입 검증
- `react-hook-form`: 폼 관리
- `date-fns`: 날짜 처리
- `recharts` 또는 `visx`: 데이터 시각화 (개념 맵, 타임라인)

## 🎨 스타일 가이드

### Tailwind CSS 설정
- 커스텀 컬러 팔레트 정의
- 다크 모드 지원 (Phase 2)
- 반응형 브레이크포인트 활용

### 컴포넌트 스타일링
- shadcn/ui 컴포넌트를 기본으로 사용
- 필요 시 `components/ui/`에서 커스터마이징
- 도메인별 컴포넌트는 Tailwind 유틸리티 클래스 사용

## 🔐 보안 고려사항

### 환경 변수
- `.env.local`: 로컬 개발 환경 변수
- `.env.example`: 예시 파일 (민감 정보 제외)
- Supabase 키는 클라이언트/서버 분리

### RLS (Row Level Security)
- 모든 테이블에 RLS 정책 적용
- 사용자별 데이터 접근 제어
- 서버 사이드에서 권한 검증

## 📈 성능 최적화

### Next.js 최적화
- Server Components로 초기 로드 최소화
- 이미지 최적화 (`next/image`)
- 자동 코드 스플리팅
- 정적 생성 가능한 페이지는 SSG 활용

### 데이터 페칭
- 필요한 데이터만 페칭
- Server Components에서 직접 데이터 로드
- 클라이언트 사이드 캐싱 최소화 (Phase 1)

## 🚀 배포 전략

### 환경
- **개발**: 로컬 Supabase 프로젝트
- **스테이징**: Supabase 스테이징 프로젝트
- **프로덕션**: Vercel + Supabase 프로덕션

### CI/CD
- GitHub Actions (선택적)
- Vercel 자동 배포
- 환경별 환경 변수 관리
