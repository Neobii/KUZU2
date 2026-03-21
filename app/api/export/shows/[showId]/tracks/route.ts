import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-admin'
import { tracksToDelimited } from '@/lib/csv-export'

export const dynamic = 'force-dynamic'

/** Meteor `downloadShowTracks` — tab-delimited, no _id */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { showId } = await params
  const rows = await prisma.tracklist.findMany({
    where: { showId },
    orderBy: { indexNumber: 'asc' },
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
  const tsv = tracksToDelimited(rows, '\t', true)
  return new NextResponse(tsv, {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Content-Disposition': `attachment; filename="show-${showId}-tracks.tsv"`,
    },
  })
}
