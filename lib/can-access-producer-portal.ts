import type { User } from 'next-auth'

/**
 * Who can see producer nav links and use `/producer/*` and `/track-imports`.
 * - Admins always (station ops)
 * - Users with `isProducer` (explicit producer role)
 * - Users with a non-empty `producerProfile` (legacy / profile without flag)
 */
export function canAccessProducerPortal(user: User | undefined | null): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  if (user.isProducer) return true
  const pp = user.producerProfile
  if (pp && typeof pp === 'object' && Object.keys(pp as object).length > 0) return true
  return false
}
