import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (user) {
          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) return null
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        }

        const employee = await prisma.employee.findUnique({
          where: { email: credentials.email },
          include: { user: true },
        })

        if (employee) {
          const valid = await bcrypt.compare(credentials.password, employee.password)
          if (!valid) return null
          return {
            id: employee.id,
            email: employee.email,
            name: employee.name,
            role: 'EMPLOYEE',
            adminId: employee.userId,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.adminId = (user as { adminId?: string }).adminId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { adminId?: string }).adminId = token.adminId as string | undefined
      }
      return session
    },
  },
}

export function getAdminUserId(session: {
  user?: { id?: string; role?: string; adminId?: string }
}): string | null {
  if (!session.user?.id) return null
  if (session.user.role === 'EMPLOYEE' && session.user.adminId) {
    return session.user.adminId
  }
  return session.user.id
}
