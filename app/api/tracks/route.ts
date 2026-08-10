import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireShowAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const { showId, songTitle, artist, album, label, trackLength, trackType, artistId } = body
  if (!showId || !songTitle) {
    return NextResponse.json({ error: 'showId and songTitle required' }, { status: 400 })
  }

  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  let artistIdValue: string | undefined
  if (artistId != null && artistId !== '') {
    const artistRow = await prisma.artist.findUnique({ where: { id: String(artistId) } })
    if (!artistRow) return NextResponse.json({ error: 'Artist not found' }, { status: 400 })
    artistIdValue = artistRow.id
  }
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
      userId: auth.userId,
      indexNumber,
    },
  })
  return NextResponse.json(track)
}
