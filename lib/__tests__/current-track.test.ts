import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatIcecastNowPlaying,
  getIcecastSource,
  parseIcecastTrackParts,
  type IcecastStats,
} from '@/lib/icecast'
import { formatCurrentTrackString, getCurrentTrackString } from '@/lib/current-track'

const mocks = vi.hoisted(() => ({
  prisma: {
    show: { findFirst: vi.fn() },
    tracklist: { findFirst: vi.fn() },
  },
  fetchIcecastNowPlaying: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/icecast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/icecast')>()
  return {
    ...actual,
    fetchIcecastNowPlaying: mocks.fetchIcecastNowPlaying,
  }
})

describe('formatIcecastNowPlaying', () => {
  it('formats separate artist and title fields', () => {
    expect(formatIcecastNowPlaying({ artist: 'zoogz rift', title: 'look at the fool' })).toBe(
      'zoogz rift - look at the fool'
    )
  })

  it('uses title as-is when it already includes the artist', () => {
    expect(
      formatIcecastNowPlaying({
        artist: 'zoogz rift',
        title: 'zoogz rift - look at the fool',
      })
    ).toBe('zoogz rift - look at the fool')
  })

  it('uses title alone when artist is missing', () => {
    expect(formatIcecastNowPlaying({ title: 'zoogz rift - look at the fool' })).toBe(
      'zoogz rift - look at the fool'
    )
  })
})

describe('getIcecastSource', () => {
  it('prefers a mount with now-playing metadata', () => {
    const data: IcecastStats = {
      icestats: {
        source: [
          { listeners: 1 },
          { listeners: 2, title: 'look at the fool', artist: 'zoogz rift' },
        ],
      },
    }
    expect(getIcecastSource(data)?.artist).toBe('zoogz rift')
  })
})

describe('parseIcecastTrackParts', () => {
  it('splits combined title into artist and song', () => {
    expect(parseIcecastTrackParts({ title: 'The Dirtbombs - Lupita Screams' })).toEqual({
      artist: 'The Dirtbombs',
      songTitle: 'Lupita Screams',
    })
  })
})

describe('formatCurrentTrackString', () => {
  it('formats artist and title like Meteor getCurrentTrack', () => {
    expect(
      formatCurrentTrackString({
        artist: 'zoogz rift',
        songTitle: 'look at the fool',
      })
    ).toBe('zoogz rift - look at the fool')
  })
})

describe('getCurrentTrackString', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scopes Icecast-down DB fallback to the active show', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-live',
      isShowingDefaultMeta: false,
      defaultMeta: 'Live Show',
    })
    mocks.fetchIcecastNowPlaying.mockResolvedValue(null)
    mocks.prisma.tracklist.findFirst.mockResolvedValue({
      artist: 'Live Artist',
      songTitle: 'Live Song',
    })

    await expect(getCurrentTrackString()).resolves.toBe('Live Artist - Live Song')

    expect(mocks.prisma.tracklist.findFirst).toHaveBeenCalledWith({
      where: { showId: 'show-live', playDate: { not: null } },
      orderBy: { playDate: { sort: 'desc', nulls: 'last' } },
      select: { artist: true, songTitle: true },
    })
  })

  it('returns blank when the live show has no played tracks and Icecast is down', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-live',
      isShowingDefaultMeta: false,
      defaultMeta: 'Live Show',
    })
    mocks.fetchIcecastNowPlaying.mockResolvedValue(null)
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)

    await expect(getCurrentTrackString()).resolves.toBe(' ')
  })
})
