export function getFileType(fileName: string): 'pdf' | 'image' | 'audio' | 'video' | 'other' {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension) return 'other'

  const pdfExtensions = ['pdf']
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a']
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov']

  if (pdfExtensions.includes(extension)) return 'pdf'
  if (imageExtensions.includes(extension)) return 'image'
  if (audioExtensions.includes(extension)) return 'audio'
  if (videoExtensions.includes(extension)) return 'video'

  return 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 파일 타입 검증
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly ('pdf' | 'image' | 'audio' | 'video')[]
): { valid: boolean; error?: string } {
  const fileType = getFileType(file.name)

  if (fileType === 'other') {
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' }
  }

  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `허용된 파일 형식: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(
  file: File,
  maxSizeInMB: number = 50
): { valid: boolean; error?: string } {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024

  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `파일 크기는 ${maxSizeInMB}MB 이하여야 합니다. (현재: ${formatFileSize(file.size)})`,
    }
  }

  return { valid: true }
}

/**
 * 파일 검증 (타입 + 크기)
 */
export function validateFile(
  file: File,
  allowedTypes: readonly ('pdf' | 'image' | 'audio' | 'video')[],
  maxSizeInMB: number = 50
): { valid: boolean; error?: string } {
  const typeValidation = validateFileType(file, allowedTypes)
  if (!typeValidation.valid) {
    return typeValidation
  }

  const sizeValidation = validateFileSize(file, maxSizeInMB)
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  return { valid: true }
}
