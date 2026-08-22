import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/auto-dj-fill', () => ({ fillAutoDJTrack: vi.fn() }))

describe('trackLengthToMs', () => {
  it('parses mm:ss into milliseconds', async () => {
    const { trackLengthToMs } = await import('@/lib/live-timer')
    expect(trackLengthToMs('3:45')).toBe((3 * 60 + 45) * 1000)
    expect(trackLengthToMs('0:05')).toBe(5000)
  })

  it('returns 0 for zero or unparseable lengths', async () => {
    const { trackLengthToMs } = await import('@/lib/live-timer')
    expect(trackLengthToMs('0:00')).toBe(0)
    expect(trackLengthToMs(':')).toBe(0)
    expect(trackLengthToMs('abc:def')).toBe(0)
    expect(trackLengthToMs('120')).toBe(0)
  })
})

describe('scheduleNextTrackAfter', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
  })

  it('returns false and does not arm a timer for 0:00', async () => {
    vi.useFakeTimers()
    const { scheduleNextTrackAfter, clearAutoplayTimer } = await import(
      '@/lib/live-timer'
    )
    const setSpy = vi.spyOn(global, 'setTimeout')

    expect(scheduleNextTrackAfter('0:00', 'show-1', 0)).toBe(false)
    expect(setSpy).not.toHaveBeenCalled()
    clearAutoplayTimer()
  })

  it('returns true and arms a timer for a positive length', async () => {
    vi.useFakeTimers()
    const { scheduleNextTrackAfter, clearAutoplayTimer } = await import(
      '@/lib/live-timer'
    )
    const setSpy = vi.spyOn(global, 'setTimeout')

    expect(scheduleNextTrackAfter('0:05', 'show-1', 0)).toBe(true)
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 5000)
    clearAutoplayTimer()
  })
})
