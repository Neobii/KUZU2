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
  const dateFrom = typeof body.dateFrom === 'string' ? body.dateFrom.trim() : ''
  const dateTo = typeof body.dateTo === 'string' ? body.dateTo.trim() : ''

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'dateFrom and dateTo are required.' }, { status: 400 })
  }
  if (!isCalendarDateString(dateFrom) || !isCalendarDateString(dateTo)) {
    return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 })
  }
  if (dateFrom > dateTo) {
    return NextResponse.json({ error: 'End date must be on or after start date.' }, { status: 400 })
  }

  const range = parseStationExportDateRange(dateFrom, dateTo)
  if (!range || range.from >= range.toExclusive) {
    return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 })
  }

  const result = await cleanupNearDuplicateStreamTracks({
    since: range.from,
    until: range.toExclusive,
  })
  return NextResponse.json({ ok: true, dateFrom, dateTo, ...result })
}
