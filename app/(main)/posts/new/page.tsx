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
  const { user } = useAuthContext()
  const { addPost, refetch } = usePostsContext()
  const { subjects, courses } = useAppContext()
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [subjectId, setSubjectId] = useState<string>("")
  const [courseId, setCourseId] = useState<string>("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [processWithAI, setProcessWithAI] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

      const { data: post, error: createError } = await createPost(
        user.id,
        postData,
        processWithAI
      )

      if (createError) {
        setError(createError.message || "학습 노트 생성에 실패했습니다.")
        setIsSubmitting(false)
        return
      }

      if (!post) {
        setError("학습 노트 생성에 실패했습니다.")
        return
      }

      // 낙관적 업데이트: 즉시 Context에 새 Post 추가
      const optimisticResult = await addPost(post)
      
      if (!optimisticResult.success) {
        // 낙관적 업데이트 실패 (롤백은 addPost 내부에서 처리됨)
        setError(optimisticResult.error?.message || "학습 노트 생성에 실패했습니다.")
        return
      }

      // API 호출이 이미 성공했으므로 낙관적 업데이트도 성공
      // 상세 페이지로 리다이렉트 (목록은 낙관적 업데이트로 이미 반영됨)
      router.push(`/posts/${post.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
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
            <div className="space-y-2">
              <Label>AI 처리 옵션</Label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-4">
                <input
                  type="checkbox"
                  id="ai-process"
                  className="h-4 w-4 rounded border-input"
                  checked={processWithAI}
                  onChange={(e) => setProcessWithAI(e.target.checked)}
                  disabled={isSubmitting}
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
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
              <Button variant="outline" asChild disabled={isSubmitting}>
                <Link href="/posts">취소</Link>
              </Button>
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    처리 중...
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
