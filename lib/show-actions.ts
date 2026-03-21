import { prisma } from '@/lib/prisma'
import { clearAutoplayTimer, scheduleNextTrackAfter } from '@/lib/live-timer'
import { fillAutoDJTrack } from '@/lib/auto-dj-fill'

export async function startTrack(trackId: string) {
  const track = await prisma.tracklist.findUnique({ where: { id: trackId } })
  if (!track?.showId) throw new Error('Track has no show')

  clearAutoplayTimer()

  if (track.trackType === 'showMeta') {
    await prisma.show.update({
      where: { id: track.showId },
      data: { isShowingDefaultMeta: true },
    })
  } else {
    await prisma.show.update({
      where: { id: track.showId },
      data: { isShowingDefaultMeta: false },
    })
  }

  await prisma.tracklist.update({
    where: { id: trackId },
    data: { playDate: new Date(), isHighlighted: true },
  })

  const show = await prisma.show.findUnique({ where: { id: track.showId } })
  if (!show) return

  if (track.trackLength && show.isAutoPlaying) {
    scheduleNextTrackAfter(track.trackLength, track.showId, track.indexNumber ?? 0)
  } else {
    await prisma.show.update({
      where: { id: track.showId },
      data: { isAutoPlaying: false },
    })
  }
}

export async function startNextTrackAfterCurrent(showId: string, currentIndex: number) {
  const show = await prisma.show.findUnique({ where: { id: showId } })
  if (!show) return

  const nextTrack = await prisma.tracklist.findFirst({
    where: { showId, indexNumber: currentIndex + 1 },
  })

  if (nextTrack) {
    await startTrack(nextTrack.id)
  } else {
    if (show.autoStartEnd) {
      await prisma.show.updateMany({
        where: { isActive: true },
        data: {
          isAutoPlaying: false,
          autoStartEnd: false,
          isActive: false,
        },
      })
      await fillAutoDJTrack()
    } else {
      await prisma.show.update({
        where: { id: showId },
        data: { isAutoPlaying: false },
      })
    }
  }
}

export async function autoplayNextTrack() {
  const show = await prisma.show.findFirst({ where: { isActive: true } })
  if (!show) return
  await prisma.show.update({
    where: { id: show.id },
    data: { isAutoPlaying: true },
  })
  const next = await prisma.tracklist.findFirst({
    where: { showId: show.id, playDate: null },
    orderBy: { indexNumber: 'asc' },
  })
  if (next) {
    await startTrack(next.id)
  }
}

export async function pauseAutoplay() {
  clearAutoplayTimer()
  await prisma.show.updateMany({
    where: { isActive: true },
    data: { isAutoPlaying: false },
  })
}

export async function incrementPosition(trackId: string) {
  const track = await prisma.tracklist.findUnique({ where: { id: trackId } })
  if (!track?.showId) return
  const n = track.indexNumber
  if (n === null || n === undefined) {
    const show = await prisma.show.findUnique({ where: { id: track.showId } })
    const highest = await prisma.tracklist.findFirst({
      where: { showId: track.showId },
      orderBy: { indexNumber: 'desc' },
    })
    const hi = highest?.indexNumber ?? -1
    await prisma.tracklist.update({
      where: { id: trackId },
      data: { indexNumber: hi + 1 },
    })
    return
  }
  const swap = await prisma.tracklist.findFirst({
    where: { showId: track.showId, indexNumber: n + 1 },
  })
  if (!swap) return
  await prisma.$transaction([
    prisma.tracklist.update({
      where: { id: swap.id },
      data: { indexNumber: n },
    }),
    prisma.tracklist.update({
      where: { id: trackId },
      data: { indexNumber: n + 1 },
    }),
  ])
}

export async function decrementPosition(trackId: string) {
  const track = await prisma.tracklist.findUnique({ where: { id: trackId } })
  if (!track?.showId) return
  const n = track.indexNumber
  if (n === null || n === undefined) {
    await prisma.tracklist.update({
      where: { id: trackId },
      data: { indexNumber: 0 },
    })
    return
  }
  if (n === 0) return
  const swap = await prisma.tracklist.findFirst({
    where: { showId: track.showId, indexNumber: n - 1 },
  })
  if (!swap) return
  await prisma.$transaction([
    prisma.tracklist.update({
      where: { id: swap.id },
      data: { indexNumber: n },
    }),
    prisma.tracklist.update({
      where: { id: trackId },
      data: { indexNumber: n - 1 },
    }),
  ])
}

export async function deactivateShow(showId: string) {
  clearAutoplayTimer()
  await prisma.show.update({
    where: { id: showId },
    data: { isActive: false },
  })
  await fillAutoDJTrack()
}

export async function activateShow(showId: string) {
  await prisma.show.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  })
  await prisma.show.update({
    where: { id: showId },
    data: {
      isActive: true,
      isShowingDefaultMeta: true,
      isArmedForAutoStart: false,
    },
  })
}

export async function getHighestTrackNumber(showId: string) {
  const t = await prisma.tracklist.findFirst({
    where: { showId },
    orderBy: { indexNumber: 'desc' },
  })
  return t?.indexNumber ?? -1
}
