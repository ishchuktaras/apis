import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Získáme parametry z URL
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // "next" parametr určuje, kam přesměrovat po přihlášení (např. /dashboard/settings)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

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
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Vyměníme jednorázový kód za Session (přihlášení)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Vytvoříme přesměrování na cílovou stránku
      // DŮLEŽITÉ: Používáme 'origin' z requestu, abychom zůstali na stejné doméně
      const forwardedUrl = new URL(next, origin)
      
      // Odstraníme 'code' z URL, aby to bylo čisté
      forwardedUrl.searchParams.delete('code')

      return NextResponse.redirect(forwardedUrl)
    }
  }

  // Pokud se něco pokazí, vrátíme uživatele na přihlašovací stránku s chybou
  // (místo /auth/auth-code-error, která možná neexistuje)
  return NextResponse.redirect(new URL('/login?error=auth_code_error', origin))
}