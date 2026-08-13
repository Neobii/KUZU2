import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireAuth } from '@/lib/require-admin'
import { licensingTracksToPipeCsv, tracksToDelimited } from '@/lib/csv-export'
import {
  isCalendarDateString,
  parseStationExportDateRange,
} from '@/lib/datetime-local'
import { fetchLicensingExportRows } from '@/lib/track-export-query'

export const dynamic = 'force-dynamic'

function parseDateParam(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseExportRange(dateFrom: string | null, dateTo: string | null) {
  if (!dateFrom || !dateTo) return null
  if (isCalendarDateString(dateFrom) && isCalendarDateString(dateTo)) {
    return parseStationExportDateRange(dateFrom, dateTo)
  }
  const from = parseDateParam(dateFrom)
  const to = parseDateParam(dateTo)
  if (!from || !to) return null
  return { from, toExclusive: to }
}

/** Meteor `download` (standard) and `downloadTracksCSV` (licensing) */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'standard'
  const dateFromParam = url.searchParams.get('dateFrom')
  const dateToParam = url.searchParams.get('dateTo')
  const preview = url.searchParams.get('preview') === 'count'
  const range = parseExportRange(dateFromParam, dateToParam)

  if (format === 'licensing') {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    if (!range) {
      return NextResponse.json({ error: 'dateFrom and dateTo are required' }, { status: 400 })
    }
    const { from, toExclusive } = range
    if (from >= toExclusive) {
      return NextResponse.json({ error: 'dateTo must be on or after dateFrom' }, { status: 400 })
    }

    const rows = await fetchLicensingExportRows(from, toExclusive)

    if (preview) {
      return NextResponse.json({ count: rows.length })
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No song tracks with play dates found for that range.' },
        { status: 404 }
      )
    }

    const csv = `\uFEFF${licensingTracksToPipeCsv(rows)}`
    const filename = `tracks_${dateFromParam}___${dateToParam}_.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Track-Count': String(rows.length),
      },
    })
  }

  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const from = range?.from
  const toExclusive = range?.toExclusive

  const where =
    from && toExclusive
      ? {
          playDate: {
            gte: from,
            lt: toExclusive,
          },
        }
      : {}

  const rows = await prisma.tracklist.findMany({
    where,
    select: {
      trackType: true,
      songTitle: true,
      artist: true,
      album: true,
      label: true,
      trackLength: true,
      playDate: true,
      indexNumber: true,
    },
  })
  const csv = tracksToDelimited(rows, ';', true)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tracks.csv"',
    },
  })
}
