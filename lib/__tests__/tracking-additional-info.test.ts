import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    productionStatus: { findFirst: vi.fn() },
    show: { findFirst: vi.fn() },
    tracklist: { findFirst: vi.fn() },
    artist: { findUnique: vi.fn(), findFirst: vi.fn() },
    artistShow: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import {
  getCurrentAdditionalInfo,
  hashAdditionalInfo,
  formatLocalArtistShowHtml,
} from '@/lib/tracking-additional-info'
import {
  getCurrentLocalArtistShowHtml,
  localArtistShowDateWindow,
  parseArtistShowDate,
} from '@/lib/local-artist-show'

describe('getCurrentAdditionalInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns production status additional content when enabled', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: true,
      additionalContent: '<p>Station note</p>',
    })
    mocks.prisma.show.findFirst.mockResolvedValue({
      isShowingDescription: true,
      description: 'Show description',
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe('<p>Station note</p>')
  })

  it('returns show description when production content is disabled', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: false,
      additionalContent: '<p>Hidden</p>',
    })
    mocks.prisma.show.findFirst.mockResolvedValue({
      isShowingDescription: true,
      description: 'Live show info',
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe('Live show info')
  })

  it('returns a blank string when nothing is configured', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue(null)
    mocks.prisma.show.findFirst.mockResolvedValue({
      isShowingDescription: false,
      description: 'Hidden',
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe(' ')
  })
})

describe('getCurrentLocalArtistShowHtml', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when display flag is off', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isDisplayingLocalArtistShows: false,
    })
    await expect(getCurrentLocalArtistShowHtml()).resolves.toBeNull()
  })

  it('scopes the live-show path to that show and returns promo HTML', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isDisplayingLocalArtistShows: true,
    })
    mocks.prisma.show.findFirst.mockResolvedValue({ id: 'show-live' })
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artistId: 'artist-1',
      artist: 'Local Band',
    })
    mocks.prisma.artist.findUnique.mockResolvedValue({
      id: 'artist-1',
      artistName: 'Local Band',
      isLocalArtist: true,
    })
    mocks.prisma.artistShow.findFirst.mockResolvedValue({
      flyerImageUrl: 'https://example.com/flyer.webp',
      content: '<p>Doors 7pm</p>',
      showDate: new Date(),
      artist: { artistName: 'Local Band' },
    })

    await expect(getCurrentLocalArtistShowHtml()).resolves.toBe(
      '<img src="https://example.com/flyer.webp" alt="Local Band" /><p>Doors 7pm</p>'
    )
    expect(mocks.prisma.tracklist.findFirst).toHaveBeenCalledWith({
      where: { showId: 'show-live', playDate: { not: null } },
      orderBy: { playDate: { sort: 'desc', nulls: 'last' } },
      select: { artistId: true, artist: true },
    })
    expect(mocks.prisma.artistShow.findFirst).toHaveBeenCalled()
  })

  it('returns null when a live show has no played tracks (no stale stream fallback)', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isDisplayingLocalArtistShows: true,
    })
    mocks.prisma.show.findFirst.mockResolvedValue({ id: 'show-live' })
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)

    await expect(getCurrentLocalArtistShowHtml()).resolves.toBeNull()
    expect(mocks.prisma.tracklist.findFirst).toHaveBeenCalledWith({
      where: { showId: 'show-live', playDate: { not: null } },
      orderBy: { playDate: { sort: 'desc', nulls: 'last' } },
      select: { artistId: true, artist: true },
    })
    expect(mocks.prisma.artist.findUnique).not.toHaveBeenCalled()
  })

  it('uses stream/licensing rows only when no live show is active', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isDisplayingLocalArtistShows: true,
    })
    mocks.prisma.show.findFirst.mockResolvedValue(null)
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artistId: 'artist-2',
      artist: 'Stream Local',
    })
    mocks.prisma.artist.findUnique.mockResolvedValue({
      id: 'artist-2',
      artistName: 'Stream Local',
      isLocalArtist: true,
    })
    mocks.prisma.artistShow.findFirst.mockResolvedValue({
      flyerImageUrl: null,
      content: '<p>Tonight</p>',
      showDate: new Date(),
      artist: { artistName: 'Stream Local' },
    })

    await expect(getCurrentLocalArtistShowHtml()).resolves.toBe('<p>Tonight</p>')
    expect(mocks.prisma.tracklist.findFirst).toHaveBeenCalledWith({
      where: { showId: null, playDate: { not: null } },
      orderBy: { playDate: { sort: 'desc', nulls: 'last' } },
      select: { artistId: true, artist: true },
    })
  })
})

describe('localArtistShowDateWindow', () => {
  it('spans roughly ±1 month', () => {
    const now = new Date('2026-08-12T15:00:00.000Z')
    const { from, to } = localArtistShowDateWindow(now)
    expect(from.getTime()).toBeLessThan(now.getTime())
    expect(to.getTime()).toBeGreaterThan(now.getTime())
    const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)
    expect(days).toBeGreaterThan(55)
    expect(days).toBeLessThan(70)
  })
})

describe('parseArtistShowDate', () => {
  it('parses YYYY-MM-DD', () => {
    const d = parseArtistShowDate('2026-09-01')
    expect(d).toBeInstanceOf(Date)
    expect(d?.toISOString().startsWith('2026-09-01')).toBe(true)
  })

  it('clears on null/empty', () => {
    expect(parseArtistShowDate(null)).toBeNull()
    expect(parseArtistShowDate('')).toBeNull()
    expect(parseArtistShowDate(undefined)).toBeUndefined()
  })
})

describe('formatLocalArtistShowHtml', () => {
  it('escapes flyer URL attributes', () => {
    expect(
      formatLocalArtistShowHtml({
        flyerImageUrl: 'https://x.test/a"b.webp',
        content: '<p>Hi</p>',
        artist: { artistName: 'A&B' },
      })
    ).toBe('<img src="https://x.test/a&quot;b.webp" alt="A&amp;B" /><p>Hi</p>')
  })
})

describe('hashAdditionalInfo', () => {
  it('returns a stable sha1 hash', () => {
    expect(hashAdditionalInfo('Live show info')).toBe(
      '50303d1d7e6849430c64786a4668303dc74fb76d'
    )
  })
})
