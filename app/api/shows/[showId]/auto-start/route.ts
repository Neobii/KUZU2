import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scheduleAutoStartShow } from '@/lib/cron'
import { requireSession } from '@/lib/api-auth'
import { requireShowAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { showId } = await params
  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  await prisma.show.update({
    where: { id: showId },
    data: { autoStartEnd: true },
  })
  scheduleAutoStartShow(showId)
  return NextResponse.json({ ok: true })
}
