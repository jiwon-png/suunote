export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  role?: UserRole
  createdAt: Date
  updatedAt: Date
}
