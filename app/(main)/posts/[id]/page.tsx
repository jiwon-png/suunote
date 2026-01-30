"use client"

import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ListChecks,
  Compass,
  RotateCcw,
  Loader2,
  Edit,
  Save,
  X,
  FileText,
  Image,
  Mic,
  Video,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePost } from "@/domain/posts/hooks/usePost"
import { deletePost, updatePost } from "@/domain/posts/services/postService"
import { useAuthContext } from "@/contexts/AuthContext"
import { usePostsContext } from "@/contexts/PostsContext"
import { PostDetailSkeleton } from "@/components/common/SkeletonLoader"
import ErrorDisplay from "@/components/common/ErrorDisplay"
import { validatePostTitle, validatePostContent } from "@/lib/utils/validation"
import { formatFileSize } from "@/lib/utils/file"

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 15+에서 params는 Promise이므로 React.use()로 unwrap
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthContext()
  const { refetch: refetchPosts, updatePost: updatePostInContext, deletePost: deletePostInContext } = usePostsContext()
  const { post, isLoading, error, refetch } = usePost(id)
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // AI 처리 중일 때 주기적으로 refetch (polling)
  useEffect(() => {
    if (!post?.id || post.aiResult) {
      // post가 없거나 aiResult가 이미 있으면 polling 중지
      return
    }

    // AI 처리 중이면 3초마다 refetch하여 AI 결과 확인
    const intervalId = setInterval(() => {
      // refetch를 직접 호출 (의존성 배열에서 제외하여 무한 루프 방지)
      refetch().catch(() => {
        // 에러는 무시 (이미 error state로 처리됨)
      })
    }, 3000) // 3초마다 refetch

    // 최대 60초까지만 polling
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
    }, 60000)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
    // refetch는 의존성에서 제외 (무한 루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, post?.aiResult])

  // 수정 모드 진입
  const handleEdit = () => {
    if (post) {
      setEditTitle(post.title)
      setEditContent(post.content)
      setIsEditing(true)
      setUpdateError(null)
    }
  }

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle("")
    setEditContent("")
    setUpdateError(null)
  }

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!post || !user) return

    // 유효성 검증
    const titleValidation = validatePostTitle(editTitle)
    const contentValidation = validatePostContent(editContent)

    if (!titleValidation.valid) {
      setUpdateError(titleValidation.error || "제목을 입력해주세요.")
      return
    }

    if (!contentValidation.valid) {
      setUpdateError(contentValidation.error || "내용을 입력해주세요.")
      return
    }

    setIsUpdating(true)
    setUpdateError(null)

    // 낙관적 업데이트: 즉시 Context에 업데이트 반영
    const optimisticResult = await updatePostInContext(post.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    })

    try {
      const { data: updatedPost, error: updateError } = await updatePost(post.id, user.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      })

      if (updateError) {
        // API 호출 실패: 롤백
        if (optimisticResult.rollback) {
          optimisticResult.rollback()
        }
        setUpdateError(updateError.message || "수정에 실패했습니다.")
        return
      }

      if (!updatedPost) {
        // API 호출 실패: 롤백
        if (optimisticResult.rollback) {
          optimisticResult.rollback()
        }
        setUpdateError("수정에 실패했습니다.")
        return
      }

      // 수정 모드 종료
      setIsEditing(false)
      
      // 데이터 새로고침 (낙관적 업데이트로 이미 반영되었지만 서버 데이터로 동기화)
      await refetch()
      await refetchPosts()
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!post || !user) return

    setIsDeleting(true)
    
    // 낙관적 업데이트: 즉시 Context에서 삭제 반영
    const optimisticResult = await deletePostInContext(post.id)
    
    try {
      const { error: deleteError } = await deletePost(post.id, user.id)

      if (deleteError) {
        // API 호출 실패: 롤백
        if (optimisticResult.rollback) {
          optimisticResult.rollback()
        }
        setDeleteError(deleteError.message || "삭제에 실패했습니다.")
        setIsDeleting(false)
        return
      }

      // 목록 페이지로 리다이렉트 (낙관적 업데이트로 이미 목록에서 제거됨)
      router.push("/posts")
    } catch (err) {
      // 예외 발생: 롤백
      if (optimisticResult.rollback) {
        optimisticResult.rollback()
      }
      setDeleteError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  // 로딩 상태 - 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4">
        <PostDetailSkeleton />
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4">
        <ErrorDisplay error={error} showHomeButton={false} />
      </div>
    )
  }

  // Post가 없는 경우 (404)
  if (!post) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="py-12 text-center">
          <h2 className="text-xl font-semibold mb-2">학습 노트를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            요청하신 학습 노트가 존재하지 않거나 삭제되었습니다.
          </p>
          <Button asChild>
            <Link href="/posts">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  const displayPost = post

  // 원본 학습 내용은 접기/펼치기로 전체 내용을 표시

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 상단 헤더 */}
      <div className="border-b border-border py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold"
                  disabled={isUpdating}
                />
              ) : (
                <h1 className="text-xl font-bold leading-tight text-foreground">
                  {displayPost.title}
                </h1>
              )}
            </div>
            <div className="pl-10 text-sm text-muted-foreground">
              <span>{formatDateTime(displayPost.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="h-8 text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="h-8 text-xs"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      저장
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  수정
                </Button>
                <Button variant="outline" size="sm" disabled className="h-8 text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  복습하기
                </Button>
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      삭제
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>학습 노트 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 학습 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        삭제 중...
                      </>
                    ) : (
                      '삭제'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="py-5 space-y-5">
        {/* 수정 에러 메시지 */}
        {updateError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {updateError}
          </div>
        )}

        {/* 삭제 에러 메시지 */}
        {deleteError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {deleteError}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteError(null)}
              className="ml-2 h-6 text-xs"
            >
              닫기
            </Button>
          </div>
        )}

        {/* 원본 학습 내용 */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">원본 학습 내용</CardTitle>
              {!isEditing && displayPost.content.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="h-7 text-xs"
                >
                  {isContentExpanded ? (
                    <>
                      접기
                      <ChevronUp className="h-3.5 w-3.5 ml-1" />
                    </>
                  ) : (
                    <>
                      더보기
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-content">학습 내용</Label>
                  <Textarea
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[300px] resize-none"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                {displayPost.content}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 첨부 파일 섹션 */}
        {displayPost.attachments && displayPost.attachments.length > 0 && (
          <Card>
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="text-base font-semibold">첨부 파일</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                {displayPost.attachments.map((attachment) => {
                  const fileTypeIcons = {
                    pdf: FileText,
                    image: Image,
                    audio: Mic,
                    video: Video,
                  }
                  const fileTypeColors = {
                    pdf: '#EF4444',
                    image: '#3B82F6',
                    audio: '#10B981',
                    video: '#8B5CF6',
                  }
                  const Icon = fileTypeIcons[attachment.fileType]
                  const color = fileTypeColors[attachment.fileType]

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {attachment.fileName}
                          </p>
                          {attachment.fileSize && (
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-shrink-0"
                      >
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={attachment.fileName}
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          다운로드
                        </a>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI 결과 섹션 */}
        {/* aiResult가 있으면 표시 (aiProcessed 체크 완화) */}
        {displayPost.aiResult && (() => {
          const aiResult = displayPost.aiResult!
          return (
          <div className="space-y-5">
            {/* AI Provider 정보 (fallback 발생 시 표시) */}
            {aiResult.provider && (
              <div className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-xs text-muted-foreground">
                <span className="font-medium">AI 엔진:</span>{' '}
                {aiResult.provider === 'google' ? 'Google Gemini' : 'Groq Llama'}
                {aiResult.model && ` (${aiResult.model})`}
              </div>
            )}

            {/* AI 요약 */}
            {aiResult.summary && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">요약</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {aiResult.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 핵심 포인트 */}
            {aiResult.keyPoints && aiResult.keyPoints.length > 0 && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ListChecks className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">핵심 포인트</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <ol className="space-y-2.5">
                    {aiResult.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-card-foreground leading-relaxed flex-1">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* 학습 방향 제안 */}
            {aiResult.studyDirection && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Compass className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">학습 방향 제안</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {aiResult.studyDirection}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 퀴즈 섹션 */}
            {aiResult.quiz && aiResult.quiz.length > 0 && (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ListChecks className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">복습 퀴즈</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-4">
                    {aiResult.quiz.map((quizItem, index) => (
                      <div key={index} className="space-y-2 rounded-lg border border-border bg-card p-3">
                        <p className="text-sm font-medium text-card-foreground">
                          {index + 1}. {quizItem.question}
                        </p>
                        <div className="space-y-1.5 pl-4">
                          {quizItem.choices.map((choice, choiceIndex) => (
                            <div
                              key={choiceIndex}
                              className={`text-xs rounded px-2 py-1 ${
                                choiceIndex === quizItem.answerIndex
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {String.fromCharCode(65 + choiceIndex)}. {choice}
                              {choiceIndex === quizItem.answerIndex && (
                                <span className="ml-2 text-xs">✓ 정답</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {quizItem.explanation && (
                          <p className="text-xs text-muted-foreground pl-4 pt-1 border-t border-border">
                            💡 {quizItem.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 타임라인 섹션 */}
            {aiResult.timeline && aiResult.timeline.length > 0 && (() => {
              const timeline = aiResult.timeline.sort((a, b) => a.order - b.order)
              return (
              <Card>
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-semibold">학습 타임라인</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-3">
                    {timeline.map((timelineItem, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {timelineItem.order}
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="h-full w-0.5 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium text-card-foreground">
                            {timelineItem.title}
                          </p>
                          {timelineItem.detail && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {timelineItem.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              )
            })()}
          </div>
          )
        })()}

        {/* AI 처리 중 상태 */}
        {!displayPost.aiProcessed && (
          <Card className="border-dashed">
            <CardContent className="py-6 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                AI 처리가 진행 중입니다. 잠시만 기다려주세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-border py-5">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/posts" className="flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            목록으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  )
}
