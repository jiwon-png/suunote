import { redirect } from 'next/navigation'
import { createClient, isMockMode } from '@/lib/supabase/server'

export default async function HomePage() {
  // Mock 모드에서는 항상 /login으로 리다이렉트 (클라이언트에서 인증 상태 확인)
  if (isMockMode()) {
    redirect('/login')
  }

  // 서버에서 인증 상태 확인 (쿠키 파싱/네트워크 실패 시 로그인 페이지로)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/posts')
    } else {
      redirect('/login')
    }
  } catch {
    redirect('/login')
  }
}
