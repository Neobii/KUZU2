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
    stopAfterLastSong: false,
    stopOnCalendarEnd: false,
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
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    tracklist: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    message: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (ops: unknown) => ops),
  }
  const cron = {
    scheduleStopShowAtEnd: vi.fn(),
    cancelStopShowAtEnd: vi.fn(),
    cancelAutoStartShow: vi.fn(),
  }
  const fillAutoDJTrack = vi.fn()
  const clearAutoplayTimer = vi.fn()
  const scheduleNextTrackAfter = vi.fn()
  return {
    prisma,
    baseShow,
    baseTrack,
    cron,
    fillAutoDJTrack,
    clearAutoplayTimer,
    scheduleNextTrackAfter,
  }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/cron', () => mocks.cron)
vi.mock('@/lib/auto-dj-fill', () => ({ fillAutoDJTrack: mocks.fillAutoDJTrack }))
vi.mock('@/lib/live-timer', () => ({
  clearAutoplayTimer: mocks.clearAutoplayTimer,
  scheduleNextTrackAfter: mocks.scheduleNextTrackAfter,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.show.findMany.mockResolvedValue([])
  mocks.prisma.show.updateMany.mockResolvedValue({ count: 0 })
  mocks.prisma.show.update.mockResolvedValue({ ...mocks.baseShow, isActive: true })
  mocks.prisma.show.findFirst.mockResolvedValue({ ...mocks.baseShow, isActive: true })
  mocks.prisma.show.findUnique.mockResolvedValue({
    ...mocks.baseShow,
    isActive: true,
    isAutoPlaying: true,
  })
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

  it('does not deactivate on empty playlist when stopAfterLastSong is on', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      autoplayOnStart: true,
      stopAfterLastSong: true,
    })
    mocks.prisma.show.findFirst.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      autoplayOnStart: true,
      stopAfterLastSong: true,
    })
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)
    const { activateShow } = await import('@/lib/show-actions')

    await activateShow('show-1')

    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'show-1' },
        data: expect.objectContaining({ isActive: true }),
      })
    )
    expect(mocks.prisma.show.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    )
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
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

  it('schedules calendar end stop when activating', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      autoplayOnStart: false,
      stopOnCalendarEnd: true,
    })
    const { activateShow } = await import('@/lib/show-actions')

    await activateShow('show-1')

    expect(mocks.cron.scheduleStopShowAtEnd).toHaveBeenCalledWith('show-1')
  })

  it('clears prior live timers and calendar-stop jobs when taking over', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      autoplayOnStart: false,
    })
    mocks.prisma.show.findMany.mockResolvedValue([{ id: 'show-old' }])
    const { activateShow } = await import('@/lib/show-actions')

    await activateShow('show-1')

    expect(mocks.clearAutoplayTimer).toHaveBeenCalled()
    expect(mocks.cron.cancelStopShowAtEnd).toHaveBeenCalledWith('show-old')
    expect(mocks.prisma.show.updateMany).toHaveBeenCalledWith({
      where: { isActive: true },
      data: { isActive: false, isAutoPlaying: false },
    })
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
  })
})

describe('startNextTrackAfterCurrent', () => {
  it('deactivates when there is no next track and stopAfterLastSong is on', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      stopAfterLastSong: true,
    })
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)
    const { startNextTrackAfterCurrent } = await import('@/lib/show-actions')

    await startNextTrackAfterCurrent('show-1', 0)

    expect(mocks.cron.cancelStopShowAtEnd).toHaveBeenCalledWith('show-1')
    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'show-1' },
        data: expect.objectContaining({ isActive: false }),
      })
    )
    expect(mocks.fillAutoDJTrack).toHaveBeenCalled()
  })

  it('only pauses autoplay when stopAfterLastSong is off', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      stopAfterLastSong: false,
      autoStartEnd: false,
    })
    mocks.prisma.tracklist.findFirst.mockResolvedValue(null)
    const { startNextTrackAfterCurrent } = await import('@/lib/show-actions')

    await startNextTrackAfterCurrent('show-1', 0)

    expect(mocks.prisma.show.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'show-1' },
        data: { isAutoPlaying: false },
      })
    )
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
  })

  it('ignores stale timers for shows that are no longer active', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: false,
      stopAfterLastSong: true,
    })
    const { startNextTrackAfterCurrent } = await import('@/lib/show-actions')

    await startNextTrackAfterCurrent('show-1', 0)

    expect(mocks.prisma.tracklist.findFirst).not.toHaveBeenCalled()
    expect(mocks.prisma.show.update).not.toHaveBeenCalled()
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
  })

  it('skips deleted middle-track index gaps instead of ending the playlist', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      stopAfterLastSong: true,
      isAutoPlaying: true,
    })
    const nextTrack = {
      ...mocks.baseTrack,
      id: 'track-3',
      indexNumber: 2,
    }
    mocks.prisma.tracklist.findFirst.mockResolvedValue(nextTrack)
    mocks.prisma.tracklist.findUnique.mockResolvedValue(nextTrack)
    const { startNextTrackAfterCurrent } = await import('@/lib/show-actions')

    await startNextTrackAfterCurrent('show-1', 0)

    expect(mocks.prisma.tracklist.findFirst).toHaveBeenCalledWith({
      where: { showId: 'show-1', indexNumber: { gt: 0 } },
      orderBy: { indexNumber: 'asc' },
    })
    expect(mocks.prisma.tracklist.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'track-3' },
        data: expect.objectContaining({
          playDate: expect.any(Date),
          isHighlighted: true,
        }),
      })
    )
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
  })
})

