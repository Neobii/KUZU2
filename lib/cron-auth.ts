import type { NextRequest } from 'next/server'

export function isAuthorizedCron(req: NextRequest | Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  // When CRON_SECRET is configured, only the Bearer token is trusted.
  // `x-vercel-cron` is spoofable by any client and must not bypass the secret.
  if (cronSecret) {
    return req.headers.get('authorization') === `Bearer ${cronSecret}`
  }
  return req.headers.get('x-vercel-cron') === '1'
}

export function getCronBaseUrl(): string | null {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim()
  if (nextAuthUrl) return nextAuthUrl.replace(/\/$/, '')
  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl}`
  return null
}

export function cronFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'cache-control': 'no-store' }
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    headers.authorization = `Bearer ${cronSecret}`
  } else {
    headers['x-vercel-cron'] = '1'
  }
  return headers
}
