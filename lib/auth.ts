import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FacebookProvider from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { getAppUrl } from '@/lib/app-url'
import { prisma } from '@/lib/prisma'
import { getFirstUserFlags } from '@/lib/first-user'

if (process.env.NODE_ENV === 'production') {
  const configured = process.env.NEXTAUTH_URL?.trim()
  if (!configured || configured.includes('localhost')) {
    process.env.NEXTAUTH_URL = getAppUrl()
  }
}

/** True when Facebook OAuth env vars are set (for UI + provider registration). */
export const isFacebookAuthEnabled =
  !!process.env.FACEBOOK_CLIENT_ID?.trim() && !!process.env.FACEBOOK_CLIENT_SECRET?.trim()

const providers: NextAuthOptions['providers'] = [
  ...(isFacebookAuthEnabled
    ? [
        FacebookProvider({
          clientId: process.env.FACEBOOK_CLIENT_ID!,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
          authorization: { params: { scope: 'email,public_profile' } },
        }),
      ]
    : []),
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
          isBoardMember: user.isBoardMember,
          isFieldProducer: user.isFieldProducer,
          producerProfile: producerProfile ?? undefined,
        }
      },
    }),
]

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'facebook' && !user.email) {
        return false
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'facebook') {
        const email = user.email?.toLowerCase()
        if (!email) return token
        const existing = await prisma.user.findUnique({ where: { email } })
        const profile = {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        }
        const firstFlags = existing ? null : await getFirstUserFlags()
        const dbUser = existing
          ? await prisma.user.update({
              where: { id: existing.id },
              data: {
                profile: {
                  ...((existing.profile as Record<string, unknown> | null) ?? {}),
                  ...profile,
                },
              },
            })
          : await prisma.user.create({
              data: {
                email,
                passwordHash: null,
                profile,
                isProducer: firstFlags!.isProducer,
                isAdmin: firstFlags!.isAdmin,
              },
            })
        token.id = dbUser.id
        token.isAdmin = dbUser.isAdmin
        token.isProducer = dbUser.isProducer
        token.isBoardMember = dbUser.isBoardMember
        token.isFieldProducer = dbUser.isFieldProducer
        token.producerProfile = dbUser.producerProfile as object
      } else if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin
        token.isProducer = (user as { isProducer?: boolean }).isProducer
        token.isBoardMember = (user as { isBoardMember?: boolean }).isBoardMember
        token.isFieldProducer = (user as { isFieldProducer?: boolean }).isFieldProducer
        token.producerProfile = (user as { producerProfile?: object }).producerProfile
      }
      // Keep JWT in sync with DB (e.g. admin enables Producer — no re-login required)
      if (token.id) {
        const row = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true, isProducer: true, isBoardMember: true, isFieldProducer: true, producerProfile: true },
        })
        if (row) {
          token.isAdmin = row.isAdmin
          token.isProducer = row.isProducer
          token.isBoardMember = row.isBoardMember
          token.isFieldProducer = row.isFieldProducer
          token.producerProfile = (row.producerProfile as object) ?? undefined
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id: string }).id = token.id as string
        ;(session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean
        ;(session.user as { isProducer?: boolean }).isProducer = token.isProducer as boolean
        ;(session.user as { isBoardMember?: boolean }).isBoardMember = token.isBoardMember as boolean
        ;(session.user as { isFieldProducer?: boolean }).isFieldProducer = token.isFieldProducer as boolean
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
