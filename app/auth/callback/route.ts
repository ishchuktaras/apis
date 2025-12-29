import { createServerClient } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  // Kam přesměrovat po úspěšném přihlášení (defaultně /dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    // OPRAVA PRO NEXT.JS 15: Musíme použít 'await'
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

    // Ověření jednorázového kódu (tokenu)
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Token je platný, uživatel je přihlášen -> přesměrujeme ho
      // Důležité: Odstraňujeme token z URL pro čistotu a bezpečnost
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Pokud je token neplatný nebo expirovaný, přesměrujeme na chybovou stránku nebo login
  // (Můžete přesměrovat i na '/login?error=invalid_token')
  return NextResponse.redirect(new URL('/login?error=auth_code_error', request.url))
}