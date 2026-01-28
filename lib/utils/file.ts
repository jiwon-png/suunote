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
