"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function Footer() {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) return null

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">SSU-Note</p>
              <p className="text-xs text-muted-foreground">
                AI가 도와주는 스마트한 학습 정리
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link
              href="/posts"
              className="hover:text-foreground transition-colors"
            >
              학습 노트
            </Link>
            <Link
              href="/courses"
              className="hover:text-foreground transition-colors"
            >
              코스
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>© 2026 SSU-Note. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
