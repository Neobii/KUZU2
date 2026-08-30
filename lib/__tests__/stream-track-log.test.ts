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
  streamTracksMatch,
} from '@/lib/stream-track-log'

describe('normalizeStreamTrackKey', () => {
  it('combines artist and title case-insensitively', () => {
    expect(normalizeStreamTrackKey('The Cure', 'Hot Hot Hot!!!')).toBe(
      'the cure - hot hot hot!!!'
    )
  })

  it('splits artist and title when only the title field is populated', () => {
    expect(normalizeStreamTrackKey(null, 'The Cure - Hot Hot Hot!!!')).toBe(
      'the cure - hot hot hot!!!'
    )
  })
})

describe('streamTracksMatch', () => {
  it('matches rows when artist metadata is missing on one side', () => {
    expect(streamTracksMatch('The Cure', 'Hot Hot Hot!!!', null, 'Hot Hot Hot!!!')).toBe(true)
  })

  it('does not match different songs with the same title and distinct artists', () => {
    expect(streamTracksMatch('Artist A', 'Love', 'Artist B', 'Love')).toBe(false)
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

  it('returns true when artist metadata differs but the title matches', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'The Cure', songTitle: 'Hot Hot Hot!!!' },
    ])

    await expect(hasRecentStreamTrackPlay(null, 'Hot Hot Hot!!!')).resolves.toBe(true)
  })

  it('returns false when only a different song was logged recently', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'Wilco', songTitle: 'ELT' },
    ])

    await expect(hasRecentStreamTrackPlay('The Cure', 'Hot Hot Hot!!!')).resolves.toBe(false)
  })

  it('scopes the recent-play query to stream/licensing rows (showId null)', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([])

    await hasRecentStreamTrackPlay('The Cure', 'Hot Hot Hot!!!')

    expect(mocks.prisma.tracklist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          showId: null,
          trackType: 'song',
        }),
      })
    )
  })
})

describe('createStreamTrackLog vs show playlist plays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.tracklist.create.mockResolvedValue({ id: 'track-1' })
  })

  it('still inserts a licensing row when only a show-attached play would have matched', async () => {
    // hasRecentStreamTrackPlay queries showId: null, so show playlist rows are
    // invisible here — findMany returns [] even if a live show just played it.
    mocks.prisma.tracklist.findMany.mockResolvedValue([])

    const result = await createStreamTrackLog({
      artist: 'The Cure',
      songTitle: 'Hot Hot Hot!!!',
    })

    expect(result.stored).toBe(true)
    expect(mocks.prisma.tracklist.create).toHaveBeenCalled()
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

  it('deletes later rows when artist metadata is missing on the duplicate', async () => {
    const t0 = new Date('2026-08-13T19:01:01.223Z')
    const t1 = new Date('2026-08-13T19:01:01.545Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', artist: 'The Cure', songTitle: 'Hot Hot Hot!!!', playDate: t0 },
      { id: 'drop-1', artist: null, songTitle: 'Hot Hot Hot!!!', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks()

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['drop-1'] } },
    })
  })
})
