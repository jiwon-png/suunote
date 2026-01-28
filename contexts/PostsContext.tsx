'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Post } from '@/domain/posts/types'

interface PostsContextType {
  posts: Post[]
  addPost: (post: Post) => void
  updatePost: (id: string, post: Partial<Post>) => void
  deletePost: (id: string) => void
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

export function PostsProvider({ children }: { children: ReactNode }) {
  // Phase 1: In-memory state
  // Phase 2: Will be replaced with Supabase integration

  const value: PostsContextType = {
    posts: [],
    addPost: () => {},
    updatePost: () => {},
    deletePost: () => {},
  }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePostsContext() {
  const context = useContext(PostsContext)
  if (context === undefined) {
    throw new Error('usePostsContext must be used within a PostsProvider')
  }
  return context
}
