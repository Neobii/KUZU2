import { prisma } from '@/lib/prisma'
import { clearAutoplayTimer, scheduleNextTrackAfter } from '@/lib/live-timer'
import { fillAutoDJTrack } from '@/lib/auto-dj-fill'

export async function startTrack(trackId: string) {
  const track = await prisma.tracklist.findUnique({ where: { id: trackId } })
  if (!track?.showId) throw new Error('Track has no show')

  const show = await prisma.show.findUnique({ where: { id: track.showId } })
  if (!show) return
  // Refuse before clearing the global autoplay timer — starting a track on a
  // non-live show would kill the active show's autoplay and skew current-track.
  if (!show.isActive) {
    throw new Error('Show is not live')
  }

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

  // Truthy but zero/unparseable lengths (e.g. "0:00") used to call schedule
  // and return early without a timer, leaving isAutoPlaying stuck true.
  const length =
    typeof track.trackLength === 'string' ? track.trackLength.trim() : ''
  const scheduled =
    length.length > 0 &&
    show.isAutoPlaying &&
    scheduleNextTrackAfter(length, track.showId, track.indexNumber ?? 0)
  if (!scheduled) {
    await prisma.show.update({
      where: { id: track.showId },
      data: { isAutoPlaying: false },
    })
  }
}

export async function startNextTrackAfterCurrent(showId: string, currentIndex: number) {
  const show = await prisma.show.findUnique({ where: { id: showId } })
  // Ignore stale timers from a show that is no longer live (e.g. after Go Live
  // switched to a different show without the previous timeout being cleared).
  if (!show?.isActive) return

  // Use the next higher index, not currentIndex+1 only — deleting a middle
  // track leaves gaps, and exact +1 would stop autoplay (or kill the show
  // when stopAfterLastSong is on) while later tracks remain.
  const nextTrack = await prisma.tracklist.findFirst({
    where: { showId, indexNumber: { gt: currentIndex } },
    orderBy: { indexNumber: 'asc' },
  })

  if (nextTrack) {
    await startTrack(nextTrack.id)
  } else if (show.stopAfterLastSong || show.autoStartEnd) {
    await deactivateShow(showId)
    if (show.autoStartEnd) {
      await prisma.show.update({
        where: { id: showId },
        data: { autoStartEnd: false },
      })
    }
  } else {
    await prisma.show.update({
      where: { id: showId },
      data: { isAutoPlaying: false },
    })
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
  // Intentionally do not stop the show here when the playlist is empty/exhausted.
  // stopAfterLastSong / autoStartEnd belong in startNextTrackAfterCurrent (after a
  // track finishes). Deactivating from this entrypoint would kill go-live or a
  // manual Autoplay press when there are no unplayed tracks yet.
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
  const show = await prisma.show.findUnique({ where: { id: showId } })
  if (!show) return

  // Stopping a show that is not live must not clear the active show's
  // autoplay timer or insert Auto DJ as if the live show had ended.
  if (!show.isActive) {
    if (show.isAutoPlaying) {
      await prisma.show.update({
        where: { id: showId },
        data: { isAutoPlaying: false },
      })
    }
    return
  }

  clearAutoplayTimer()
  const { cancelStopShowAtEnd } = await import('@/lib/cron')
  cancelStopShowAtEnd(showId)
  await prisma.show.update({
    where: { id: showId },
    data: { isActive: false, isAutoPlaying: false },
  })
  await fillAutoDJTrack()
}

/**
 * Delete a show after tearing down any live/scheduled runtime. Deleting the
 * active show without deactivateShow would orphan the autoplay timer, skip
 * Auto DJ handoff, and leave /api/tracking/current-track on stale metadata.
 */
export async function deleteShow(showId: string) {
  const show = await prisma.show.findUnique({ where: { id: showId } })
  if (!show) return

  const { cancelAutoStartShow, cancelStopShowAtEnd } = await import('@/lib/cron')
  if (show.isActive) {
    await deactivateShow(showId)
  } else {
    cancelStopShowAtEnd(showId)
  }
  cancelAutoStartShow(showId)

  await prisma.tracklist.deleteMany({ where: { showId } })
  await prisma.message.deleteMany({ where: { showId } })
  await prisma.show.delete({ where: { id: showId } })
}

/**
 * Tear down in-process live runtime for any currently active show before
 * another show takes over. Does not call fillAutoDJTrack — that belongs to an
 * intentional stop, not a live handoff.
 */
export async function clearActiveShowRuntime() {
  clearAutoplayTimer()
  const { cancelStopShowAtEnd } = await import('@/lib/cron')
  const active = await prisma.show.findMany({
    where: { isActive: true },
    select: { id: true },
  })
  for (const prev of active) {
    cancelStopShowAtEnd(prev.id)
  }
  if (active.length > 0) {
    await prisma.show.updateMany({
      where: { isActive: true },
      data: { isActive: false, isAutoPlaying: false },
    })
  }
}

export async function activateShow(showId: string) {
  const show = await prisma.show.findUnique({ where: { id: showId } })
  if (!show) return

  await clearActiveShowRuntime()
  await prisma.show.update({
    where: { id: showId },
    data: {
      isActive: true,
      isShowingDefaultMeta: true,
      isArmedForAutoStart: false,
    },
  })
  const { scheduleStopShowAtEnd } = await import('@/lib/cron')
  scheduleStopShowAtEnd(showId)
  // Only start the first unplayed track on go-live when the show has
  // "Autoplay on show start" enabled. Safe with an empty tracklist:
  // autoplayNextTrack finds no next track and returns without starting.
  if (show.autoplayOnStart) {
    await autoplayNextTrack()
  }
}

export async function getHighestTrackNumber(showId: string) {
  const t = await prisma.tracklist.findFirst({
    where: { showId },
    orderBy: { indexNumber: 'desc' },
  })
  return t?.indexNumber ?? -1
}

/**
 * Remove a track from a show playlist. Played songs are detached (showId → null)
 * so licensing export still sees them; unplayed rows and non-song cues are deleted.
 */
export async function deleteTrackFromShow(trackId: string) {
  const track = await prisma.tracklist.findUnique({ where: { id: trackId } })
  if (!track) return

  if (track.playDate && track.trackType === 'song') {
    await prisma.tracklist.update({
      where: { id: trackId },
      data: { showId: null, isHighlighted: false, indexNumber: null },
    })
    return
  }

  await prisma.tracklist.delete({ where: { id: trackId } })
}
