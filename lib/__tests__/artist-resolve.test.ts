import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    artist: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    tracklist: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import { findOrCreateArtistByName, syncArtistsFromTracklist } from '@/lib/artist-resolve'

describe('findOrCreateArtistByName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for blank names', async () => {
    await expect(findOrCreateArtistByName('   ')).resolves.toBeNull()
    expect(mocks.prisma.artist.findFirst).not.toHaveBeenCalled()
  })

  it('returns an existing artist case-insensitively', async () => {
    mocks.prisma.artist.findFirst.mockResolvedValue({
      id: 'artist-1',
      artistName: 'The Cure',
    })

    await expect(findOrCreateArtistByName('the cure')).resolves.toEqual({
      id: 'artist-1',
      artistName: 'The Cure',
    })
    expect(mocks.prisma.artist.create).not.toHaveBeenCalled()
  })

  it('creates a new artist when none exists', async () => {
    mocks.prisma.artist.findFirst.mockResolvedValue(null)
    mocks.prisma.artist.create.mockResolvedValue({
      id: 'artist-2',
      artistName: 'Sarah Jaffe',
    })

    await expect(findOrCreateArtistByName('Sarah Jaffe')).resolves.toEqual({
      id: 'artist-2',
      artistName: 'Sarah Jaffe',
    })
  })
})

describe('syncArtistsFromTracklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates artists and links unlinked track rows', async () => {
    mocks.prisma.tracklist.findMany.mockResolvedValue([
      { id: 'track-1', artist: 'The Jayhawks' },
    ])
    mocks.prisma.artist.findFirst.mockResolvedValue(null)
    mocks.prisma.artist.create.mockResolvedValue({
      id: 'artist-jayhawks',
      artistName: 'The Jayhawks',
    })
    mocks.prisma.tracklist.update.mockResolvedValue({})

    const result = await syncArtistsFromTracklist()

    expect(result).toEqual({ tracksLinked: 1, artistCount: 1 })
    expect(mocks.prisma.tracklist.update).toHaveBeenCalledWith({
      where: { id: 'track-1' },
      data: { artistId: 'artist-jayhawks', artist: 'The Jayhawks' },
    })
  })
})
