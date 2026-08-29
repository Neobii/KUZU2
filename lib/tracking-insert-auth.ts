import { timingSafeEqual } from 'crypto'

/** Shared secret for Radio Logik → POST /api/tracking/insert (Bearer). */
export function getTrackingInsertSecret(): string | null {
  const secret = process.env.TRACKING_INSERT_SECRET?.trim()
  return secret || null
}

/**
 * Authorize the armed-show Go Live path (`label` contains `<><>`).
 *
 * Fail closed: activation requires TRACKING_INSERT_SECRET and a matching
 * `Authorization: Bearer <secret>`. Unauthenticated callers can still insert
 * stream/licensing rows, but must not displace the live show.
 */
export function canActivateArmedShowFromTrackingInsert(
  authorizationHeader: string | null
): boolean {
  const secret = getTrackingInsertSecret()
  if (!secret) return false

  if (!authorizationHeader?.startsWith('Bearer ')) return false
  const token = authorizationHeader.slice('Bearer '.length).trim()
  if (!token) return false

  const expected = Buffer.from(secret)
  const actual = Buffer.from(token)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
