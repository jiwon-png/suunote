"use client"

import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import FileAttachmentSection from "@/components/posts/FileAttachmentSection"

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
          <form className="space-y-6">
            {/* 제목 입력 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="학습 노트 제목을 입력하세요"
                className="w-full"
              />
            </div>

            {/* 학습 내용 입력 */}
            <div className="space-y-2">
              <Label htmlFor="content">학습 내용</Label>
              <Textarea
                id="content"
                placeholder="학습한 내용을 정리해주세요..."
                className="min-h-[300px] w-full resize-none"
              />
            </div>

            {/* 파일 첨부 */}
            <FileAttachmentSection />

            {/* AI 처리 옵션 */}
            <div className="space-y-2">
              <Label>AI 처리 옵션</Label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-4">
                <input
                  type="checkbox"
                  id="ai-process"
                  className="h-4 w-4 rounded border-input"
                  defaultChecked
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
              <Button variant="outline" asChild>
                <Link href="/posts">취소</Link>
              </Button>
              <Button type="submit" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI 요약 생성
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
