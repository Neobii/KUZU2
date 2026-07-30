function normalizeUrl(url: string): string {
  const trimmed = url.replace(/\/$/, '')
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

/** Public app origin for links in emails (password reset, etc.). */
export function getAppUrl(): string {
  const isProd = process.env.NODE_ENV === 'production'
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim()

  if (nextAuthUrl) {
    const normalized = normalizeUrl(nextAuthUrl)
    if (!isProd || !normalized.includes('localhost')) {
      return normalized
    }
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelProduction) {
    return normalizeUrl(vercelProduction)
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return normalizeUrl(vercelUrl)
  }

  if (nextAuthUrl) {
    return normalizeUrl(nextAuthUrl)
  }

  return 'http://localhost:3000'
}
