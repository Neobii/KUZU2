import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    tracklist: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import {
  cleanupNearDuplicateStreamTracks,
  createStreamTrackLog,
  hasRecentStreamTrackPlay,
  normalizeStreamTrackKey,
} from '@/lib/stream-track-log'

describe('normalizeStreamTrackKey', () => {
  it('combines artist and title case-insensitively', () => {
    expect(normalizeStreamTrackKey('The Cure', 'Hot Hot Hot!!!')).toBe(
      'the cure - hot hot hot!!!'
    )
  })
})

describe('hasRecentStreamTrackPlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when the same song was logged within the dedup window', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'The Cure', songTitle: 'Hot Hot Hot!!!' },
    ])

    await expect(hasRecentStreamTrackPlay('The Cure', 'Hot Hot Hot!!!')).resolves.toBe(true)
  })

  it('returns false when only a different song was logged recently', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'Wilco', songTitle: 'ELT' },
    ])

    await expect(hasRecentStreamTrackPlay('The Cure', 'Hot Hot Hot!!!')).resolves.toBe(false)
  })
})

describe('createStreamTrackLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.tracklist.findMany.mockResolvedValue([])
    mocks.prisma.tracklist.create.mockResolvedValue({ id: 'track-1' })
  })

  it('skips insert when the same song was logged recently', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'AMPARO OCHOA', songTitle: 'LA CALACA' },
    ])

    const result = await createStreamTrackLog({
      artist: 'AMPARO OCHOA',
      songTitle: 'LA CALACA',
    })

    expect(result.stored).toBe(false)
    expect(mocks.prisma.tracklist.create).not.toHaveBeenCalled()
  })

  it('inserts when no recent matching row exists', async () => {
    const result = await createStreamTrackLog({
      artist: 'Jeannie C. Riley',
      songTitle: 'Harper Valley P.T.A.',
      artistId: 'artist-1',
    })

    expect(result.stored).toBe(true)
    expect(mocks.prisma.tracklist.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        artist: 'Jeannie C. Riley',
        songTitle: 'Harper Valley P.T.A.',
        artistId: 'artist-1',
        trackType: 'song',
      }),
    })
  })
})

describe('cleanupNearDuplicateStreamTracks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.tracklist.deleteMany = vi.fn().mockResolvedValue({ count: 1 })
  })

  it('deletes later rows when the same song was logged within the dedup window', async () => {
    const t0 = new Date('2026-08-13T19:01:01.223Z')
    const t1 = new Date('2026-08-13T19:01:01.545Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', artist: 'AMPARO OCHOA', songTitle: 'LA CALACA', playDate: t0 },
      { id: 'drop-1', artist: 'AMPARO OCHOA', songTitle: 'LA CALACA', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks()

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['drop-1'] } },
    })
  })
})
