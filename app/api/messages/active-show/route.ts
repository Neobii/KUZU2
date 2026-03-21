import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const active = await prisma.show.findFirst({ where: { isActive: true } })
  if (!active) return NextResponse.json([])
  const messages = await prisma.message.findMany({
    where: { showId: active.id },
    orderBy: { sentAt: 'desc' },
  })
  return NextResponse.json(messages)
}
