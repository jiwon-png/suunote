import { redirect } from 'next/navigation'
import { createClient, isMockMode } from '@/lib/supabase/server'

export default async function HomePage() {
  // Mock 모드에서는 항상 /login으로 리다이렉트 (클라이언트에서 인증 상태 확인)
  if (isMockMode()) {
    redirect('/login')
  }

  // 서버에서 인증 상태 확인
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인한 사용자는 /posts로, 비로그인 사용자는 /login으로 리다이렉트
  // 실제 리다이렉트는 middleware에서 처리되지만, 이중 안전장치로 여기서도 처리
  if (user) {
    redirect('/posts')
  } else {
    redirect('/login')
  }
}
