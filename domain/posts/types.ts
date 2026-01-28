export interface Post {
  id: string
  userId: string
  courseId?: string
  subjectId?: string
  title: string
  content: string
  combinedContent?: string
  aiProcessed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PostAttachment {
  id: string
  postId: string
  fileName: string
  fileType: string
  fileUrl: string
  fileSize?: number
  extractedText?: string
  createdAt: Date
}

export interface CreatePostData {
  title: string
  content: string
  subjectId?: string
  attachments?: File[]
}
