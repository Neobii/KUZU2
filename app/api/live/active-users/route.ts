import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ACTIVE_WINDOW_MS = 60_000

// Channel names returned to the client, keyed by the Show last-active field
const CHANNELS = [
  { name: 'admins', showField: 'adminsLastActiveAt' as const },
  { name: 'board', showField: 'boardLastActiveAt' as const },
  { name: 'studioMonitors', showField: 'studioMonitorsLastActiveAt' as const },
  { name: 'producers', showField: 'producersLastActiveAt' as const },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS) // active within last 60s

  // Channel-level activity lives on the active show (updated by heartbeat)
  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      adminsLastActiveAt: true,
      boardLastActiveAt: true,
      studioMonitorsLastActiveAt: true,
      producersLastActiveAt: true,
    },
  })

  const users = await prisma.user.findMany({
    where: {
      lastActiveAt: { gte: since },
    },
    select: {
      id: true,
      email: true,
      profile: true,
      isAdmin: true,
      isProducer: true,
      isBoardMember: true,
      isStudioMonitor: true,
      lastActiveAt: true,
    },
    orderBy: { lastActiveAt: 'desc' },
  })

  // A channel is ACTIVE if at least one member of that group is active
  // (either the show-level timestamp was touched by a member's heartbeat,
  // or the member list itself still shows an active member).
  const channels = CHANNELS.map(({ name, showField }) => {
    const showLastActive = activeShow ? activeShow[showField] : null
    const members = users.filter((u) => {
      if (name === 'admins') return u.isAdmin
      if (name === 'board') return u.isBoardMember
      if (name === 'studioMonitors') return u.isStudioMonitor
      return u.isProducer
    })
    const latestMemberActive = members.reduce<Date | null>(
      (latest, u) => (u.lastActiveAt && (!latest || u.lastActiveAt > latest) ? u.lastActiveAt : latest),
      null,
    )
    const lastActiveAt =
      showLastActive && (!latestMemberActive || showLastActive > latestMemberActive)
        ? showLastActive
        : latestMemberActive
    return {
      name,
      active: !!lastActiveAt && lastActiveAt >= since,
      activeMembers: members.length,
      lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
    }
  })

  return NextResponse.json({ users, channels })
}
