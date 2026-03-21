import { prisma } from '@/lib/prisma'
import { fillAutoDJTrack } from '@/lib/auto-dj-fill'

let autoplayTimeout: NodeJS.Timeout | null = null

export function clearAutoplayTimer() {
  if (autoplayTimeout) {
    clearTimeout(autoplayTimeout)
    autoplayTimeout = null
  }
}

export function scheduleNextTrackAfter(
  trackLength: string,
  showId: string,
  currentIndex: number
) {
  clearAutoplayTimer()
  const splitIndex = trackLength.indexOf(':')
  const min = parseInt(trackLength.substring(0, splitIndex) || '0', 10) || 0
  const sec =
    parseInt(trackLength.substring(splitIndex + 1) || '0', 10) || 0
  const ms = (min * 60 + sec) * 1000
  if (ms <= 0) return

  autoplayTimeout = setTimeout(async () => {
    autoplayTimeout = null
    const { startNextTrackAfterCurrent } = await import('@/lib/show-actions')
    await startNextTrackAfterCurrent(showId, currentIndex)
  }, ms)
}
