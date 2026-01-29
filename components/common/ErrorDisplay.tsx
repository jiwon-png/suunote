'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/lib/constants/routes'
import { AlertCircle, Home, WifiOff, ShieldAlert, KeyRound } from 'lucide-react'
import { getErrorMessage, getErrorType } from '@/lib/utils/errors'

interface ErrorDisplayProps {
  error?: Error | null
  title?: string
  message?: string
  showHomeButton?: boolean
  onReset?: () => void
}

export default function ErrorDisplay({
  error,
  title,
  message,
  showHomeButton = true,
  onReset,
}: ErrorDisplayProps) {
  // error가 제공된 경우 메시지 추출
  const errorMessage = error ? getErrorMessage(error) : message || '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  const errorType = error ? getErrorType(error) : 'unknown'
  
  // 에러 타입에 따른 제목과 아이콘 설정
  const getErrorConfig = () => {
    switch (errorType) {
      case 'rls':
        return {
          title: title || '권한 오류',
          icon: ShieldAlert,
          description: '이 작업을 수행할 권한이 없습니다.',
        }
      case 'network':
        return {
          title: title || '네트워크 오류',
          icon: WifiOff,
          description: '인터넷 연결을 확인해주세요.',
        }
      case 'auth':
        return {
          title: title || '인증 오류',
          icon: KeyRound,
          description: '로그인이 필요합니다.',
        }
      default:
        return {
          title: title || '오류가 발생했습니다',
          icon: AlertCircle,
          description: errorMessage,
        }
    }
  }

  const config = getErrorConfig()
  const Icon = config.icon
  const router = useRouter()

  const handleGoHome = () => {
    router.push(ROUTES.POSTS)
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Icon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
          <CardDescription className="text-base">{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>문제가 계속되면 다음을 시도해보세요:</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>페이지를 새로고침하세요</li>
              <li>잠시 후 다시 시도하세요</li>
              <li>메인 화면으로 돌아가세요</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {showHomeButton && (
            <Button onClick={handleGoHome} className="w-full" size="lg">
              <Home className="mr-2 h-4 w-4" />
              메인 화면으로 돌아가기
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
            size="lg"
          >
            다시 시도
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
