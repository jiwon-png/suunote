export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 로그인 페이지는 Header와 Footer 없이 깔끔한 레이아웃
  return <>{children}</>
}
