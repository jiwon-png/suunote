"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2 } from "lucide-react"
import { signInWithGoogle } from "@/domain/auth/services/authService"
import { isMockMode } from "@/lib/supabase/client"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

/**
 * LoginForm: useSearchParams를 사용하는 내부 컴포넌트
 * Suspense boundary로 감싸서 빌드 시 정적 생성 가능하도록 함
 */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/posts'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error')
      ? '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
      : null
  )

  // 자동 리다이렉트 제거: 사용자가 명시적으로 로그인 버튼을 클릭할 때만 이동
  // useEffect를 사용한 자동 리다이렉트는 제거됨

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signInWithGoogle({ redirectTo })

      if (!result.success) {
        setError(
          result.error?.message ||
            '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
        )
        setIsLoading(false)
      } else if (result.isMock) {
        // Mock 모드: 로그인 성공 후 명시적으로 리다이렉트
        // 사용자가 버튼을 클릭했을 때만 이동
        router.push(redirectTo)
      }
      // 실제 OAuth 성공 시 OAuth 리다이렉트가 발생하므로 여기서는 아무것도 하지 않음
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-card-foreground">
            시작하기
          </h2>
          <p className="text-sm text-muted-foreground">
            {isMockMode()
              ? 'Mock 모드: 로그인 버튼을 클릭하면 테스트 모드로 진행됩니다'
              : 'Google 계정으로 간편하게 로그인하세요'}
          </p>
          {isMockMode() && (
            <p className="text-xs text-muted-foreground/70">
              (Supabase 환경 변수가 설정되지 않아 Mock 모드로 실행 중)
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleLogin}
          variant="outline"
          size="lg"
          className="w-full gap-3 font-medium bg-transparent"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              로그인 중...
            </>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              Google로 시작하기
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * LoginPage: Suspense boundary로 LoginForm을 감싸서 빌드 시 정적 생성 가능하도록 함
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo and brand */}
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              SSU-Note
            </h1>
            <p className="text-balance text-muted-foreground">
              AI가 도와주는 스마트한 학습 정리
            </p>
          </div>
        </div>

        {/* Login card with Suspense */}
        <Suspense
          fallback={
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-medium text-card-foreground">
                    시작하기
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    로딩 중...
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer text */}
        <p className="text-xs text-muted-foreground">
          로그인하면 서비스 이용약관에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </main>
  )
}
