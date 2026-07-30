import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessLiveShow } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as { id?: string }).id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const allowed = await canAccessLiveShow(userId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const show = await prisma.show.findFirst({ where: { isActive: true } })
  if (!show) {
    return NextResponse.json({ show: null, tracks: [], messageCount: 0 })
  }
  const tracks = await prisma.tracklist.findMany({
    where: { showId: show.id },
    orderBy: { indexNumber: 'asc' },
  })
  const highest = tracks.reduce((m, t) => Math.max(m, t.indexNumber ?? -1), -1)
  const nextUnplayed = tracks.find((t) => !t.playDate)

  // Count unread messages targeted at the current user's roles
  const user = session.user as {
    isAdmin?: boolean
    isProducer?: boolean
    isBoard?: boolean
    isStudioMonitor?: boolean
  }
  const userRoles: string[] = []
  if (user.isAdmin) userRoles.push('admin', 'all')
  if (user.isProducer) userRoles.push('producer', 'all')
  if (user.isBoard) userRoles.push('board', 'all')
  if (user.isStudioMonitor) userRoles.push('studio_monitor', 'all')
  if (userRoles.length === 0) userRoles.push('all')

  const messageCount = await prisma.message.count({
    where: {
      showId: show.id,
      isRead: false,
      targetRole: { in: userRoles },
    },
  })
  const recentlyPlayed = tracks.filter((t) => t.isHighlighted && t.playDate)
  return NextResponse.json({
    show,
    tracks,
    highestIndex: highest,
    hasNextTrack: !!nextUnplayed,
    messageCount,
    recentlyPlayed,
  })
}
