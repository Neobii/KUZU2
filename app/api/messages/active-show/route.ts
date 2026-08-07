import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLiveShowAccess, requireSession } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const live = await getLiveShowAccess(auth.userId)
  if (!live.active) return NextResponse.json([])
  if (!live.canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await prisma.message.findMany({
    where: { showId: live.active.id },
    orderBy: { sentAt: 'desc' },
  })
  return NextResponse.json(messages)
}
