import { prisma } from '@/lib/prisma'
import { streamTrackArtistFields } from '@/lib/artist-resolve'
import { createStreamTrackLog, hasSameSongStillOnAir } from '@/lib/stream-track-log'
import {
  fetchIcecastStats,
  getIcecastSource,
  icecastTrackDisplayKey,
  isIcecastAvailable,
  parseIcecastListeners,
  parseIcecastTrackParts,
  type IcecastStats,
} from '@/lib/icecast'

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

  const activeShow = await prisma.show.findFirst({ where: { isActive: true } })

  // During a KUZU-managed live show, playlist / Radio Logik owns track rows.
  // Icecast polling is for Auto DJ / off-air licensing only.
  if (activeShow) {
    return { stored: false, track: displayKey }
  }

  const artistFields = await streamTrackArtistFields(parts.artist)

  if (await hasSameSongStillOnAir(artistFields.artist, parts.songTitle)) {
    return { stored: false, track: displayKey }
  }

  return createStreamTrackLog({
    ...artistFields,
    songTitle: parts.songTitle,
  })
}

/** Poll Icecast status-json and log now-playing into tracklist (admin / licensing). */
export async function pollIcecastTrackLog(): Promise<{
  trackStored: boolean
  track: string | null
}> {
  const data = await fetchIcecastStats()
  if (!data || !isIcecastAvailable(data)) {
    return { trackStored: false, track: null }
  }

  const trackResult = await recordIcecastTrackIfChanged(data)
  return {
    trackStored: trackResult.stored,
    track: trackResult.track,
  }
}

/** Poll Icecast listener count only (Kuzu Stats charts). */
export async function pollListenerCount(): Promise<{
  stored: boolean
  numListeners: number | null
}> {
  const data = await fetchIcecastStats()
  if (!data || !isIcecastAvailable(data)) {
    return { stored: false, numListeners: null }
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

  return { stored, numListeners }
}

export async function pollListenerStats(): Promise<{
  stored: boolean
  numListeners: number | null
  trackStored: boolean
  track: string | null
}> {
  const listeners = await pollListenerCount()
  const track = await pollIcecastTrackLog()

  return {
    stored: listeners.stored,
    numListeners: listeners.numListeners,
    trackStored: track.trackStored,
    track: track.track,
  }
}
