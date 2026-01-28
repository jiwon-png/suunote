'use client'

export function usePost(postId: string) {
  // Single post hook implementation
  return {
    post: null,
    isLoading: false,
    error: null,
  }
}
