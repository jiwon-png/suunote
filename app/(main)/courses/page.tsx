"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { GraduationCap, BookOpen, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useAppContext } from "@/contexts/AppContext"
import { usePostsContext } from "@/contexts/PostsContext"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const { courses, subjects, getSubject } = useAppContext()
  const { posts } = usePostsContext()

  // URL 쿼리 파라미터에서 과목 ID 가져오기
  const subjectId = searchParams.get('subject')

  // 과목별 필터링
  const filteredCourses = subjectId
    ? courses.filter((c) => c.subjectId === subjectId)
    : courses

  // 생성일 기준 정렬 (최신순)
  const sortedCourses = [...filteredCourses].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 페이지 헤더 */}
      <div className="border-b border-border py-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">코스</h1>
          <p className="text-sm text-muted-foreground">
            학습 노트를 코스 단위로 묶어 개념 맵과 타임라인을 확인하세요
          </p>
        </div>
      </div>

      {/* 코스 리스트 */}
      <div className="py-6">
        {sortedCourses.length === 0 ? (
          <Card className="border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">
              아직 생성된 코스가 없습니다
            </h3>
            <p className="text-sm text-muted-foreground">
              {subjectId
                ? "선택한 과목에 해당하는 코스가 없습니다"
                : "학습 노트를 만들면 자동으로 코스에 연결됩니다"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedCourses.map((course) => {
              const subject = course.subjectId ? getSubject(course.subjectId) : undefined
              const coursePosts = posts.filter((p) => p.courseId === course.id)

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="block"
                >
                  <Card className="group p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {subject && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: subject.color }}
                            >
                              {subject.name}
                            </span>
                          )}
                          <h2 className="text-base font-semibold text-card-foreground group-hover:text-primary">
                            {course.title}
                          </h2>
                        </div>

                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            학습 노트 {coursePosts.length}개
                          </span>
                          <span>{formatDate(course.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
