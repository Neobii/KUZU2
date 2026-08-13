import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    artist: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import { findOrCreateArtistByName } from '@/lib/artist-resolve'

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
