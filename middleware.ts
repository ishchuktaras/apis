// middleware.ts - Supabase Auth middleware
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Získání uživatele
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const path = url.pathname

  // OCHRANA PROTI SMYČKÁM:
  // Pokud jsme na veřejné stránce a uživatel NENÍ přihlášen,
  // vrátíme response rovnou, abychom neriskovali redirecty.
  // (Předpokládám, že /dashboard je jediná chráněná sekce)
  const isProtectedRoute = path.startsWith('/dashboard')
  const isAuthRoute = path === '/login'

  // 1. Ochrana /dashboard
  if (isProtectedRoute && !user) {
    // Použij url.origin pro absolutní URL, je to bezpečnější
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // 2. Přesměrování z /login
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', url.origin))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Optimalizovaný matcher.
     * Vynecháváme statické soubory, obrázky, favicon, ALE
     * stále spouštíme middleware na všech stránkách (kvůli session refresh).
     * Pokud bys chtěl middleware ÚPLNĚ vypnout pro veřejný web,
     * musel bys změnit matcher jen na ['/dashboard/:path*', '/login'],
     * ale to by znamenalo, že se session neobnoví na pozadí při prohlížení webu.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
