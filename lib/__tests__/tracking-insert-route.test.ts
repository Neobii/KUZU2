import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    show: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  createStreamTrackLog: vi.fn(),
  clearActiveShowRuntime: vi.fn(),
  autoplayNextTrack: vi.fn(),
  scheduleStopShowAtEnd: vi.fn(),
  streamTrackArtistFields: vi.fn(),
  setPendingAutoDJTrack: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/stream-track-log', () => ({
  createStreamTrackLog: mocks.createStreamTrackLog,
}))
vi.mock('@/lib/show-actions', () => ({
  clearActiveShowRuntime: mocks.clearActiveShowRuntime,
  autoplayNextTrack: mocks.autoplayNextTrack,
}))
vi.mock('@/lib/cron', () => ({
  scheduleStopShowAtEnd: mocks.scheduleStopShowAtEnd,
}))
vi.mock('@/lib/artist-resolve', () => ({
  streamTrackArtistFields: mocks.streamTrackArtistFields,
}))
vi.mock('@/lib/auto-dj-global', () => ({
  setPendingAutoDJTrack: mocks.setPendingAutoDJTrack,
}))

import { POST } from '@/app/api/tracking/insert/route'

describe('POST /api/tracking/insert armed Go Live', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.TRACKING_INSERT_SECRET
    mocks.streamTrackArtistFields.mockResolvedValue({ artist: 'A', artistId: null })
    mocks.createStreamTrackLog.mockResolvedValue({ stored: true, track: 'a - b' })
    mocks.prisma.show.findFirst
      .mockResolvedValueOnce({ id: 'live-1', isActive: true, hasRadioLogikTracking: true })
      .mockResolvedValueOnce({
        id: 'armed-1',
        isArmedForAutoStart: true,
        autoplayOnDate: false,
      })
  })

  it('logs the track but does not activate without TRACKING_INSERT_SECRET', async () => {
    const req = new Request('http://localhost/api/tracking/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist: 'A',
        songTitle: 'B',
        label: 'pre<><>show',
      }),
    })
    const res = await POST(req as any)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true, activated: false })
    expect(mocks.createStreamTrackLog).toHaveBeenCalled()
    expect(mocks.clearActiveShowRuntime).not.toHaveBeenCalled()
    expect(mocks.prisma.show.update).not.toHaveBeenCalled()
  })

  it('logs the track but does not activate with a wrong Bearer token', async () => {
    process.env.TRACKING_INSERT_SECRET = 'real-secret'
    // findFirst: activeShow, armedShow, then nextArmed (should not reach)
    mocks.prisma.show.findFirst.mockReset()
    mocks.prisma.show.findFirst
      .mockResolvedValueOnce({ id: 'live-1', isActive: true, hasRadioLogikTracking: true })
      .mockResolvedValueOnce({
        id: 'armed-1',
        isArmedForAutoStart: true,
        autoplayOnDate: false,
      })

    const req = new Request('http://localhost/api/tracking/insert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong',
      },
      body: JSON.stringify({
        artist: 'A',
        songTitle: 'B',
        label: 'go<><>live',
      }),
    })
    const res = await POST(req as any)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true, activated: false })
    expect(mocks.clearActiveShowRuntime).not.toHaveBeenCalled()
  })

  it('activates the armed show when Bearer matches TRACKING_INSERT_SECRET', async () => {
    process.env.TRACKING_INSERT_SECRET = 'real-secret'
    mocks.prisma.show.findFirst.mockReset()
    mocks.prisma.show.findFirst
      .mockResolvedValueOnce({ id: 'live-1', isActive: true, hasRadioLogikTracking: true })
      .mockResolvedValueOnce({
        id: 'armed-1',
        isArmedForAutoStart: true,
        autoplayOnDate: true,
      })
      .mockResolvedValueOnce({
        id: 'armed-1',
        isArmedForAutoStart: true,
        autoplayOnDate: true,
      })
    mocks.prisma.show.update.mockResolvedValue({})
    mocks.clearActiveShowRuntime.mockResolvedValue(undefined)
    mocks.autoplayNextTrack.mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/tracking/insert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer real-secret',
      },
      body: JSON.stringify({
        artist: 'A',
        songTitle: 'B',
        label: 'go<><>live',
      }),
    })
    const res = await POST(req as any)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(mocks.clearActiveShowRuntime).toHaveBeenCalled()
    expect(mocks.prisma.show.update).toHaveBeenCalledWith({
      where: { id: 'armed-1' },
      data: { isActive: true, isArmedForAutoStart: false },
    })
    expect(mocks.scheduleStopShowAtEnd).toHaveBeenCalledWith('armed-1')
    expect(mocks.autoplayNextTrack).toHaveBeenCalled()
  })
})
