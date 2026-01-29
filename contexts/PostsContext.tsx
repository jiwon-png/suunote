'use client'

import { createContext, useContext, ReactNode, useState } from 'react'
import { Post } from '@/domain/posts/types'

interface PostsContextType {
  posts: Post[]
  addPost: (post: Post) => void
  updatePost: (id: string, post: Partial<Post>) => void
  deletePost: (id: string) => void
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

// Mock 데이터: 테스트용 초기 학습 게시글
const createMockPost = (
  id: string,
  title: string,
  content: string,
  aiProcessed: boolean,
  daysAgo: number
): Post => {
  const now = new Date()
  const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return {
    id,
    userId: 'mock-user-1',
    title,
    content,
    aiProcessed,
    createdAt,
    updatedAt: createdAt,
  }
}

const initialMockPosts: Post[] = [
  {
    ...createMockPost(
      'mock-post-1',
      '운영체제 프로세스 스케줄링',
      '운영체제의 프로세스 스케줄링 알고리즘에 대해 학습했습니다. FCFS, SJF, Round Robin 등 다양한 스케줄링 알고리즘의 특징과 장단점을 이해했습니다. 각 알고리즘은 CPU 사용률, 응답 시간, 대기 시간 등 다양한 성능 지표에 영향을 미칩니다.',
      true,
      2
    ),
    subjectId: 'os',
    courseId: 'course-1',
    aiResult: {
      summary: 'React의 useState와 useEffect 훅은 함수 컴포넌트에서 상태 관리와 사이드 이펙트를 처리하는 핵심 도구입니다. useState는 컴포넌트 내부 상태를 선언적으로 관리하며, useEffect는 렌더링 후 실행되는 로직을 처리합니다. 이 두 훅을 올바르게 조합하면 재사용 가능하고 유지보수하기 쉬운 컴포넌트를 만들 수 있습니다.',
      keyPoints: [
        'useState는 함수 컴포넌트에서 상태를 관리하는 기본 훅입니다',
        'useEffect는 컴포넌트의 생명주기와 연관된 사이드 이펙트를 처리합니다',
        '의존성 배열을 올바르게 설정하여 불필요한 재실행을 방지해야 합니다',
        '훅의 규칙을 준수하여 예측 가능한 동작을 보장해야 합니다',
      ],
      studyDirection: '다음 단계로 useMemo, useCallback 등 성능 최적화 훅을 학습하고, 커스텀 훅을 만들어 재사용 가능한 로직을 추출하는 방법을 익혀보세요. 또한 React의 렌더링 최적화 기법과 상태 관리 패턴을 깊이 있게 공부하면 더욱 효율적인 컴포넌트를 작성할 수 있습니다.',
    },
  },
  {
    ...createMockPost(
      'mock-post-2',
      '데이터베이스 정규화',
      '데이터베이스 설계에서 정규화의 중요성과 각 정규화 단계의 목적에 대해 학습했습니다. 실무에서 적절한 정규화 수준을 선택하는 것이 핵심입니다. 1NF는 각 컬럼이 원자값을 가져야 하며, 2NF는 부분 함수 종속성을 제거하고, 3NF는 이행 종속성을 제거합니다.',
      true,
      5
    ),
    subjectId: 'db',
    courseId: 'course-2',
    aiResult: {
      summary: 'Next.js 15의 App Router는 파일 시스템 기반 라우팅을 제공하며, Server Components와 Client Components를 구분하여 사용합니다. Server Components는 서버에서 렌더링되어 성능을 향상시키고, Client Components는 상호작용이 필요한 부분에만 사용합니다.',
      keyPoints: [
        'App Router는 파일 시스템 기반 라우팅을 제공합니다',
        'Server Components는 기본적으로 서버에서 렌더링됩니다',
        'Client Components는 "use client" 지시어를 사용하여 명시합니다',
        '레이아웃과 페이지를 중첩하여 구성할 수 있습니다',
      ],
      studyDirection: 'Server Actions와 데이터 페칭 패턴을 학습하고, 동적 라우팅과 병렬 라우팅을 활용한 고급 라우팅 기법을 익혀보세요. 또한 Next.js의 최적화 기능인 이미지 최적화, 폰트 최적화 등을 활용하여 성능을 더욱 향상시킬 수 있습니다.',
    },
  },
  {
    ...createMockPost(
      'mock-post-3',
      '알고리즘 시간 복잡도 분석',
      '알고리즘의 시간 복잡도를 분석하는 방법을 학습했습니다. Big-O 표기법을 사용하여 알고리즘의 성능을 평가하고, 최선/평균/최악의 경우를 고려해야 합니다.',
      false,
      1
    ),
    subjectId: 'algo',
  },
  {
    ...createMockPost(
      'mock-post-4',
      '데이터베이스 인덱싱 전략',
      '데이터베이스 인덱싱 전략에 대해 학습했습니다. B-Tree 인덱스의 구조와 동작 원리를 이해하고, 적절한 인덱스 설계가 쿼리 성능에 미치는 영향을 파악했습니다.',
      true,
      7
    ),
    subjectId: 'db',
    courseId: 'course-2',
    aiResult: {
      summary: '데이터베이스 정규화는 데이터 중복을 제거하고 무결성을 보장하기 위한 설계 기법입니다. 1NF, 2NF, 3NF 등 단계별로 정규화를 진행하며, 실무에서는 성능과 무결성 사이의 균형을 고려하여 적절한 정규화 수준을 선택해야 합니다.',
      keyPoints: [
        '1NF: 각 컬럼이 원자값을 가져야 합니다',
        '2NF: 부분 함수 종속성을 제거해야 합니다',
        '3NF: 이행 종속성을 제거해야 합니다',
        '과도한 정규화는 조인 연산 증가로 성능 저하를 일으킬 수 있습니다',
      ],
      studyDirection: '역정규화(Denormalization) 기법과 인덱싱 전략을 학습하여 성능 최적화 방법을 익혀보세요. 또한 실제 프로젝트에서 정규화와 성능 사이의 트레이드오프를 고려한 설계 사례를 분석하면 실무에 도움이 될 것입니다.',
    },
  },
]

export function PostsProvider({ children }: { children: ReactNode }) {
  // Phase 1: In-memory state
  // Phase 2: Will be replaced with Supabase integration
  const [posts, setPosts] = useState<Post[]>(initialMockPosts)

  const addPost = (post: Post) => {
    setPosts((prev) => [post, ...prev])
  }

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, ...updates, updatedAt: new Date() } : post))
    )
  }

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id))
  }

  const value: PostsContextType = {
    posts,
    addPost,
    updatePost,
    deletePost,
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
