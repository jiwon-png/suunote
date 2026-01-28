# UI 마이그레이션 및 의존성 설치 이력

## 📅 설치 정보

- **설치 날짜**: 2026년 1월 28일
- **작업자**: 시니어 개발자 & AI 파트너
- **작업 목적**: v0에서 생성된 UI 컴포넌트 이식 및 shadcn/ui 기반 컴포넌트 시스템 구축

---

## 📦 설치된 라이브러리 목록

### UI 컴포넌트 라이브러리 (Radix UI)

다음 Radix UI 패키지들이 설치되었습니다:

```bash
pnpm add @radix-ui/react-alert-dialog@^1.1.4
pnpm add @radix-ui/react-dialog@^1.1.4
pnpm add @radix-ui/react-dropdown-menu@^2.1.4
pnpm add @radix-ui/react-label@^2.1.1
pnpm add @radix-ui/react-radio-group@^1.2.2
pnpm add @radix-ui/react-select@^2.1.4
pnpm add @radix-ui/react-slot@^1.1.1
pnpm add @radix-ui/react-tabs@^1.1.2
```

### 스타일 유틸리티 라이브러리

```bash
pnpm add clsx@^2.1.1
pnpm add tailwind-merge@^2.6.0
pnpm add class-variance-authority@^0.7.1
```

### 아이콘 라이브러리

```bash
pnpm add lucide-react@^0.468.0
```

### 데이터베이스 & 인증

```bash
pnpm add @supabase/ssr@^0.5.2
pnpm add @supabase/supabase-js@^2.47.10
```

---

## 🎯 각 라이브러리 설치 이유

### 1. Radix UI 컴포넌트 패키지들

**설치 이유**:
- **shadcn/ui 기반 컴포넌트 시스템 구축**: shadcn/ui는 Radix UI를 기반으로 하며, 접근성과 사용성을 모두 갖춘 컴포넌트를 제공합니다.
- **v0 UI 이식**: v0에서 생성된 UI 컴포넌트들이 Radix UI를 사용하므로, 해당 컴포넌트들을 프로젝트에 이식하기 위해 필요했습니다.
- **접근성 보장**: Radix UI는 WAI-ARIA 가이드라인을 준수하여 키보드 네비게이션, 스크린 리더 지원 등 접근성 기능을 제공합니다.

**사용되는 컴포넌트**:
- `AlertDialog`: 확인/취소 다이얼로그
- `Dialog`: 모달 다이얼로그
- `DropdownMenu`: 드롭다운 메뉴
- `Label`: 폼 레이블
- `RadioGroup`: 라디오 버튼 그룹
- `Select`: 선택 드롭다운
- `Slot`: 컴포넌트 합성 유틸리티
- `Tabs`: 탭 인터페이스

### 2. `clsx` (v2.1.1)

**설치 이유**:
- **조건부 className 생성**: 동적으로 className을 생성할 때 조건부로 클래스를 추가/제거하는 유틸리티 함수 제공
- **shadcn/ui 컴포넌트 필수 의존성**: shadcn/ui 컴포넌트들이 `clsx`를 사용하여 className을 처리합니다.
- **코드 가독성 향상**: 복잡한 조건부 클래스 로직을 간결하게 표현할 수 있습니다.

**사용 예시**:
```typescript
import { clsx } from 'clsx'

clsx('foo', { bar: true }, { baz: false }) // 'foo bar'
```

### 3. `tailwind-merge` (v2.6.0)

**설치 이유**:
- **Tailwind CSS 클래스 충돌 해결**: 동일한 유틸리티 클래스가 중복될 때, 나중에 선언된 클래스가 우선순위를 갖도록 병합합니다.
- **컴포넌트 확장성**: 기본 스타일을 가진 컴포넌트에 props로 전달된 className을 안전하게 병합할 수 있습니다.
- **`cn` 유틸리티 함수 구현**: `clsx`와 함께 사용하여 완전한 className 유틸리티 함수를 만듭니다.

**사용 예시**:
```typescript
import { twMerge } from 'tailwind-merge'

twMerge('px-2 py-1', 'px-4') // 'py-1 px-4' (px-2가 px-4로 대체됨)
```

**구현된 유틸리티** (`lib/utils/cn.ts`):
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4. `class-variance-authority` (v0.7.1)

**설치 이유**:
- **컴포넌트 variant 관리**: 버튼, 배지 등 컴포넌트의 다양한 스타일 변형(variant)을 타입 안전하게 관리합니다.
- **shadcn/ui 컴포넌트 표준**: shadcn/ui의 Button, Badge 등 컴포넌트들이 CVA를 사용하여 variant를 정의합니다.
- **타입 안정성**: TypeScript와 함께 사용하여 variant와 size props의 타입을 자동으로 추론합니다.

**사용 예시** (`components/ui/button.tsx`):
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        destructive: "destructive-classes",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
      },
    },
  }
)
```

### 5. `lucide-react` (v0.468.0)

**설치 이유**:
- **일관된 아이콘 세트**: 프로젝트 전반에 걸쳐 일관된 디자인의 아이콘을 사용할 수 있습니다.
- **Tree-shaking 지원**: 사용하지 않는 아이콘은 번들에서 제외되어 번들 크기를 최적화합니다.
- **커스터마이징 가능**: SVG 기반 아이콘이므로 크기, 색상 등을 Tailwind CSS로 쉽게 조정할 수 있습니다.
- **v0 UI 이식**: v0에서 생성된 컴포넌트들이 lucide-react 아이콘을 사용하고 있습니다.

**사용 예시**:
```typescript
import { Book, Plus, Trash2 } from 'lucide-react'

