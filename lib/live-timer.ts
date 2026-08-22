import { prisma } from '@/lib/prisma'
import { fillAutoDJTrack } from '@/lib/auto-dj-fill'

let autoplayTimeout: NodeJS.Timeout | null = null

export function clearAutoplayTimer() {
  if (autoplayTimeout) {
    clearTimeout(autoplayTimeout)
    autoplayTimeout = null
  }
}

/**
 * Parse "m:ss" / "mm:ss" track lengths into milliseconds.
 * Returns 0 for missing, zero, or unparseable values.
 */
export function trackLengthToMs(trackLength: string): number {
  const splitIndex = trackLength.indexOf(':')
  if (splitIndex < 0) return 0
  const min = parseInt(trackLength.substring(0, splitIndex) || '0', 10)
  const sec = parseInt(trackLength.substring(splitIndex + 1) || '0', 10)
  if (!Number.isFinite(min) || !Number.isFinite(sec) || min < 0 || sec < 0) {
    return 0
  }
  return (min * 60 + sec) * 1000
}

/**
 * Schedule the next autoplay advance. Returns false when no timer was armed
 * (zero/unparseable length) so callers can clear isAutoPlaying instead of
 * leaving autoplay stuck with no timeout.
 */
export function scheduleNextTrackAfter(
  trackLength: string,
  showId: string,
  currentIndex: number
): boolean {
  clearAutoplayTimer()
  const ms = trackLengthToMs(trackLength)
  if (ms <= 0) return false

  autoplayTimeout = setTimeout(async () => {
    autoplayTimeout = null
    const { startNextTrackAfterCurrent } = await import('@/lib/show-actions')
    await startNextTrackAfterCurrent(showId, currentIndex)
  }, ms)
  return true
}
