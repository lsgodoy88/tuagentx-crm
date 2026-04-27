import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.panelUser.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        await audit('LOGIN', user.email, 'Login exitoso | Rol: ' + user.role).catch(() => {})
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          instance: user.instance,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.instance = (user as any).instance
      }
      // Cargar modulos al login o cuando se fuerza update()
      if (user || trigger === 'update') {
        const bots = await prisma.bot.findMany({
          where: { ownerId: token.id as string, activo: true },
          select: { tipo: true },
        })
        const tipos = [...new Set(bots.map((b: any) => b.tipo).filter(Boolean))]
        token.modulos = tipos
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        (session.user as any).instance = token.instance as string
        (session.user as any).modulos = (token.modulos as string[]) || []
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 12 * 60 * 60, updateAge: 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
