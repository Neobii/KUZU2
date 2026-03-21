import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scheduleAutoStartShow } from '@/lib/cron'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { showId } = await params
  await prisma.show.update({
    where: { id: showId },
    data: { autoStartEnd: true },
  })
  scheduleAutoStartShow(showId)
  return NextResponse.json({ ok: true })
}
