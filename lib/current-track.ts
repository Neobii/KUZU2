import { prisma } from '@/lib/prisma'
import { fetchIcecastNowPlaying } from '@/lib/icecast'

export function formatCurrentTrackString(
  track: { artist: string | null; songTitle: string } | null
): string {
  if (!track) return ' '
  if (track.artist && track.songTitle) {
    return `${track.artist} - ${track.songTitle}`
  }
  if (track.songTitle) return track.songTitle
  if (track.artist) return track.artist
  return ' '
}

/**
 * Mirrors Meteor `getCurrentTrack`.
 * Live metadata from Icecast; DB tracklist only when KUZU2 is running an active show.
 */
export async function getCurrentTrackString(): Promise<string> {
  const show = await prisma.show.findFirst({
    where: { isActive: true },
  })
  if (show?.isShowingDefaultMeta) {
    return show.defaultMeta ?? ' '
  }

  const fromIcecast = await fetchIcecastNowPlaying()
  if (fromIcecast?.trim()) {
    return fromIcecast
  }

  // Avoid stale QA/dev rows when Icecast is unreachable and no live show is active.
  if (!show) {
    return ' '
  }

  const track = await prisma.tracklist.findFirst({
    where: { playDate: { not: null } },
    orderBy: { playDate: { sort: 'desc', nulls: 'last' } },
    select: { artist: true, songTitle: true },
  })
  return formatCurrentTrackString(track)
}
