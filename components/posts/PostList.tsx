"use client"

import { Post } from "@/domain/posts/types"
import PostCard from "./PostCard"
import EmptyPostState from "./EmptyPostState"

interface PostListProps {
  posts: Post[]
}

export default function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <EmptyPostState />
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
