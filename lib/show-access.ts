import { NextResponse } from 'next/server'
import type { Show, User } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getLiveShowAccess } from '@/lib/api-auth'

export function isStationOps(user: Pick<User, 'isAdmin' | 'isBoardMember' | 'isFieldProducer'>) {
  return user.isAdmin || user.isBoardMember || user.isFieldProducer
}

export function isShowMember(
  userId: string,
  show: Pick<Show, 'userId' | 'helperUserId'>
) {
  return show.userId === userId || show.helperUserId === userId
}

/**
 * Prisma `where` for listing shows on My Shows / GET /api/shows.
 * Admins see all; everyone else sees shows they own or help on.
 */
export function showsListWhereForUser(userId: string | undefined, isAdmin: boolean) {
  if (isAdmin) return {}
  if (!userId) return { id: '__none__' }
  return {
    OR: [{ userId }, { helperUserId: userId }],
  }
}

/** Edit/delete show, add/import/duplicate tracks, activate a specific show */
export function canManageShow(
  user: Pick<User, 'id' | 'isAdmin' | 'isBoardMember' | 'isFieldProducer'>,
  show: Pick<Show, 'userId' | 'helperUserId'>
) {
  return isStationOps(user) || isShowMember(user.id, show)
}

/** Producer message box on live show — station ops write; owner/helper may clear */
export function canWriteProducerMessage(
  user: Pick<User, 'isAdmin' | 'isBoardMember' | 'isFieldProducer'>,
  show: Pick<Show, 'userId' | 'helperUserId'>,
  userId: string,
  value: string | null
) {
  const canWrite = isStationOps(user)
  const isClear = value === null
  return canWrite || (isClear && isShowMember(userId, show))
}

export async function requireShowAccess(showId: string, userId: string) {
  const [show, user] = await Promise.all([
    prisma.show.findUnique({ where: { id: showId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  if (!show) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!canManageShow(user, show)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { show, user }
}

export async function requireTrackAccess(trackId: string, userId: string) {
  const track = await prisma.tracklist.findUnique({
    where: { id: trackId },
    include: { show: true },
  })

  if (!track) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (!track.showId || !track.show) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const access = await requireShowAccess(track.showId, userId)
  if ('error' in access) return access

  return { track, show: access.show, user: access.user }
}

/** Read/export tracks for a show (same rules as manage) */
export const requireShowReadAccess = requireShowAccess

/** Start track, autoplay, live meta — must control the active show */
export async function requireLiveShowControl(userId: string) {
  const access = await getLiveShowAccess(userId)
  if (!access.canView || !access.active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return access
}
