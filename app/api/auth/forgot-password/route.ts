import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import {
  generateResetToken,
  getResetPasswordUrl,
  getResetTokenExpiry,
  hashResetToken,
} from '@/lib/password-reset'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GENERIC_MESSAGE =
  'If an account with that email exists, we sent a password reset link.'

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (user?.passwordHash) {
      const token = generateResetToken()
      const tokenHash = hashResetToken(token)
      const expiresAt = getResetTokenExpiry()

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        }),
      ])

      // Never fail the request after a token is stored — email may log to console in dev
      // or when Resend is misconfigured.
      try {
        await sendPasswordResetEmail(user.email, getResetPasswordUrl(token))
      } catch (emailError) {
        console.error('[forgot-password] email send failed:', emailError)
        console.info(`[forgot-password] reset URL: ${getResetPasswordUrl(token)}`)
      }
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
