import { prisma } from '@/lib/prisma'
import {
  fetchIcecastStats,
  getIcecastSource,
  icecastTrackDisplayKey,
  isIcecastAvailable,
  parseIcecastListeners,
  parseIcecastTrackParts,
  type IcecastStats,
} from '@/lib/icecast'

function latestTrackDisplayKey(track: {
  artist: string | null
  songTitle: string
}): string {
  if (track.artist && track.songTitle) {
    return `${track.artist} - ${track.songTitle}`
  }
  return track.songTitle || track.artist || ''
}

/** Insert a tracklist row when Icecast now-playing changes (cron / local poll). */
export async function recordIcecastTrackIfChanged(
  data: IcecastStats
): Promise<{ stored: boolean; track: string | null }> {
  if (!isIcecastAvailable(data)) {
    return { stored: false, track: null }
  }

  const source = getIcecastSource(data)
  const parts = parseIcecastTrackParts(source)
  if (!parts?.songTitle.trim()) {
    return { stored: false, track: null }
  }

  const displayKey = icecastTrackDisplayKey(parts)
  const latest = await prisma.tracklist.findFirst({
    where: { playDate: { not: null } },
    orderBy: { playDate: 'desc' },
    select: { artist: true, songTitle: true },
  })

  if (
    latest &&
    latestTrackDisplayKey(latest).trim().toLowerCase() === displayKey.trim().toLowerCase()
  ) {
    return { stored: false, track: displayKey }
  }

  const activeShow = await prisma.show.findFirst({ where: { isActive: true } })

  await prisma.tracklist.create({
    data: {
      artist: parts.artist || null,
      songTitle: parts.songTitle,
      trackType: 'song',
      playDate: new Date(),
      showId: activeShow?.id ?? null,
      userId: activeShow?.userId ?? null,
    },
  })

  return { stored: true, track: displayKey }
}

export async function pollListenerStats(): Promise<{
  stored: boolean
  numListeners: number | null
  trackStored: boolean
  track: string | null
}> {
  const data = await fetchIcecastStats()
  if (!data || !isIcecastAvailable(data)) {
    return { stored: false, numListeners: null, trackStored: false, track: null }
  }

  const numListeners = parseIcecastListeners(data)
  let stored = false
  if (numListeners != null) {
    try {
      await prisma.listenerStat.create({ data: { numListeners } })
      stored = true
    } catch {
      stored = false
    }
  }

  const trackResult = await recordIcecastTrackIfChanged(data)

  return {
    stored,
    numListeners,
    trackStored: trackResult.stored,
    track: trackResult.track,
  }
}
