import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword 
        )

        if (!isPasswordValid) {
          return null
        }

        // Teď už TypeScript ví, že User může mít tenantId, takže žádná chyba!
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          tenantId: user.tenantId 
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // TypeScript už ví, že session.user má id i tenantId (díky souboru z kroku 1)
        session.user.id = token.sub;
        session.user.tenantId = token.tenantId;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tenantId = user.tenantId;
      }
      return token;
    }
  }
}