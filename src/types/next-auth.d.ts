import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role?: string
      adminId?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    adminId?: string
  }
}

export type { NextAuthOptions }
