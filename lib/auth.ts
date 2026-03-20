import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        const profile = user.profile as { name?: string } | null
        const producerProfile = user.producerProfile as object | null
        return {
          id: user.id,
          email: user.email,
          name: profile?.name ?? user.email,
          isAdmin: user.isAdmin,
          isProducer: user.isProducer,
          producerProfile: producerProfile ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin
        token.isProducer = (user as { isProducer?: boolean }).isProducer
        token.producerProfile = (user as { producerProfile?: object }).producerProfile
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id: string }).id = token.id as string
        ;(session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean
        ;(session.user as { isProducer?: boolean }).isProducer = token.isProducer as boolean
        ;(session.user as { producerProfile?: object }).producerProfile =
          token.producerProfile as object
      }
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
