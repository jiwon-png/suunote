"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import FileAttachmentSection from "@/components/posts/FileAttachmentSection"
import { useAuthContext } from "@/contexts/AuthContext"
import { usePostsContext } from "@/contexts/PostsContext"
import { useAppContext } from "@/contexts/AppContext"
import { createPost } from "@/domain/posts/services/postService"
import { validatePostTitle, validatePostContent } from "@/lib/utils/validation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CreatePostData } from "@/domain/posts/types"

/**
 * /posts/new 페이지: 새 학습 글 작성 전용 페이지
 * 
 * 포함 요소:
 * - 제목 입력
 * - 학습 내용 입력
 * - 파일 첨부
 * - AI 처리 옵션 선택
 * - 하단 액션 버튼 (목록으로 돌아가기, AI 요약 생성)
 */
export default function NewPostPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthContext()
  const { addPost, refetch } = usePostsContext()
  const { subjects, courses } = useAppContext()
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState<string>("")
  const [courseId, setCourseId] = useState<string>("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [processWithAI, setProcessWithAI] = useState(true)
  const [providerMode, setProviderMode] = useState<'auto' | 'google' | 'groq'>('auto')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string
    content?: string
  }>({})

  // 선택된 Subject에 해당하는 Courses 필터링
  const filteredCourses = subjectId
    ? courses.filter((course) => course.subjectId === subjectId)
    : courses

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // 유효성 검증
    const titleValidation = validatePostTitle(title)
    const contentValidation = validatePostContent(content)

    if (!titleValidation.valid) {
      setFieldErrors((prev) => ({ ...prev, title: titleValidation.error }))
      return
    }

    if (!contentValidation.valid) {
      setFieldErrors((prev) => ({ ...prev, content: contentValidation.error }))
      return
    }

    // 인증 상태 로딩 중일 때는 대기
    if (authLoading) {
      return
    }

    // 인증 로딩 완료 후 user가 없으면 에러 표시
    if (!user) {
      setError("로그인이 필요합니다.")
      return
    }

    setIsSubmitting(true)

    try {
      const postData: CreatePostData = {
        title: title.trim(),
        content: content.trim(),
        subjectId: subjectId || undefined,
        courseId: courseId || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      // Post 생성 (AI 처리 없이)
      const { data: post, error: createError } = await createPost(
        user.id,
        postData,
        false // AI 처리는 별도 API로
      )

      if (createError) {
        setError(createError.message || "학습 노트 생성에 실패했습니다.")
        setIsSubmitting(false)
        return
      }

      if (!post) {
        setError("학습 노트 생성에 실패했습니다.")
        setIsSubmitting(false)
        return
      }

      // Post ID 확인 및 로깅
      if (!post.id) {
        console.error('[New Post] Post ID가 없습니다:', post)
        setError("학습 노트 생성에 실패했습니다. (ID 없음)")
        setIsSubmitting(false)
        return
      }

      console.log('[New Post] Post 생성 완료:', { postId: post.id, title: post.title })

      // 낙관적 업데이트: 즉시 Context에 새 Post 추가
      const optimisticResult = await addPost(post)
      
      if (!optimisticResult.success) {
        // 낙관적 업데이트 실패 (롤백은 addPost 내부에서 처리됨)
        setError(optimisticResult.error?.message || "학습 노트 생성에 실패했습니다.")
        setIsSubmitting(false)
        return
      }

      // Post 생성 후 실제로 조회 가능할 때까지 확인
      // DB 트랜잭션이 완료되고 RLS 정책이 적용되기까지 시간이 필요할 수 있음
      let retryCount = 0
      const maxRetries = 5
      let postVerified = false

      while (retryCount < maxRetries && !postVerified) {
        try {
          // Post가 실제로 조회 가능한지 확인 (getPost 서비스 함수 사용)
          const { getPost } = await import('@/domain/posts/services/postService')
          const { data: verifiedPost, error: verifyError } = await getPost(post.id, user.id)
          
          if (!verifyError && verifiedPost) {
            console.log('[New Post] Post 검증 성공:', { postId: post.id, retryCount })
            postVerified = true
            break
          } else {
            console.warn('[New Post] Post 조회 실패, 재시도...', { 
              postId: post.id, 
              retryCount, 
              error: verifyError?.message 
            })
            retryCount++
            // 지수 백오프: 100ms, 200ms, 400ms, 800ms, 1600ms
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)))
          }
        } catch (verifyError) {
          console.error('[New Post] Post 검증 중 예외:', verifyError)
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)))
        }
      }

      if (!postVerified) {
        console.error('[New Post] Post 검증 실패, 하지만 리다이렉트 진행:', { postId: post.id })
        // 검증 실패해도 리다이렉트는 진행 (Post는 생성되었을 가능성이 높음)
      }

      // 상세 페이지로 리다이렉트
      router.push(`/posts/${post.id}`)

      // AI 처리 옵션이 활성화된 경우 백그라운드에서 AI 파이프라인 실행
      if (processWithAI) {
        // 백그라운드에서 실행 (await 없이)
        fetch('/api/ai/pipeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            providerMode,
            category: 'pipeline',
            content: content.trim(),
          }),
        })
          .then(async (aiResponse) => {
            const aiResult = await aiResponse.json()

            if (!aiResponse.ok) {
              // AI 처리 실패는 로깅만 (사용자는 이미 상세 페이지에 있음)
              console.error('[New Post] AI 처리 실패:', {
                error: aiResult.error,
                code: aiResult.code,
                postId: post.id,
              })
              return
            }

            // AI 처리 성공
            console.log('[New Post] AI 처리 완료:', {
              providerUsed: aiResult.providerUsed,
              model: aiResult.model,
              postId: post.id,
            })

            // DB 저장 실패 시 로깅
            if (aiResult.dbSaveError) {
              console.warn('[New Post] DB 저장 실패:', aiResult.dbSaveError)
            }

            // 상세 페이지가 이미 열려있으므로 자동으로 새로고침되도록
            // window.location.reload()를 사용하여 AI 결과를 즉시 반영
            // 또는 사용자가 수동으로 새로고침할 수 있도록 안내
            if (typeof window !== 'undefined') {
              // 현재 페이지가 해당 post의 상세 페이지인지 확인
              const currentPath = window.location.pathname
              if (currentPath === `/posts/${post.id}`) {
                // 약간의 지연 후 새로고침 (DB 저장 완료 대기)
                setTimeout(() => {
                  window.location.reload()
                }, 1000)
              }
            }
          })
          .catch((aiError) => {
            // AI 처리 중 예외 발생 시 로깅만
            console.error('[New Post] AI 처리 중 예외:', aiError)
          })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 인증 로딩 중일 때는 로딩 UI 표시
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    )
  }

  // 인증 로딩 완료 후 user가 없으면 에러 표시
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="border-b border-border py-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link href="/posts">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">새 학습 글 작성</h1>
            </div>
          </div>
        </div>
        <div className="py-6">
          <Card className="p-6">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-destructive font-medium">로그인이 필요합니다.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                학습 글을 작성하려면 먼저 로그인해주세요.
              </p>
              <Button asChild className="mt-4">
                <Link href="/login">로그인하기</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 페이지 헤더 */}
      <div className="border-b border-border py-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">새 학습 글 작성</h1>
            <p className="text-sm text-muted-foreground">
              학습 내용을 정리하고 AI의 도움을 받아보세요
            </p>
          </div>
        </div>
      </div>

      {/* 작성 폼 */}
      <div className="py-6">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* 제목 입력 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="학습 노트 제목을 입력하세요"
                className={`w-full ${fieldErrors.title ? 'border-destructive' : ''}`}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: undefined }))
                  }
                }}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.title && (
                <p className="text-sm text-destructive">{fieldErrors.title}</p>
              )}
            </div>

            {/* 과목 선택 */}
            {subjects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subject">과목 (선택사항)</Label>
                <Select
                  value={subjectId}
                  onValueChange={(value) => {
                    setSubjectId(value)
                    // Subject 변경 시 Course 초기화
                    setCourseId("")
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="subject" className="w-full">
                    <SelectValue placeholder="과목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">과목 없음</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 코스 선택 */}
            {filteredCourses.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="course">코스 (선택사항)</Label>
                <Select
                  value={courseId}
                  onValueChange={setCourseId}
                  disabled={isSubmitting || !subjectId}
                >
                  <SelectTrigger id="course" className="w-full">
                    <SelectValue placeholder={subjectId ? "코스를 선택하세요" : "먼저 과목을 선택하세요"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">코스 없음</SelectItem>
                    {filteredCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex items-center gap-2">
                          {course.subjectColor && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: course.subjectColor }}
                            />
                          )}
                          <span>{course.title}</span>
                          {course.description && (
                            <span className="text-xs text-muted-foreground">
                              - {course.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 학습 내용 입력 */}
            <div className="space-y-2">
              <Label htmlFor="content">학습 내용</Label>
              <Textarea
                id="content"
                placeholder="학습한 내용을 정리해주세요..."
                className={`min-h-[300px] w-full resize-none ${fieldErrors.content ? 'border-destructive' : ''}`}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (fieldErrors.content) {
                    setFieldErrors((prev) => ({ ...prev, content: undefined }))
                  }
                }}
                disabled={isSubmitting}
                required
              />
              {fieldErrors.content && (
                <p className="text-sm text-destructive">{fieldErrors.content}</p>
              )}
            </div>

            {/* 파일 첨부 */}
            <FileAttachmentSection
              files={attachments}
              onFilesChange={setAttachments}
              disabled={isSubmitting}
            />

            {/* AI 처리 옵션 */}
            <div className="space-y-3">
              <Label>AI 처리 옵션</Label>
              <div className="space-y-3 rounded-lg border border-border bg-secondary/50 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ai-process"
                    className="h-4 w-4 rounded border-input"
                    checked={processWithAI}
                    onChange={(e) => setProcessWithAI(e.target.checked)}
                    disabled={isSubmitting || isProcessingAI}
                  />
                  <Label htmlFor="ai-process" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium">AI 요약 생성</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      학습 내용을 분석하여 핵심 요약을 자동으로 생성합니다
                    </p>
                  </Label>
                </div>
                
                {processWithAI && (
                  <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                    <Label htmlFor="provider-mode" className="text-xs text-muted-foreground">
                      AI 엔진 선택
                    </Label>
                    <Select
                      value={providerMode}
                      onValueChange={(value: 'auto' | 'google' | 'groq') => setProviderMode(value)}
                      disabled={isSubmitting || isProcessingAI}
                    >
                      <SelectTrigger id="provider-mode" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">auto (권장)</SelectItem>
                        <SelectItem value="google">google (gemini-2.5-flash)</SelectItem>
                        <SelectItem value="groq">groq (llama-3.3-70b-versatile)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {providerMode === 'auto' && 'Google을 기본으로 사용하며, 할당량 초과 시 Groq로 자동 전환됩니다.'}
                      {providerMode === 'google' && 'Google Gemini 모델을 사용합니다.'}
                      {providerMode === 'groq' && 'Groq Llama 모델을 사용합니다.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
              <Button variant="outline" asChild disabled={isSubmitting}>
                <Link href="/posts">취소</Link>
              </Button>
              <Button type="submit" className="gap-2" disabled={isSubmitting || isProcessingAI}>
                {isSubmitting || isProcessingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isProcessingAI ? "AI 처리 중..." : "처리 중..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {processWithAI ? "AI 요약 생성" : "저장"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
