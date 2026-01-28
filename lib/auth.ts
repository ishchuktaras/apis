// lib/auth.ts

import { NextAuthOptions, Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      tenantId: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string
  }
}

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
        // 1. DIAGNOSTIKA
        console.log("🟢 POKUS O PŘIHLÁŠENÍ:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("🔴 Chybí email nebo heslo");
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true }
        })

        // 2. DIAGNOSTIKA
        if (!user) {
          console.log("🔴 Uživatel v databázi NEEXISTUJE.");
          return null
        } else {
          console.log("🟢 Uživatel nalezen:", user.email);
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword 
        )

        // 3. DIAGNOSTIKA
        if (!isPasswordValid) {
          console.log("🔴 Heslo nesouhlasí!");
          return null
        }

        console.log("🟢 Heslo OK. Přihlašuji...");

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
        session.user.id = token.sub;
        
        if (token.tenantId) {
            session.user.tenantId = token.tenantId;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // Přetypování user na specific type, abychom se dostali k tenantId bez složitých typů
        token.tenantId = (user as { tenantId: string }).tenantId;
      }
      return token;
    }
  }
}