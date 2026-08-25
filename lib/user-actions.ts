import { prisma } from '@/lib/prisma'
import { deleteShow } from '@/lib/show-actions'

/**
 * Delete a user after tearing down every show they own.
 *
 * Prisma cascades Show rows on User delete, but Tracklist uses onDelete: SetNull.
 * A bare `prisma.user.delete` therefore:
 * - skips deleteShow live/runtime teardown (autoplay timer, stop-at-end, Auto DJ)
 * - orphans played tracks with showId=null so they pollute licensing exports
 */
export async function deleteUserAccount(userId: string) {
  const shows = await prisma.show.findMany({
    where: { userId },
    select: { id: true },
  })
  for (const show of shows) {
    await deleteShow(show.id)
  }
  await prisma.user.delete({ where: { id: userId } })
}
