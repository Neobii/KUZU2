import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    show: {
      findFirst: vi.fn(),
    },
  },
  createStreamTrackLog: vi.fn(),
  hasSameSongStillOnAir: vi.fn(),
  streamTrackArtistFields: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

vi.mock('@/lib/stream-track-log', () => ({
  createStreamTrackLog: mocks.createStreamTrackLog,
  hasSameSongStillOnAir: mocks.hasSameSongStillOnAir,
}))

vi.mock('@/lib/artist-resolve', () => ({
  streamTrackArtistFields: mocks.streamTrackArtistFields,
}))

vi.mock('@/lib/icecast', () => ({
  fetchIcecastStats: vi.fn(),
  getIcecastSource: (data: { icestats?: { source?: { title?: string } } }) =>
    data.icestats?.source ?? null,
  icecastTrackDisplayKey: (parts: { artist: string; songTitle: string }) =>
    parts.artist ? `${parts.artist} - ${parts.songTitle}` : parts.songTitle,
  isIcecastAvailable: (data: { icestats?: { source?: unknown } }) => !!data.icestats?.source,
  parseIcecastListeners: () => 1,
  parseIcecastTrackParts: (source: { title?: string } | null) => {
    if (!source?.title) return null
    const idx = source.title.indexOf(' - ')
    if (idx > 0) {
      return {
        artist: source.title.slice(0, idx),
        songTitle: source.title.slice(idx + 3),
      }
    }
    return { artist: '', songTitle: source.title }
  },
}))

import { recordIcecastTrackIfChanged } from '@/lib/listeners'

describe('recordIcecastTrackIfChanged', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.show.findFirst.mockResolvedValue(null)
    mocks.streamTrackArtistFields.mockResolvedValue({
      artist: 'Sarah Jaffe',
      artistId: 'artist-1',
    })
    mocks.createStreamTrackLog.mockResolvedValue({ stored: true, track: 'Sarah Jaffe - Clementine' })
    mocks.hasSameSongStillOnAir.mockResolvedValue(false)
  })

  it('stores a new track when Icecast now-playing changes', async () => {
    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'Sarah Jaffe - Clementine', listeners: 3 },
      },
    })

    expect(result.stored).toBe(true)
    expect(mocks.createStreamTrackLog).toHaveBeenCalledWith({
      artist: 'Sarah Jaffe',
      artistId: 'artist-1',
      songTitle: 'Clementine',
    })
  })

  it('does not save Icecast tracks during a KUZU-managed live show', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      hasRadioLogikTracking: false,
    })

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'The Cure - Hot Hot Hot!!!', listeners: 3 },
      },
    })

    expect(result.stored).toBe(false)
    expect(result.track).toBe('The Cure - Hot Hot Hot!!!')
    expect(mocks.createStreamTrackLog).not.toHaveBeenCalled()
  })

  it('does not save Icecast tracks when Radio Logik tracking is active on the live show', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      hasRadioLogikTracking: true,
    })

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'The Cure - Hot Hot Hot!!!', listeners: 3 },
      },
    })

    expect(result.stored).toBe(false)
    expect(mocks.createStreamTrackLog).not.toHaveBeenCalled()
  })

  it('skips logging when Icecast still shows the same song as the latest play', async () => {
    mocks.hasSameSongStillOnAir.mockResolvedValue(true)

    const result = await recordIcecastTrackIfChanged({
      icestats: {
        source: { title: 'Sarah Jaffe - Clementine', listeners: 3 },
      },
    })

    expect(result.stored).toBe(false)
    expect(mocks.createStreamTrackLog).not.toHaveBeenCalled()
  })
})
