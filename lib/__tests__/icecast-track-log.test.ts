import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    tracklist: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    show: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import { recordIcecastTrackIfChanged } from '@/lib/listeners'

describe('recordIcecastTrackIfChanged', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.show.findFirst.mockResolvedValue(null)
    mocks.prisma.tracklist.create.mockResolvedValue({ id: 'track-1' })
  })

  it('stores a new track when Icecast now-playing changes', async () => {
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artist: 'Old Artist',
      songTitle: 'Old Song',
    })

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'Sarah Jaffe - Clementine', listeners: 3 },
      },
    })

    expect(result.stored).toBe(true)
    expect(result.track).toBe('Sarah Jaffe - Clementine')
    expect(mocks.prisma.tracklist.create).toHaveBeenCalledWith({
      data: {
        artist: 'Sarah Jaffe',
        songTitle: 'Clementine',
        trackType: 'song',
        playDate: expect.any(Date),
      },
    })
  })

  it('does not save Icecast tracks during a KUZU-managed live show', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      hasRadioLogikTracking: false,
    })
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'The Cure - Hot Hot Hot!!!', listeners: 3 },
      },
    })

    expect(result.stored).toBe(false)
    expect(result.track).toBe('The Cure - Hot Hot Hot!!!')
    expect(mocks.prisma.tracklist.create).not.toHaveBeenCalled()
  })

  it('still saves licensing log rows when the live show uses Radio Logik tracking', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      hasRadioLogikTracking: true,
    })
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'The Cure - Hot Hot Hot!!!', listeners: 3 },
      },
    })

    expect(result.stored).toBe(true)
    expect(mocks.prisma.tracklist.create).toHaveBeenCalledTimes(1)
    const createArg = mocks.prisma.tracklist.create.mock.calls[0][0]
    expect(createArg.data.showId).toBeUndefined()
    expect(createArg.data.userId).toBeUndefined()
  })

  it('skips insert when the latest track matches Icecast', async () => {
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artist: 'Sarah Jaffe',
      songTitle: 'Clementine',
    })

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'Sarah Jaffe - Clementine', listeners: 3 },
      },
    })

    expect(result.stored).toBe(false)
    expect(mocks.prisma.tracklist.create).not.toHaveBeenCalled()
  })
})
