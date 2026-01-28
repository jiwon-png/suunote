"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, User, ChevronDown, GraduationCap } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppContext } from "@/contexts/AppContext"
import { useAuthContext } from "@/contexts/AuthContext"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"
  const { subjects, selectedSubjectId, setSelectedSubjectId } = useAppContext()
  const { user, signOut } = useAuthContext()

  if (isLoginPage) return null

  const handleSignOut = async () => {
    await signOut()
    // 로그아웃 후 명시적으로 로그인 페이지로 이동
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/posts" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              SSU-Note
            </span>
          </Link>

          {/* Subject Selector */}
          {subjects.length > 0 && (
            <div className="hidden sm:block">
              <Select
                value={selectedSubjectId || "all"}
                onValueChange={(value) =>
                  setSelectedSubjectId(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="h-9 w-[160px] border-border bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="전체 과목" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 과목</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Courses Link */}
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href="/courses" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              코스
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
                <span className="hidden text-sm sm:inline">
                  {user?.fullName || user?.email || "사용자"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Mobile-only subject selector */}
              {subjects.length > 0 && (
                <div className="sm:hidden">
                  <DropdownMenuItem
                    onClick={() => setSelectedSubjectId(undefined)}
                    className={!selectedSubjectId ? "bg-secondary" : ""}
                  >
                    전체 과목
                  </DropdownMenuItem>
                  {subjects.map((subject) => (
                    <DropdownMenuItem
                      key={subject.id}
                      onClick={() => setSelectedSubjectId(subject.id)}
                      className={selectedSubjectId === subject.id ? "bg-secondary" : ""}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/courses" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      코스
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
              )}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
