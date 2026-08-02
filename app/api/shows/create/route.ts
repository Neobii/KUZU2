import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as { id?: string }).id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  const producerProfile = user?.producerProfile as {
    showName?: string
    description?: string
    defaultMeta?: string
    isMessagingUIEnbled?: boolean
  } | null
  const body = (await request.json().catch(() => ({}))) as {
    autoplayOnStart?: boolean
    autoplayOnDate?: boolean
  }
  const show = await prisma.show.create({
    data: {
      userId,
      showName: producerProfile?.showName?.trim() || 'Kuzu Show',
      description: producerProfile?.description ?? ' ',
      defaultMeta: producerProfile?.defaultMeta ?? 'Kuzu Show',
      hasMessagingEnabled: producerProfile?.isMessagingUIEnbled ?? false,
      autoplayOnStart: typeof body.autoplayOnStart === 'boolean' ? body.autoplayOnStart : false,
      autoplayOnDate: typeof body.autoplayOnDate === 'boolean' ? body.autoplayOnDate : false,
    },
  })
  return NextResponse.json(show)
}
