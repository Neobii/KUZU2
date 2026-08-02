import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const baseShow = {
    id: 'show-1',
    isActive: false,
    isAutoPlaying: false,
    isShowingDefaultMeta: false,
    isArmedForAutoStart: true,
    autoStartEnd: false,
    autoplayOnStart: true,
    autoplayOnDate: false,
  }
  const baseTrack = {
    id: 'track-1',
    showId: 'show-1',
    trackType: 'track',
    trackLength: null,
    indexNumber: 0,
    playDate: null,
    isHighlighted: false,
  }
  const prisma = {
    show: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tracklist: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  return { prisma, baseShow, baseTrack }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.show.updateMany.mockResolvedValue({ count: 0 })
  mocks.prisma.show.update.mockResolvedValue({ ...mocks.baseShow, isActive: true })
  mocks.prisma.show.findFirst.mockResolvedValue({ ...mocks.baseShow, isActive: true })
  mocks.prisma.show.findUnique.mockResolvedValue({ ...mocks.baseShow, isAutoPlaying: true })
  mocks.prisma.tracklist.findUnique.mockResolvedValue({ ...mocks.baseTrack })
  mocks.prisma.tracklist.findFirst.mockResolvedValue({ ...mocks.baseTrack })
  mocks.prisma.tracklist.update.mockResolvedValue({
    ...mocks.baseTrack,
    playDate: new Date(),
    isHighlighted: true,
  })
})

describe('activateShow', () => {
  it('marks the show active and autoplays the first unplayed track', async () => {
    const { activateShow } = await import('@/lib/show-actions')

    await activateShow('show-1')

    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'show-1' },
        data: expect.objectContaining({ isActive: true }),
      })
    )
    // Autoplay engaged on the active show
    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isAutoPlaying: true }),
      })
    )
    // First unplayed track started: playDate set and highlighted
    expect(mocks.prisma.tracklist.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'track-1' },
        data: expect.objectContaining({
          playDate: expect.any(Date),
          isHighlighted: true,
        }),
      })
    )
  })

  it('still succeeds when the show has no unplayed tracks', async () => {
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)
    const { activateShow } = await import('@/lib/show-actions')

    await expect(activateShow('show-1')).resolves.toBeUndefined()

    // Show still activated
    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'show-1' },
        data: expect.objectContaining({ isActive: true }),
      })
    )
    // No track was started
    expect(mocks.prisma.tracklist.update).not.toHaveBeenCalled()
  })

  it('does not autoplay when autoplayOnStart is disabled', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      autoplayOnStart: false,
    })
    const { activateShow } = await import('@/lib/show-actions')

    await activateShow('show-1')

    // Show still activated
    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'show-1' },
        data: expect.objectContaining({ isActive: true }),
      })
    )
    // Autoplay NOT engaged
    expect(mocks.prisma.show.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isAutoPlaying: true }),
      })
    )
    // No track was started
    expect(mocks.prisma.tracklist.update).not.toHaveBeenCalled()
  })
})