<Book className="w-5 h-5" />
```

### 6. `@supabase/ssr` (v0.5.2)

**설치 이유**:
- **Next.js App Router SSR 지원**: Next.js 16 App Router 환경에서 Supabase 클라이언트를 서버 컴포넌트와 클라이언트 컴포넌트 모두에서 사용할 수 있도록 합니다.
- **쿠키 기반 인증 관리**: 서버와 클라이언트 간 인증 상태를 쿠키를 통해 동기화합니다.
- **미들웨어 통합**: Next.js middleware에서 인증 상태를 확인하고 리다이렉트할 수 있습니다.

**사용 위치**:
- `lib/supabase/server.ts`: 서버 컴포넌트용 클라이언트
- `lib/supabase/middleware.ts`: 미들웨어용 클라이언트
- `lib/supabase/client.ts`: 클라이언트 컴포넌트용 클라이언트

### 7. `@supabase/supabase-js` (v2.47.10)

**설치 이유**:
- **Supabase 클라이언트 코어 라이브러리**: 데이터베이스 쿼리, 인증, 스토리지 등 Supabase의 모든 기능을 사용하기 위한 기본 라이브러리입니다.
- **타입 안정성**: TypeScript 타입 정의가 포함되어 있어 타입 안전한 데이터베이스 쿼리가 가능합니다.
- **`@supabase/ssr`의 의존성**: `@supabase/ssr`이 내부적으로 `@supabase/supabase-js`를 사용합니다.

---

## ⚠️ 발생했던 에러와 해결 과정

### 1. Tailwind CSS 버전 호환성 문제

**문제**:
- 프로젝트는 Tailwind CSS v4를 사용하고 있었지만, 일부 라이브러리들이 Tailwind CSS v3를 가정하고 있었습니다.
- `tailwind-merge`의 버전이 v3용과 v4용이 달라 호환성 문제가 발생할 수 있었습니다.

**해결**:
- `tailwind-merge` v2.6.0을 설치하여 Tailwind CSS v4와 호환되는 버전을 사용했습니다.
- `cn` 유틸리티 함수를 `lib/utils/cn.ts`에 구현하여 프로젝트 전반에서 일관되게 사용하도록 했습니다.

### 2. Radix UI 패키지 버전 일관성

**문제**:
- v0에서 생성된 프로젝트의 `package.json`과 현재 프로젝트의 버전 요구사항이 달랐습니다.
- 일부 Radix UI 패키지들의 버전이 서로 호환되지 않을 수 있었습니다.

**해결**:
- v0 프로젝트(`tmp-v0`)의 `package.json`을 참고하여 필요한 최소 버전을 확인했습니다.
- 현재 프로젝트에 실제로 사용되는 컴포넌트에 필요한 Radix UI 패키지만 선택적으로 설치했습니다.
- 모든 Radix UI 패키지를 최신 안정 버전으로 통일하여 호환성을 보장했습니다.

### 3. TypeScript 타입 에러

**문제**:
- `class-variance-authority`의 `VariantProps` 타입을 사용할 때 TypeScript 타입 추론이 제대로 작동하지 않는 경우가 있었습니다.

**해결**:
- `components/ui/button.tsx`에서 `VariantProps<typeof buttonVariants>`를 명시적으로 사용하여 타입을 정의했습니다.
- React 19와의 호환성을 확인하고 필요한 타입 정의를 추가했습니다.

### 4. Next.js 16과 React 19 호환성

**문제**:
- Next.js 16.1.6과 React 19.2.3을 사용하는 환경에서 일부 라이브러리들이 아직 완전히 호환되지 않을 수 있었습니다.

**해결**:
- 모든 라이브러리를 최신 버전으로 업데이트하여 React 19 호환성을 확보했습니다.
- `@types/react`와 `@types/react-dom`을 v19로 업데이트하여 타입 정의를 최신화했습니다.

---

## 📝 참고 사항

### 설치되지 않은 v0 라이브러리들

v0 프로젝트에는 더 많은 라이브러리가 있었지만, 현재 프로젝트에서는 다음 라이브러리들은 설치하지 않았습니다:

- `@hookform/resolvers`, `react-hook-form`: 폼 관리 (Phase 2에서 필요 시 추가 예정)
- `zod`: 런타임 타입 검증 (Phase 2에서 필요 시 추가 예정)
- `date-fns`: 날짜 처리 (필요 시 추가 예정)
- `recharts`: 데이터 시각화 (Phase 2에서 필요 시 추가 예정)
- `cmdk`, `sonner`, `vaul` 등: 현재 단계에서는 불필요한 UI 컴포넌트

### 향후 추가 예정 라이브러리

**Phase 1 후반**:
- `react-query` 또는 `@tanstack/react-query`: 복잡한 데이터 캐싱 및 서버 상태 관리

**Phase 2**:
- `zod`: 런타임 타입 검증
- `react-hook-form`: 폼 관리
- `date-fns`: 날짜 처리
- `recharts` 또는 `visx`: 데이터 시각화 (개념 맵, 타임라인)

---

## ✅ 검증 완료 사항

- [x] 모든 라이브러리가 정상적으로 설치됨
- [x] `cn` 유틸리티 함수가 정상 작동함
- [x] UI 컴포넌트들이 정상적으로 렌더링됨
- [x] TypeScript 타입 에러 없음
- [x] 빌드 에러 없음
- [x] Next.js 16 및 React 19 호환성 확인 완료

---

**작성일**: 2026년 1월 28일  
**작성자**: 시니어 개발자 & AI 파트너
