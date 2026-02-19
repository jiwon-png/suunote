# Vercel "처리 중 무한 상태" 원인 분석 보고서

## 요약

**가장 유력한 원인**: `middleware.ts`의 `await supabase.auth.getUser()`가 **모든 요청**에서 실행되며, Vercel Edge 환경에서 Supabase 연결 지연/실패 시 **Server Action 요청이 middleware 단계에서 블로킹**됨.

---

## 1. addPost() 이후 await 체인 분석

### 실행 순서 (app/(main)/posts/new/page.tsx)

```
1. await createPostAction(formData)     ← 블로킹 (첫 번째 await)
2. await addPost(post)                  ← addPost는 즉시 return (블로킹 아님)
3. setIsSubmitting(false)
4. router.push(`/posts/${post.id}`)
5. void (async () => { getPost 재시도 루프 })()  ← 백그라운드
6. fetch('/api/ai/pipeline')            ← fire-and-forget
```

### 결론
- getPost 재시도 루프는 `router.push()` **이후**에 `void`로 실행됨 → UI 블로킹 없음 ✅
- addPost는 동기적으로 빠르게 return → 블로킹 아님 ✅
- **문제**: 1번 `createPostAction`이 응답하지 않으면 2~6번 모두 실행되지 않음

---

## 2. API Route 런타임 분석

| 파일 | runtime | maxDuration |
|------|---------|-------------|
| app/api/ai/pipeline/route.ts | `nodejs` ✅ | 60 |
| app/api/ai/route.ts | (없음 → Edge) | - |
| app/api/posts/route.ts | (없음 → Edge) | - |
| app/api/auth/route.ts | (확인 필요) | - |
| app/api/auth/callback/route.ts | (확인 필요) | - |
| app/api/courses/route.ts | (확인 필요) | - |

**AI pipeline route**: `runtime = 'nodejs'` 설정됨 ✅ (Edge 아님)

**참고**: 새 글 작성 시 호출되는 것은 `createPostAction` (Server Action)이지 API Route가 아님. API Route는 AI 파이프라인만 해당.

---

## 3. Supabase 호출 흐름 및 Middleware 블로킹 (핵심)

### middleware.ts 현황

```typescript
// middleware.ts
const SKIP_SUPABASE_IN_MIDDLEWARE = false;  // ← 현재 false

export async function middleware(req: NextRequest) {
  // ...
  await supabase.auth.getUser();  // ← 모든 요청에서 Supabase 네트워크 호출
  return res;
}
```

### 요청 흐름

```
[브라우저] --POST (Server Action)--> [Vercel Edge: middleware]
                                         │
                                         ▼
                              await supabase.auth.getUser()
                              (Supabase API 호출)
                                         │
                              [지연/실패 시 여기서 블로킹]
                                         │
                                         ▼
                              [Node: Server Action] createPostAction
```

### 로컬 vs Vercel 차이

| 환경 | Middleware 런타임 | Supabase 연결 |
|------|-------------------|---------------|
| 로컬 | Node.js (또는 Edge) | localhost → Supabase (직접) |
| Vercel | **Edge** (기본) | Edge Region → Supabase (지리적 거리, cold start) |

**Vercel Edge**에서 Supabase `auth.getUser()` 호출 시:
- Cold start 시 연결 지연
- Edge와 Supabase 간 네트워크 지연
- 타임아웃 없이 무한 대기 가능

---

## 4. isSubmitting 상태 처리

```typescript
// 성공 경로
setIsSubmitting(false)   // ← 155번 줄에서 명시적 해제 ✅
router.push(...)

// finally 블록
} finally {
  setIsSubmitting(false)  // ← 중복이지만 안전
}
```

**결론**: 성공 시 155번 줄에서 먼저 해제됨. `createPostAction`이 완료되지 않으면 155번 줄에 도달하지 못함.

---

## 5. 네트워크 블로킹 가능성

- getPost 재시도: `void`로 실행 → 메인 플로우 블로킹 없음
- fetch('/api/ai/pipeline'): `.then()/.catch()` 사용, await 없음 → 블로킹 없음
- **createPostAction**: 유일한 블로킹 지점. Server Action이므로 **요청 자체가 middleware에서 막히면** 응답 불가.

---

## 수정 제안

### 1. [최우선] Middleware에서 Supabase 호출 비활성화

**파일**: `middleware.ts`

```typescript
// Supabase 접속 불가/지연 시 Server Action 블로킹 방지
const SKIP_SUPABASE_IN_MIDDLEWARE = true;  // false → true
```

또는 **특정 경로에서만 스킵**:

```typescript
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  // Server Action POST 또는 /posts/new 등에서 Supabase 스킵 (블로킹 방지)
  const isFormAction = req.method === 'POST' && (
    req.nextUrl.pathname.startsWith('/posts') ||
    req.nextUrl.pathname.startsWith('/api')
  );
  if (SKIP_SUPABASE_IN_MIDDLEWARE || isFormAction) {
    return res;
  }

  // ... 기존 Supabase 로직
}
```

### 2. [권장] UI 먼저 전환, Post 생성은 백그라운드

**파일**: `app/(main)/posts/new/page.tsx`

createPostAction을 await하지 않고, **먼저 router.push**한 뒤 백그라운드에서 생성:

```typescript
// 1. 즉시 로딩 해제 + 리다이렉트 (임시 ID 또는 로딩 페이지로)
setIsSubmitting(false);
router.push('/posts?created=pending');  // 또는 /posts로 이동

// 2. 백그라운드에서 Post 생성
void (async () => {
  const { data: post, error } = await createPostAction(formData);
  if (error || !post) {
    // 에러 처리: 토스트 또는 전역 상태
    return;
  }
  router.replace(`/posts/${post.id}`);
})();
```

※ 이 방식은 "생성 중" 상태 UI가 필요하므로, **1번(Middleware 수정)을 먼저 적용**하는 것이 현실적.

### 3. Server Action maxDuration (Next.js 15+)

**파일**: `app/(main)/posts/actions.ts` 상단

```typescript
'use server'

export const maxDuration = 30;  // Server Action 타임아웃 (초)

export async function createPostAction(...) {
  // ...
}
```

---

## 권장 조치 순서

1. **✅ 적용됨**: `middleware.ts`에서 `SKIP_SUPABASE_IN_MIDDLEWARE = true` 적용
2. **검증**: Vercel 재배포 후 글 작성 플로우 테스트
3. **선택**: 세션 검증이 꼭 필요하면, `/posts/new` 등 특정 경로만 스킵하도록 조건 추가
