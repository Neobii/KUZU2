import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { showId, songTitle, artist, album, label, trackLength, trackType, artistId } = body
  if (!showId || !songTitle) {
    return NextResponse.json({ error: 'showId and songTitle required' }, { status: 400 })
  }
  const show = await prisma.show.findUnique({
    where: { id: showId },
  })
  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  let artistIdValue: string | undefined
  if (artistId != null && artistId !== '') {
    const artistRow = await prisma.artist.findUnique({ where: { id: String(artistId) } })
    if (!artistRow) return NextResponse.json({ error: 'Artist not found' }, { status: 400 })
    artistIdValue = artistRow.id
  }
  const userId = (session.user as { id?: string }).id
  const highest = await prisma.tracklist.findFirst({
    where: { showId },
    orderBy: { indexNumber: 'desc' },
  })
  const indexNumber = (highest?.indexNumber ?? -1) + 1
  const track = await prisma.tracklist.create({
    data: {
      showId,
      songTitle,
      artist: artist || undefined,
      artistId: artistIdValue,
      album: album || undefined,
      label: label || undefined,
      trackLength: trackLength || undefined,
      trackType: trackType || 'song',
      userId,
      indexNumber,
    },
  })
  return NextResponse.json(track)
}
