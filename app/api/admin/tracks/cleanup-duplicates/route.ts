import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { isCalendarDateString, parseStationExportDateRange } from '@/lib/datetime-local'
import { cleanupNearDuplicateStreamTracks } from '@/lib/stream-track-log'

export const dynamic = 'force-dynamic'

/** Admin one-time / on-demand cleanup for duplicate stream track rows. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json().catch(() => ({}))
  const dateFrom = typeof body.dateFrom === 'string' ? body.dateFrom : null
  const dateTo = typeof body.dateTo === 'string' ? body.dateTo : null

  let since: Date | undefined
  let until: Date | undefined
  if (
    dateFrom &&
    dateTo &&
    isCalendarDateString(dateFrom) &&
    isCalendarDateString(dateTo)
  ) {
    const range = parseStationExportDateRange(dateFrom, dateTo)
    if (range && range.from < range.toExclusive) {
      since = range.from
      until = range.toExclusive
    }
  }

  const result = await cleanupNearDuplicateStreamTracks({ since, until })
  return NextResponse.json({ ok: true, ...result })
}
