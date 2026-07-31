import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as { id?: string }).id
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const now = new Date()

  // Keep per-user activity (backwards compatible with existing deployments)
  await prisma.user.update({
    where: { id },
    data: { lastActiveAt: now },
  })

  // Channel-level activity: mark the sender's channel on the active show.
  // A channel is considered active when at least one member of that group is active.
  const user = session.user as {
    isAdmin?: boolean
    isProducer?: boolean
    isBoard?: boolean
    isStudioMonitor?: boolean
  }
  const channelField = user.isAdmin
    ? 'adminsLastActiveAt'
    : user.isBoard
      ? 'boardLastActiveAt'
      : user.isStudioMonitor
        ? 'studioMonitorsLastActiveAt'
        : user.isProducer
          ? 'producersLastActiveAt'
          : null

  if (channelField) {
    const activeShow = await prisma.show.findFirst({
      where: { isActive: true },
      select: { id: true },
    })
    if (activeShow) {
      await prisma.show.update({
        where: { id: activeShow.id },
        data: { [channelField]: now },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
