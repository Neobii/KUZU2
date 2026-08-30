import { prisma } from '@/lib/prisma'
import { getPendingAutoDJTrack, setPendingAutoDJTrack } from '@/lib/auto-dj-global'
import { createStreamTrackLog } from '@/lib/stream-track-log'

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

  await createStreamTrackLog({
    artist: pending.artist,
    songTitle: pending.songTitle,
    album: pending.album,
    label: pending.label,
    trackLength: pending.duration,
  })
  setPendingAutoDJTrack(null)
}
