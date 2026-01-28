'use client'

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    createdAt: Date
  }
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div>
      {/* Post card will be implemented here */}
    </div>
  )
}
