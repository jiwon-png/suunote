"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Network, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from "@/contexts/AppContext"
import { usePostsContext } from "@/contexts/PostsContext"
import TimelineTab from "@/domain/courses/components/TimelineTab"
import ConceptMapTab from "@/domain/courses/components/ConceptMapTab"
import ReviewTab from "@/domain/courses/components/ReviewTab"

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { courses, getSubject } = useAppContext()
  const [activeTab, setActiveTab] = useState("timeline")

  // params.id가 배열일 수 있으므로 처리
  const courseId = Array.isArray(params.id) ? params.id[0] : (params.id as string)
  
  // 코스 찾기
  const course = courses.find((c) => c.id === courseId)

  if (!courseId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            코스 ID가 제공되지 않았습니다
          </h2>
          <Button asChild>
            <Link href="/courses">코스 목록으로</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            코스를 찾을 수 없습니다
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            요청하신 코스가 존재하지 않거나 삭제되었습니다.
          </p>
          <div className="mb-4 text-xs text-muted-foreground">
            <p>요청한 코스 ID: {courseId}</p>
            <p>사용 가능한 코스: {courses.length}개</p>
          </div>
          <Button asChild>
            <Link href="/courses">코스 목록으로</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subject = course.subjectId ? getSubject(course.subjectId) : undefined

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 상단 헤더 */}
      <div className="border-b border-border py-5">
        <div className="flex items-start gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {subject && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: subject.color }}
                >
                  {subject.name}
                </span>
              )}
              <h1 className="text-xl font-bold text-foreground">
                {course.title}
              </h1>
            </div>
            {course.description && (
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              타임라인
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Network className="h-4 w-4" />
              개념 맵
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2">
              <BookOpen className="h-4 w-4" />
              복습
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <TimelineTab courseId={course.id} />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <ConceptMapTab courseId={course.id} />
          </TabsContent>

          <TabsContent value="review" className="mt-6">
            <ReviewTab courseId={course.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
