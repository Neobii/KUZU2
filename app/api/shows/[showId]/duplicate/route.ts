import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getHighestTrackNumber } from '@/lib/show-actions'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { showId } = await params
  const body = await req.json().catch(() => ({}))
  const showName = (body.showName as string) || 'Copy'
  const src = await prisma.show.findUnique({ where: { id: showId } })
  if (!src) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const tracks = await prisma.tracklist.findMany({
    where: { showId },
    orderBy: { indexNumber: 'asc' },
  })
  const newShow = await prisma.show.create({
    data: {
      userId,
      showName,
      defaultMeta: src.defaultMeta,
      isShowingDefaultMeta: src.isShowingDefaultMeta,
      description: src.description,
      isShowingDescription: src.isShowingDescription,
      episodeNumber: src.episodeNumber,
      autoplayOnStart: src.autoplayOnStart,
      autoplayOnDate: src.autoplayOnDate,
    },
  })
  let idx = 0
  for (const t of tracks) {
    await prisma.tracklist.create({
      data: {
        showId: newShow.id,
        songTitle: t.songTitle,
        artist: t.artist,
        album: t.album,
        label: t.label,
        trackLength: t.trackLength,
        trackType: t.trackType,
        indexNumber: idx++,
      },
    })
  }
  return NextResponse.json(newShow)
}
