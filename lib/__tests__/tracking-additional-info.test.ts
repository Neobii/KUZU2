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

describe('getCurrentAdditionalInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns production status additional content when enabled', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: true,
      isDisplayingLocalArtistShows: false,
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
      isDisplayingLocalArtistShows: false,
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

  it('returns local artist show HTML when displaying flag is on and artist is playing', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: true,
      isDisplayingLocalArtistShows: true,
      additionalContent: '<p>Station note</p>',
    })
    mocks.prisma.show.findFirst.mockResolvedValue(null)
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
      artist: { artistName: 'Local Band' },
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe(
      '<img src="https://example.com/flyer.webp" alt="Local Band" /><p>Doors 7pm</p>'
    )
  })

  it('falls back when local artist flag is on but no matching show', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: true,
      isDisplayingLocalArtistShows: true,
      additionalContent: '<p>Station note</p>',
    })
    mocks.prisma.show.findFirst.mockResolvedValue(null)
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artistId: null,
      artist: 'Unknown',
    })
    mocks.prisma.artist.findFirst.mockResolvedValue(null)

    await expect(getCurrentAdditionalInfo()).resolves.toBe('<p>Station note</p>')
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
