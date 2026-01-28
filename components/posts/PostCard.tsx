"use client"

import Link from "next/link"
import { CheckCircle, Clock, ChevronRight } from "lucide-react"
import { Post } from "@/domain/posts/types"
import { Card } from "@/components/ui/card"

interface PostCardProps {
  post: Post
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export default function PostCard({ post }: PostCardProps) {
  const displayTitle = post.title || post.content.slice(0, 50)

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="group flex items-center justify-between px-4 py-2.5 transition-all hover:border-primary/30 hover:shadow-sm">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight text-card-foreground group-hover:text-primary">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-3 text-xs leading-tight text-muted-foreground">
            <span>{formatDate(post.createdAt)}</span>
            {post.aiProcessed ? (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="h-3 w-3" />
                AI 요약 완료
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                처리 중
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 ml-3" />
      </Card>
    </Link>
  )
}
