"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import PostList from "@/components/posts/PostList"
import { usePosts } from "@/domain/posts/hooks/usePosts"
import { useAppContext } from "@/contexts/AppContext"
import { useDebounce } from "@/lib/hooks/useDebounce"

/**
 * /posts 페이지: 로그인 후 진입하는 학습 노트 메인 홈 화면
 * 
 * 레이아웃 구조:
 * - Header (app/layout.tsx에서 제공)
 * - 페이지 헤더 (제목, 설명, CTA 버튼)
 * - 검색 및 필터 UI
 * - 학습 노트 카드 리스트 또는 Empty State
 * - Footer (app/layout.tsx에서 제공)
 */
export default function PostsPage() {
  const { subjects, courses } = useAppContext()
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  
  // 디바운스된 검색어
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  // Posts 데이터 페칭 (페이지네이션 및 필터링 옵션 포함)
  const { posts, isLoading, error, pagination } = usePosts({
    paginated: true,
    page: currentPage,
    pageSize,
    searchQuery: debouncedSearchQuery.trim() || undefined,
    subjectId: selectedSubjectId || undefined,
    courseId: selectedCourseId || undefined,
  })
  
  // 선택된 Subject에 해당하는 Courses 필터링
  const filteredCourses = selectedSubjectId
    ? courses.filter((course) => course.subjectId === selectedSubjectId)
    : courses
  
  // 필터 초기화
  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedSubjectId("")
    setSelectedCourseId("")
    setCurrentPage(1) // 필터 초기화 시 첫 페이지로 이동
  }
  
  const hasActiveFilters = debouncedSearchQuery.trim().length > 0 || selectedSubjectId || selectedCourseId
  
  // 필터 변경 시 첫 페이지로 이동
  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value)
    setSelectedCourseId("")
    setCurrentPage(1)
  }
  
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value)
    setCurrentPage(1)
  }
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {/* 페이지 헤더: Header 바로 아래에 위치 */}
      <div className="border-b border-border py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">내 학습 노트</h1>
            <p className="text-sm text-muted-foreground">
              학습 내용을 정리하고 AI의 도움을 받아보세요
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/posts/new" className="gap-2">
              <Plus className="h-4 w-4" />
              새 학습 글 작성
            </Link>
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 UI */}
      <div className="border-b border-border py-4">
        <div className="space-y-3">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="제목 또는 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => handleSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 필터 드롭다운 */}
          <div className="flex flex-wrap gap-2">
            {/* Subject 필터 */}
            {subjects.length > 0 && (
              <Select
                value={selectedSubjectId}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="과목 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체 과목</SelectItem>
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
            )}

            {/* Course 필터 */}
            {filteredCourses.length > 0 && (
              <Select
                value={selectedCourseId}
                onValueChange={handleCourseChange}
                disabled={!selectedSubjectId}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={selectedSubjectId ? "코스 필터" : "먼저 과목을 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체 코스</SelectItem>
                  {filteredCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* 필터 초기화 버튼 */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-1.5" />
                필터 초기화
              </Button>
            )}
          </div>

          {/* 검색 결과 개수 표시 */}
          {hasActiveFilters && pagination && (
            <div className="text-sm text-muted-foreground">
              총 {pagination.total}개의 결과 중 {posts.length}개를 표시합니다
            </div>
          )}
        </div>
      </div>

      {/* 학습 노트 리스트: 헤더 바로 아래에 위치 */}
      <div className="py-6">
        <PostList
          posts={posts}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
        />
      </div>
    </div>
  )
}
