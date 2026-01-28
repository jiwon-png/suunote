"use client"

import { useState } from "react"
import { ChevronDown, FileText, Image, Mic, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"

/**
 * FileAttachmentSection: 파일 첨부 영역 컴포넌트
 * 
 * 접혀있는 탭 UI로 표시되며, 클릭 시 하위 옵션들이 펼쳐집니다.
 * - PDF 추가
 * - 이미지 추가
 * - 음성 추가
 * - 영상 추가
 */
export default function FileAttachmentSection() {
  const [isOpen, setIsOpen] = useState(false)

  const fileTypes = [
    { id: "pdf", label: "PDF 추가", icon: FileText, accept: ".pdf" },
    { id: "image", label: "이미지 추가", icon: Image, accept: "image/*" },
    { id: "audio", label: "음성 추가", icon: Mic, accept: "audio/*" },
    { id: "video", label: "영상 추가", icon: Video, accept: "video/*" },
  ]

  const handleFileSelect = (accept: string) => {
    // 실제 업로드 로직은 추후 구현
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.multiple = true
    input.onchange = () => {
      // 파일 선택 처리 (추후 구현)
      console.log("Selected files:", input.files)
    }
    input.click()
  }

  return (
    <div className="space-y-2">
      <Label>파일 첨부</Label>
      
      {/* 접혀있는 탭 UI */}
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              파일 첨부 (PDF, 이미지, 음성, 영상)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* 펼쳐지는 옵션 영역 */}
        {isOpen && (
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {fileTypes.map((fileType) => {
                const Icon = fileType.icon
                return (
                  <Button
                    key={fileType.id}
                    type="button"
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-3"
                    onClick={() => handleFileSelect(fileType.accept)}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs">{fileType.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
