import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Rozšíření Session objektu (to, co máte dostupné v useSession / getServerSession)
   */
  interface Session {
    user: {
      id: string
      tenantId: string
    } & DefaultSession["user"]
  }

  /**
   * Rozšíření User objektu (to, co vrací authorize funkce)
   */
  interface User {
    tenantId: string
  }
}

declare module "next-auth/jwt" {
  /**
   * Rozšíření JWT tokenu
   */
  interface JWT {
    tenantId: string
  }
}