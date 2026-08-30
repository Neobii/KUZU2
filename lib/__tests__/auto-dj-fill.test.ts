import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    show: {
      findFirst: vi.fn(),
    },
  },
  streamTrackArtistFields: vi.fn(),
  createStreamTrackLog: vi.fn(),
  shouldSkipDuplicateStreamInsert: vi.fn(),
  getPendingAutoDJTrack: vi.fn(),
  setPendingAutoDJTrack: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/artist-resolve', () => ({
  streamTrackArtistFields: mocks.streamTrackArtistFields,
}))
vi.mock('@/lib/stream-track-log', () => ({
  createStreamTrackLog: mocks.createStreamTrackLog,
  shouldSkipDuplicateStreamInsert: mocks.shouldSkipDuplicateStreamInsert,
}))
vi.mock('@/lib/auto-dj-global', () => ({
  getPendingAutoDJTrack: mocks.getPendingAutoDJTrack,
  setPendingAutoDJTrack: mocks.setPendingAutoDJTrack,
}))

import { fillAutoDJTrack } from '@/lib/auto-dj-fill'

describe('fillAutoDJTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.show.findFirst.mockResolvedValue(null)
    mocks.streamTrackArtistFields.mockResolvedValue({ artist: 'Wilco', artistId: 'artist-1' })
    mocks.shouldSkipDuplicateStreamInsert.mockResolvedValue(false)
    mocks.createStreamTrackLog.mockResolvedValue({ stored: true, track: 'wilco - elt' })
    mocks.getPendingAutoDJTrack.mockReturnValue({
      artist: 'Wilco',
      songTitle: 'ELT',
      album: '',
      label: '',
      duration: '3:45',
      playDate: new Date(),
    })
  })

  it('clears pending without inserting when the song already exists in the log', async () => {
    mocks.shouldSkipDuplicateStreamInsert.mockResolvedValue(true)

    await fillAutoDJTrack()

    expect(mocks.createStreamTrackLog).not.toHaveBeenCalled()
    expect(mocks.setPendingAutoDJTrack).toHaveBeenCalledWith(null)
  })

  it('inserts pending metadata with normalized artist fields', async () => {
    await fillAutoDJTrack()

    expect(mocks.createStreamTrackLog).toHaveBeenCalledWith({
      artist: 'Wilco',
      artistId: 'artist-1',
      songTitle: 'ELT',
      album: null,
      label: null,
      trackLength: '3:45',
    })
    expect(mocks.setPendingAutoDJTrack).toHaveBeenCalledWith(null)
  })

  it('does not flush while a Radio Logik live show is active', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      hasRadioLogikTracking: true,
    })

    await fillAutoDJTrack()

    expect(mocks.createStreamTrackLog).not.toHaveBeenCalled()
    expect(mocks.setPendingAutoDJTrack).not.toHaveBeenCalled()
  })
})
