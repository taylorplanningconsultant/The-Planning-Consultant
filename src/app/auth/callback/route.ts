import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/** Only allow same-origin redirects (avoid open redirects). */
function safeNextPath(next: string | null, requestOrigin: string): string {
  const fallback = '/dashboard'
  if (!next) {
    return fallback
  }
  if (next.startsWith('/') && !next.startsWith('//')) {
    return next
  }
  try {
    const u = new URL(next)
    if (u.origin === requestOrigin) {
      return u.pathname + u.search + u.hash
    }
  } catch {
    // ignore invalid URL
  }
  return fallback
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'), origin)

  if (code) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
