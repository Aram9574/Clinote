import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string, value: string, options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPath = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/mfa') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password')
  const isDashboardPath = request.nextUrl.pathname.startsWith('/editor') ||
                          request.nextUrl.pathname.startsWith('/cases') ||
                          request.nextUrl.pathname.startsWith('/settings') ||
                          request.nextUrl.pathname.startsWith('/billing')

  if (!user && isDashboardPath) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (user && request.nextUrl.pathname === '/') {
    const editorUrl = new URL('/editor', request.url)
    return NextResponse.redirect(editorUrl)
  }

  // Suppress unused variable warning
  void isAuthPath

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
