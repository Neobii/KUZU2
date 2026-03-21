import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-admin'
import { tracksToDelimited } from '@/lib/csv-export'

export const dynamic = 'force-dynamic'

/** Meteor `download` — all tracks or date range, semicolon-delimited CSV */
export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const url = new URL(req.url)
  const from = url.searchParams.get('dateFrom')
  const to = url.searchParams.get('dateTo')
  const where =
    from && to
      ? {
          playDate: {
            gte: new Date(from),
            lt: new Date(to),
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
