export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}