describe('deleteShow', () => {
  it('deactivates the live show before deleting so Auto DJ can take over', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
    })
    const { deleteShow } = await import('@/lib/show-actions')

    await deleteShow('show-1')

    expect(mocks.clearAutoplayTimer).toHaveBeenCalled()
    expect(mocks.cron.cancelStopShowAtEnd).toHaveBeenCalledWith('show-1')
    expect(mocks.prisma.show.update).toHaveBeenCalledWith({
      where: { id: 'show-1' },
      data: { isActive: false, isAutoPlaying: false },
    })
    expect(mocks.fillAutoDJTrack).toHaveBeenCalled()
    expect(mocks.cron.cancelAutoStartShow).toHaveBeenCalledWith('show-1')
    expect(mocks.prisma.$transaction).toHaveBeenCalled()
    expect(mocks.prisma.tracklist.updateMany).toHaveBeenCalledWith({
      where: { showId: 'show-1', playDate: { not: null }, trackType: 'song' },
      data: { showId: null, isHighlighted: false, indexNumber: null },
    })
    expect(mocks.prisma.tracklist.deleteMany).toHaveBeenCalledWith({
      where: {
        showId: 'show-1',
        OR: [{ playDate: null }, { trackType: { not: 'song' } }],
      },
    })
    expect(mocks.prisma.message.deleteMany).toHaveBeenCalledWith({
      where: { showId: 'show-1' },
    })
    expect(mocks.prisma.show.delete).toHaveBeenCalledWith({
      where: { id: 'show-1' },
    })
  })

  it('cancels scheduled jobs when deleting an inactive show without live teardown', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: false,
    })
    const { deleteShow } = await import('@/lib/show-actions')

    await deleteShow('show-1')

    expect(mocks.clearAutoplayTimer).not.toHaveBeenCalled()
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
    expect(mocks.cron.cancelStopShowAtEnd).toHaveBeenCalledWith('show-1')
    expect(mocks.cron.cancelAutoStartShow).toHaveBeenCalledWith('show-1')
    expect(mocks.prisma.tracklist.updateMany).toHaveBeenCalledWith({
      where: { showId: 'show-1', playDate: { not: null }, trackType: 'song' },
      data: { showId: null, isHighlighted: false, indexNumber: null },
    })
    expect(mocks.prisma.show.delete).toHaveBeenCalledWith({
      where: { id: 'show-1' },
    })
  })

  it('preserves played songs for licensing instead of hard-deleting them', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: false,
    })
    const { deleteShow } = await import('@/lib/show-actions')

    await deleteShow('show-1')

    const updateCall = mocks.prisma.tracklist.updateMany.mock.calls[0][0]
    expect(updateCall.where.playDate).toEqual({ not: null })
    expect(updateCall.data.showId).toBeNull()
    const deleteCall = mocks.prisma.tracklist.deleteMany.mock.calls[0][0]
    expect(deleteCall.where.OR).toEqual([{ playDate: null }, { trackType: { not: 'song' } }])
  })
})

