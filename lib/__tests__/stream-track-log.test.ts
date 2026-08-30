import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    tracklist: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

vi.mock('@/lib/icecast', () => ({
  getListenerPollIntervalMs: vi.fn(() => 300_000),
  getIcecastTrackPollIntervalMs: vi.fn(() => 1000),
}))

import {
  cleanupNearDuplicateStreamTracks,
  createStreamTrackLog,
  getStreamTrackDedupMs,
  hasRecentStreamTrackPlay,
  hasSameSongStillOnAir,
  normalizeStreamTrackKey,
  streamTracksMatch,
  tracksDuplicateForCleanup,
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

  it('matches titles that differ only by punctuation', () => {
    expect(streamTracksMatch('The Cure', 'Hot Hot Hot!!!', 'The Cure', 'Hot Hot Hot')).toBe(true)
  })
})

describe('tracksDuplicateForCleanup', () => {
  it('matches combined title text against split artist and title fields', () => {
    expect(
      tracksDuplicateForCleanup(null, 'Wilco - ELT', 'Wilco', 'ELT')
    ).toBe(true)
  })
})

describe('getStreamTrackDedupMs', () => {
  it('is at least one minute longer than the Icecast track poll interval', () => {
    expect(getStreamTrackDedupMs()).toBe(240_000)
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

  it('includes show-attached plays when checking for recent duplicates', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'The Cure', songTitle: 'Hot Hot Hot!!!' },
    ])

    await expect(hasRecentStreamTrackPlay('The Cure', 'Hot Hot Hot!!!')).resolves.toBe(true)

    expect(mocks.prisma.tracklist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ showId: expect.anything() }),
      })
    )
  })
})

describe('createStreamTrackLog vs show playlist plays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.tracklist.create.mockResolvedValue({ id: 'track-1' })
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: typeof mocks.prisma) => unknown) =>
      fn(mocks.prisma)
    )
  })

  it('skips insert when the same song was recently played on a live show', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { artist: 'The Cure', songTitle: 'Hot Hot Hot!!!' },
    ])

    const result = await createStreamTrackLog({
      artist: 'The Cure',
      songTitle: 'Hot Hot Hot!!!',
    })

    expect(result.stored).toBe(false)
    expect(mocks.prisma.tracklist.create).not.toHaveBeenCalled()
  })
})

describe('createStreamTrackLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.tracklist.findMany.mockResolvedValue([])
    mocks.prisma.tracklist.create.mockResolvedValue({ id: 'track-1' })
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: typeof mocks.prisma) => unknown) =>
      fn(mocks.prisma)
    )
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
  const range = {
    since: new Date('2026-08-01T00:00:00.000Z'),
    until: new Date('2026-09-01T00:00:00.000Z'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.tracklist.deleteMany = vi.fn().mockResolvedValue({ count: 1 })
  })

  it('deletes later rows when the same song was logged within the dedup window', async () => {
    const t0 = new Date('2026-08-13T19:01:01.223Z')
    const t1 = new Date('2026-08-13T19:01:01.545Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', showId: null, artist: 'AMPARO OCHOA', songTitle: 'LA CALACA', playDate: t0 },
      { id: 'drop-1', showId: null, artist: 'AMPARO OCHOA', songTitle: 'LA CALACA', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks(range)

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['drop-1'] } },
    })
  })

  it('deletes later rows when artist metadata is missing on the duplicate', async () => {
    const t0 = new Date('2026-08-13T19:01:01.223Z')
    const t1 = new Date('2026-08-13T19:01:01.545Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', showId: null, artist: 'The Cure', songTitle: 'Hot Hot Hot!!!', playDate: t0 },
      { id: 'drop-1', showId: null, artist: null, songTitle: 'Hot Hot Hot!!!', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks(range)

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['drop-1'] } },
    })
  })

  it('deletes repeat poll rows many minutes later within the cleanup window', async () => {
    const t0 = new Date('2026-08-13T19:00:00.000Z')
    const t1 = new Date('2026-08-13T19:05:00.000Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t0 },
      { id: 'drop-1', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks(range)

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['drop-1'] } },
    })
  })

  it('deletes a second play of the same song on the same station day', async () => {
    const t0 = new Date('2026-08-13T19:00:00.000Z')
    const t1 = new Date('2026-08-13T21:00:00.000Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t0 },
      { id: 'drop-1', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks(range)

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['drop-1'] } },
    })
  })

  it('keeps the same song when it airs on different station days', async () => {
    const t0 = new Date('2026-08-13T21:00:00.000Z')
    const t1 = new Date('2026-08-14T21:00:00.000Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'keep-1', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t0 },
      { id: 'keep-2', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks(range)

    expect(result.deleted).toBe(0)
    expect(mocks.prisma.tracklist.deleteMany).not.toHaveBeenCalled()
  })

  it('drops a stream duplicate when a show-attached row exists for the same song', async () => {
    const t0 = new Date('2026-08-13T19:00:00.000Z')
    const t1 = new Date('2026-08-13T19:00:05.000Z')
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'stream-1', showId: null, artist: 'Wilco', songTitle: 'ELT', playDate: t0 },
      { id: 'show-1', showId: 'show-1', artist: 'Wilco', songTitle: 'ELT', playDate: t1 },
    ])

    const result = await cleanupNearDuplicateStreamTracks(range)

    expect(result.deleted).toBe(1)
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['stream-1'] } },
    })
  })
})

describe('hasSameSongStillOnAir', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when the latest play matches within the on-air window', async () => {
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artist: 'Wilco',
      songTitle: 'ELT',
      playDate: new Date(Date.now() - 60_000),
    })

    await expect(hasSameSongStillOnAir('Wilco', 'ELT')).resolves.toBe(true)
  })
})
