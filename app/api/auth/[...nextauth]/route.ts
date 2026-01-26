import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions),
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 1. Najdeme uživatele v DB (přímo přes Prismu na VPS)
        // Pozor: Ujistěte se, že máte v DB tabulku 'users' nebo 'profiles'
        // Pokud máte tabulku 'profiles', změňte 'prisma.user' na 'prisma.profiles'
        const user = await prisma.users.findUnique({ // Zde možná budete muset změnit 'users' na název vaší tabulky
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          return null
        }

        // 2. Ověříme heslo (pokud máte hesla zahashovaná bcryptem)
        // Pokud migrujete ze Supabase, hesla mohou být jinak šifrovaná.
        // Pro nové uživatele to bude fungovat.
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || "" 
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id + '',
          email: user.email,
          name: user.username || user.email, // Upravte podle názvů sloupců v DB
        }
      }
    })
  ],
})

export { handler as GET, handler as POST }