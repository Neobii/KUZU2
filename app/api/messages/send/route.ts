import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as { id?: string }).id
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { content, targetRole } = await req.json()
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!activeShow) {
    return NextResponse.json({ error: 'No active show' }, { status: 400 })
  }

  const profile = (session.user as { profile?: { name?: string } | null }).profile
  const displayName = profile?.name ?? session.user.email ?? 'Unknown'

  // Determine sender's role
  const user = session.user as {
    isAdmin?: boolean
    isProducer?: boolean
    isBoard?: boolean
    isStudioMonitor?: boolean
  }
  const senderRole = user.isAdmin
    ? 'Admin'
    : user.isBoard
      ? 'Board'
      : user.isStudioMonitor
        ? 'Studio Monitor'
        : user.isProducer
          ? 'Producer'
          : 'User'

  // Validate targetRole — default if not provided
  const validRoles = ['admin', 'producer', 'board', 'studio_monitor', 'all']
  const role = targetRole && validRoles.includes(targetRole) ? targetRole : 'all'

  const msg = await prisma.message.create({
    data: {
      content: content.trim(),
      sentBy: `${displayName} (${senderRole})`,
      showId: activeShow.id,
      authorId: id,
      targetRole: role,
    },
  })

  return NextResponse.json(msg)
}