describe('startTrack', () => {
  it('refuses to start a track on a non-live show without clearing autoplay', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: false,
      isAutoPlaying: false,
    })
    const { startTrack } = await import('@/lib/show-actions')

    await expect(startTrack('track-1')).rejects.toThrow('Show is not live')
    expect(mocks.clearAutoplayTimer).not.toHaveBeenCalled()
    expect(mocks.prisma.tracklist.update).not.toHaveBeenCalled()
  })

  it('starts a track on the live show and schedules autoplay when enabled', async () => {
    mocks.scheduleNextTrackAfter.mockReturnValue(true)
    mocks.prisma.tracklist.findUnique.mockResolvedValue({
      ...mocks.baseTrack,
      trackLength: '2:00',
      indexNumber: 2,
    })
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      isAutoPlaying: true,
    })
    const { startTrack } = await import('@/lib/show-actions')

    await startTrack('track-1')

    expect(mocks.clearAutoplayTimer).toHaveBeenCalled()
    expect(mocks.prisma.tracklist.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'track-1' },
        data: expect.objectContaining({
          playDate: expect.any(Date),
          isHighlighted: true,
        }),
      })
    )
    expect(mocks.scheduleNextTrackAfter).toHaveBeenCalledWith('2:00', 'show-1', 2)
    expect(mocks.prisma.show.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isAutoPlaying: false },
      })
    )
  })

  it('clears isAutoPlaying when schedule returns false for 0:00 length', async () => {
    mocks.scheduleNextTrackAfter.mockReturnValue(false)
    mocks.prisma.tracklist.findUnique.mockResolvedValue({
      ...mocks.baseTrack,
      trackLength: '0:00',
      indexNumber: 1,
    })
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      isAutoPlaying: true,
    })
    const { startTrack } = await import('@/lib/show-actions')

    await startTrack('track-1')

    expect(mocks.scheduleNextTrackAfter).toHaveBeenCalledWith('0:00', 'show-1', 1)
    expect(mocks.prisma.show.update).toHaveBeenCalledWith({
      where: { id: 'show-1' },
      data: { isAutoPlaying: false },
    })
  })
})

describe('deactivateShow', () => {
  it('clears live runtime when stopping the active show', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: true,
      isAutoPlaying: true,
    })
    const callOrder: string[] = []
    mocks.fillAutoDJTrack.mockImplementation(async () => {
      callOrder.push('fillAutoDJTrack')
    })
    mocks.prisma.show.update.mockImplementation(async () => {
      callOrder.push('show.update')
      return mocks.baseShow
    })
    const { deactivateShow } = await import('@/lib/show-actions')

    await deactivateShow('show-1')

    expect(mocks.clearAutoplayTimer).toHaveBeenCalled()
    expect(mocks.cron.cancelStopShowAtEnd).toHaveBeenCalledWith('show-1')
    expect(callOrder).toEqual(['fillAutoDJTrack', 'show.update'])
    expect(mocks.prisma.show.update).toHaveBeenCalledWith({
      where: { id: 'show-1' },
      data: { isActive: false, isAutoPlaying: false },
    })
    expect(mocks.fillAutoDJTrack).toHaveBeenCalled()
  })

  it('does not clear the live autoplay timer when stopping an inactive show', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      ...mocks.baseShow,
      isActive: false,
      isAutoPlaying: false,
    })
    const { deactivateShow } = await import('@/lib/show-actions')

    await deactivateShow('show-1')

    expect(mocks.clearAutoplayTimer).not.toHaveBeenCalled()
    expect(mocks.cron.cancelStopShowAtEnd).not.toHaveBeenCalled()
    expect(mocks.fillAutoDJTrack).not.toHaveBeenCalled()
    expect(mocks.prisma.show.update).not.toHaveBeenCalled()
  })
})

describe('deleteTrackFromShow', () => {
  it('detaches played songs so licensing export keeps the play', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue({
      ...mocks.baseTrack,
      trackType: 'song',
      playDate: new Date('2026-08-30T18:00:00.000Z'),
      isHighlighted: true,
      indexNumber: 3,
    })
    const { deleteTrackFromShow } = await import('@/lib/show-actions')

    await deleteTrackFromShow('track-1')

    expect(mocks.prisma.tracklist.update).toHaveBeenCalledWith({
      where: { id: 'track-1' },
      data: { showId: null, isHighlighted: false, indexNumber: null },
    })
    expect(mocks.prisma.tracklist.delete).not.toHaveBeenCalled()
  })

  it('hard-deletes unplayed playlist rows', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue({
      ...mocks.baseTrack,
      trackType: 'song',
      playDate: null,
    })
    const { deleteTrackFromShow } = await import('@/lib/show-actions')

    await deleteTrackFromShow('track-1')

    expect(mocks.prisma.tracklist.delete).toHaveBeenCalledWith({
      where: { id: 'track-1' },
    })
    expect(mocks.prisma.tracklist.update).not.toHaveBeenCalled()
  })

  it('hard-deletes non-song cues even when they have a playDate', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue({
      ...mocks.baseTrack,
      trackType: 'showMeta',
      playDate: new Date('2026-08-30T18:00:00.000Z'),
    })
    const { deleteTrackFromShow } = await import('@/lib/show-actions')

    await deleteTrackFromShow('track-1')

    expect(mocks.prisma.tracklist.delete).toHaveBeenCalledWith({
      where: { id: 'track-1' },
    })
  })
})
