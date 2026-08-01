import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const id = (session.user as { id?: string }).id
  if (!id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, userId: id }
}

export async function getLiveShowAccess(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const active = await prisma.show.findFirst({ where: { isActive: true } })
  // Board members, field producers, and admins can view any active show.
  const canView =
    !!user?.isAdmin ||
    !!user?.isBoardMember ||
    !!user?.isFieldProducer ||
    (!!active && (active.userId === userId || active.helperUserId === userId))
  // Only admin/board/field producers can write the producer message box.
  const canEditProducerMessage = !!user?.isAdmin || !!user?.isBoardMember || !!user?.isFieldProducer
  return {
    user,
    active,
    canView,
    canEditProducerMessage,
    isShowOwner: !!active && active.userId === userId,
  }
}

export async function canAccessLiveShow(userId: string) {
  const { canView } = await getLiveShowAccess(userId)
  return canView
}
