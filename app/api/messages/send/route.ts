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
  const { content } = await req.json()
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
    select: { id: true, userId: true },
  })
  if (!activeShow) {
    return NextResponse.json({ error: 'No active show' }, { status: 400 })
  }

  const profile = (session.user as { profile?: { name?: string } | null }).profile
  const displayName = profile?.name ?? session.user.email ?? 'Unknown'
  const role = (session.user as { isAdmin?: boolean }).isAdmin
    ? 'Admin'
    : (session.user as { isProducer?: boolean }).isProducer
      ? 'Producer'
      : 'User'
  const sentBy = `${displayName} (${role})`

  const msg = await prisma.message.create({
    data: {
      content: content.trim(),
      sentBy,
      showId: activeShow.id,
      producerId: activeShow.userId,
    },
  })

  return NextResponse.json(msg)
}
