import { createHash, randomBytes } from 'crypto'

export const RESET_TOKEN_BYTES = 32
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export function generateResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString('hex')
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS)
}

export function getResetPasswordUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
  return `${base}/reset-password?token=${encodeURIComponent(token)}`
}
