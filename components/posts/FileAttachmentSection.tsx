"use client"

import { useState, useRef } from "react"
import { ChevronDown, FileText, Image, Mic, Video, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"
import { validateFile } from "@/lib/utils/file"
import { formatFileSize } from "@/lib/utils/file"

interface FileAttachmentSectionProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

/**
 * FileAttachmentSection: 파일 첨부 영역 컴포넌트
 * 
 * 접혀있는 탭 UI로 표시되며, 클릭 시 하위 옵션들이 펼쳐집니다.
 * - PDF 추가
 * - 이미지 추가
 * - 음성 추가
 * - 영상 추가
 */
export default function FileAttachmentSection({
  files,
  onFilesChange,
  disabled = false,
}: FileAttachmentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fileTypes = [
    { id: "pdf", label: "PDF 추가", icon: FileText, accept: ".pdf", allowedTypes: ['pdf'] as const },
    { id: "image", label: "이미지 추가", icon: Image, accept: "image/*", allowedTypes: ['image'] as const },
    { id: "audio", label: "음성 추가", icon: Mic, accept: "audio/*", allowedTypes: ['audio'] as const },
    { id: "video", label: "영상 추가", icon: Video, accept: "video/*", allowedTypes: ['video'] as const },
  ]

  const handleFileSelect = (accept: string, allowedTypes: readonly ('pdf' | 'image' | 'audio' | 'video')[]) => {
    if (disabled) return

    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.multiple = true
    input.onchange = () => {
      if (!input.files) return

      const newFiles: File[] = []
      const newErrors: Record<string, string> = {}

      Array.from(input.files).forEach((file) => {
        const validation = validateFile(file, allowedTypes, 50) // 최대 50MB

        if (!validation.valid) {
          newErrors[file.name] = validation.error || '파일 검증 실패'
          return
        }

        // 중복 파일 체크
        if (files.some((f) => f.name === file.name && f.size === file.size)) {
          newErrors[file.name] = '이미 추가된 파일입니다.'
          return
        }

        newFiles.push(file)
      })

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }))
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles])
      }
    }
    input.click()
  }

  const handleRemoveFile = (index: number) => {
    if (disabled) return
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
    
    // 해당 파일의 에러도 제거
    const fileName = files[index].name
    if (errors[fileName]) {
      const newErrors = { ...errors }
      delete newErrors[fileName]
      setErrors(newErrors)
    }
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {fileTypes.map((fileType) => {
                  const Icon = fileType.icon
                  return (
                    <Button
                      key={fileType.id}
                      type="button"
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-auto py-3"
                      onClick={() => handleFileSelect(fileType.accept, fileType.allowedTypes)}
                      disabled={disabled}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs">{fileType.label}</span>
                    </Button>
                  )
                })}
              </div>

              {/* 선택된 파일 목록 */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">선택된 파일 ({files.length})</div>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </div>
                          {errors[file.name] && (
                            <div className="text-xs text-destructive mt-1">
                              {errors[file.name]}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => handleRemoveFile(index)}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
