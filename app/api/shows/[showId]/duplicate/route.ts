import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireShowAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { showId } = await params
  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  const body = await req.json().catch(() => ({}))
  const showName = (body.showName as string) || 'Copy'
  const src = access.show
  const tracks = await prisma.tracklist.findMany({
    where: { showId },
    orderBy: { indexNumber: 'asc' },
  })
  const newShow = await prisma.show.create({
    data: {
      userId: auth.userId,
      showName,
      defaultMeta: src.defaultMeta,
      isShowingDefaultMeta: src.isShowingDefaultMeta,
      description: src.description,
      isShowingDescription: src.isShowingDescription,
      episodeNumber: src.episodeNumber,
      autoplayOnStart: src.autoplayOnStart,
      autoplayOnDate: src.autoplayOnDate,
      stopAfterLastSong: src.stopAfterLastSong,
      stopOnCalendarEnd: src.stopOnCalendarEnd,
      // Recurring-show copies must keep stream/licensing + listener messaging
      // settings. Defaults are false; omitting these silently sends Radio Logik
      // plays to pending Auto DJ (one track kept at show end) and turns messaging off.
      hasRadioLogikTracking: src.hasRadioLogikTracking,
      hasMessagingEnabled: src.hasMessagingEnabled,
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
