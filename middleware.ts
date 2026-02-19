import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Supabase 접속 불가 시 true → fetch 에러 방지 (접속 가능해지면 false로 변경)
const SKIP_SUPABASE_IN_MIDDLEWARE = false;

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  if (SKIP_SUPABASE_IN_MIDDLEWARE) return res;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const all = req.cookies.getAll();
          return all.filter((c) => {
            if (!c.name.startsWith('sb-')) return true;
            if (!c.value.startsWith('base64-')) return true;
            if (c.value.slice(7).includes('.')) return false;
            return true;
          });
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options ?? {});
          });
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // 쿠키 파싱 실패 시 sb-* 쿠키 삭제 (재로그인 유도)
    req.cookies.getAll().forEach((c) => {
      if (c.name.startsWith('sb-')) {
        res.cookies.set(c.name, '', { maxAge: 0, path: '/' });
      }
    });
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
