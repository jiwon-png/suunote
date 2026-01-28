'use client'

export function usePosts() {
  // Posts hook implementation
  return {
    posts: [],
    isLoading: false,
    error: null,
    addPost: async () => {},
    updatePost: async () => {},
    deletePost: async () => {},
  }
}
