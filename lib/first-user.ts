import { prisma } from '@/lib/prisma'

/**
 * When there are no users yet, the next account created should be admin
 * (matches seed behavior for the first admin user).
 */
export async function getFirstUserFlags(): Promise<{ isAdmin: boolean; isProducer: boolean }> {
  const count = await prisma.user.count()
  if (count === 0) {
    return { isAdmin: true, isProducer: true }
  }
  return { isAdmin: false, isProducer: false }
}
