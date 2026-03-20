import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const show = await prisma.show.findFirst({
    where: { isActive: true },
  })
  if (show?.isShowingDefaultMeta) {
    return NextResponse.json(show.defaultMeta ?? ' ')
  }
  const track = await prisma.tracklist.findFirst({
    where: { playDate: { not: null } },
    orderBy: { playDate: 'desc' },
  })
  if (!track) return NextResponse.json(' ')
  const trackerString =
    track.artist && track.songTitle
      ? `${track.artist} - ${track.songTitle}`
      : track.songTitle ?? track.artist ?? ' '
  return NextResponse.json(trackerString)
}
