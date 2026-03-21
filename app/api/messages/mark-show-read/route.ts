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
  const active = await prisma.show.findFirst({ where: { isActive: true } })
  if (active) {
    await prisma.message.updateMany({
      where: { showId: active.id },
      data: { isRead: true },
    })
  }
  return NextResponse.json({ ok: true })
}
