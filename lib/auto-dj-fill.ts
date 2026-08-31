import { prisma } from '@/lib/prisma'
import { streamTrackArtistFields } from '@/lib/artist-resolve'
import { getPendingAutoDJTrack, setPendingAutoDJTrack } from '@/lib/auto-dj-global'
import { createStreamTrackLog, hasSameSongStillOnAir } from '@/lib/stream-track-log'

/** Insert pending Auto DJ track when show ends (no RadioLogik on active show) */
export async function fillAutoDJTrack() {
  const pending = getPendingAutoDJTrack()
  if (!pending) return

  const active = await prisma.show.findFirst({
    where: { isActive: true, hasRadioLogikTracking: true },
  })
  if (active) {
    return
  }

  const songTitle = pending.songTitle.trim()
  if (!songTitle) {
    setPendingAutoDJTrack(null)
    return
  }

  const artistFields = await streamTrackArtistFields(pending.artist)

  // Same-as-latest guard (not only the near-dup window): show-end handoff often
  // repeats the last logged title after talk time > STREAM_TRACK_DEDUP_MS.
  if (await hasSameSongStillOnAir(artistFields.artist, songTitle)) {
    setPendingAutoDJTrack(null)
    return
  }

  await createStreamTrackLog({
    ...artistFields,
    songTitle,
    album: pending.album || null,
    label: pending.label || null,
    trackLength: pending.duration || null,
  })
  setPendingAutoDJTrack(null)
}
