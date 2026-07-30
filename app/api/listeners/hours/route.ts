import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getListenerPollIntervalMs } from '@/lib/icecast'
import { requireStatsAccess } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireStatsAccess()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const start = new Date(body.startDate)
  const end = new Date(body.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 })
  }

  const stats = await prisma.listenerStat.findMany({
    where: {
      fetchDate: { gte: start, lt: end },
    },
  })

  const intervalHours = getListenerPollIntervalMs() / 3_600_000
  let hours = 0
  for (const s of stats) {
    hours += intervalHours * s.numListeners
  }
  return NextResponse.json({ hours })
}
