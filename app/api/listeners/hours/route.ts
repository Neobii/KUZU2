import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getListenerPollIntervalMs } from '@/lib/icecast'
import { parseStationExportDateRange } from '@/lib/datetime-local'
import { requireStatsAccess } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireStatsAccess()
  if ('error' in auth) return auth.error

  const body = await req.json()
  // Calendar picks are station days (America/Chicago), same as licensing export.
  // Server-local midnight (UTC on Vercel) would drop evening Central listenership.
  const range = parseStationExportDateRange(
    String(body.startDate ?? ''),
    String(body.endDate ?? '')
  )
  if (!range) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 })
  }
  const { from: start, toExclusive: end } = range
  if (start >= end) {
    return NextResponse.json({ error: 'endDate must be on or after startDate' }, { status: 400 })
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
