import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import moment from 'moment'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const numTracks = parseInt(url.searchParams.get('numTracks') ?? '30', 10) || 30
  const tracks = await prisma.tracklist.findMany({
    where: { playDate: { not: null } },
    orderBy: { playDate: 'desc' },
    take: numTracks,
  })
  let tracksString = ''
  for (const track of tracks) {
    const isExportable =
      track.playDate &&
      (track.trackType === 'song' || track.trackType === 'talkingPoint')
    if (isExportable) {
      let trackerString = ''
      if (track.artist && track.songTitle) {
        trackerString = `${track.artist} - ${track.songTitle}`
      } else if (track.songTitle) {
        trackerString = track.songTitle
      } else if (track.artist) {
        trackerString = track.artist
      }
      const time = track.playDate ? moment(track.playDate).format('h:mm a') : ''
      trackerString += ` (${time})`
      tracksString += trackerString + '</br>'
    }
  }
  return NextResponse.json(tracksString)
}
