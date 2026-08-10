import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireAuth } from '@/lib/require-admin'
import { licensingTracksToPipeCsv, tracksToDelimited } from '@/lib/csv-export'

export const dynamic = 'force-dynamic'

function parseDateParam(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Meteor `download` (standard) and `downloadTracksCSV` (licensing) */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'standard'
  const from = parseDateParam(url.searchParams.get('dateFrom'))
  const to = parseDateParam(url.searchParams.get('dateTo'))

  if (format === 'licensing') {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    if (!from || !to) {
      return NextResponse.json({ error: 'dateFrom and dateTo are required' }, { status: 400 })
    }
    if (from >= to) {
      return NextResponse.json({ error: 'dateTo must be after dateFrom' }, { status: 400 })
    }

    const rows = await prisma.tracklist.findMany({
      where: {
        trackType: 'song',
        playDate: { gte: from, lt: to },
      },
      select: {
        playDate: true,
        songTitle: true,
        artist: true,
        album: true,
        label: true,
        trackLength: true,
      },
      orderBy: { playDate: 'asc' },
    })

    const csv = licensingTracksToPipeCsv(rows)
    const filename = `tracks_${from.toISOString()}___${to.toISOString()}_.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const where =
    from && to
      ? {
          playDate: {
            gte: from,
            lt: to,
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
