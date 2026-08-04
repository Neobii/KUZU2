import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireArtistManager } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error

  const { artistId } = await params
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, artistName: true },
  })
  if (!artist) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const tracks = await prisma.tracklist.findMany({
    where: { artistId },
    orderBy: [{ playDate: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      songTitle: true,
      album: true,
      label: true,
      trackLength: true,
      playDate: true,
      showId: true,
      show: { select: { showName: true } },
    },
  })

  return NextResponse.json({ artist, tracks })
}
