import { createHash, randomBytes } from 'crypto'
import { getAppUrl } from '@/lib/app-url'

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
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`
}
