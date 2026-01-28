'use client'

export function useAuth() {
  // Auth hook implementation
  return {
    user: null,
    isLoading: false,
    signIn: async () => {},
    signOut: async () => {},
  }
}
