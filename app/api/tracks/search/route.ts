import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export type TrackSearchResult = {
  songTitle: string
  artist: string | null
  artistId: string | null
  album: string | null
  label: string | null
  trackLength: string | null
  trackType: string
}

function trackKey(t: { songTitle: string; artist: string | null }) {
  return `${t.songTitle.trim().toLowerCase()}|${(t.artist ?? '').trim().toLowerCase()}`
}

/** Search prior tracks for autocomplete when adding/editing tracklist rows. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = (request.nextUrl.searchParams.get('search') ?? '').trim()
  if (!search) {
    return NextResponse.json({ tracks: [] as TrackSearchResult[] })
  }

  const rows = await prisma.tracklist.findMany({
    where: {
      trackType: 'song',
      OR: [
        { songTitle: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 40,
    select: {
      songTitle: true,
      artist: true,
      artistId: true,
      album: true,
      label: true,
      trackLength: true,
      trackType: true,
    },
  })

  const seen = new Set<string>()
  const tracks: TrackSearchResult[] = []
  for (const row of rows) {
    const key = trackKey(row)
    if (seen.has(key)) continue
    seen.add(key)
    tracks.push(row)
    if (tracks.length >= 10) break
  }

  return NextResponse.json({ tracks })
}
