export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  POSTS: '/posts',
  POSTS_NEW: '/posts/new',
  POST_DETAIL: (id: string) => `/posts/${id}`,
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  DASHBOARD: '/dashboard',
} as const
