import schedule from 'node-schedule'
import moment from 'moment'
import { prisma } from '@/lib/prisma'
import { getListenerPollIntervalMs } from '@/lib/icecast'
import { pollListenerStats } from '@/lib/listeners'

const scheduledJobs = new Map<string, schedule.Job>()

export function scheduleAutoStartShow(showId: string) {
  cancelAutoStartShow(showId)
  void prisma.show.findUnique({ where: { id: showId } }).then((show) => {
    if (!show?.showStart || !show.autoStartEnd) return
    const armTime = moment(show.showStart).subtract(5, 'minutes').toDate()
    if (armTime.getTime() <= Date.now()) {
      void prisma.show.update({
        where: { id: showId },
        data: { isArmedForAutoStart: true },
      })
      return
    }
    const job = schedule.scheduleJob(armTime, async () => {
      await prisma.show.update({
        where: { id: showId },
        data: { isArmedForAutoStart: true },
      })
      scheduledJobs.delete(`AutoStart_${showId}`)
    })
    scheduledJobs.set(`AutoStart_${showId}`, job)
  })
}

export function cancelAutoStartShow(showId: string) {
  const key = `AutoStart_${showId}`
  const job = scheduledJobs.get(key)
  if (job) {
    job.cancel()
    scheduledJobs.delete(key)
  }
}

export function scheduleStopShowAtEnd(showId: string) {
  cancelStopShowAtEnd(showId)
  void prisma.show.findUnique({ where: { id: showId } }).then((show) => {
    if (!show?.showEnd || !show.stopOnCalendarEnd) return

    const endTime = new Date(show.showEnd)
    if (endTime.getTime() <= Date.now()) {
      if (show.isActive) {
        void import('@/lib/show-actions').then(({ deactivateShow }) =>
          deactivateShow(showId)
        )
      }
      return
    }

    const job = schedule.scheduleJob(endTime, async () => {
      const current = await prisma.show.findUnique({ where: { id: showId } })
      if (current?.isActive && current.stopOnCalendarEnd) {
        const { deactivateShow } = await import('@/lib/show-actions')
        await deactivateShow(showId)
      }
      scheduledJobs.delete(`StopEnd_${showId}`)
    })
    if (job) {
      scheduledJobs.set(`StopEnd_${showId}`, job)
    }
  })
}

export function cancelStopShowAtEnd(showId: string) {
  const key = `StopEnd_${showId}`
  const job = scheduledJobs.get(key)
  if (job) {
    job.cancel()
    scheduledJobs.delete(key)
  }
}

let listenerInterval: NodeJS.Timeout | null = null

export function startListenerPolling() {
  if (listenerInterval) return
  const intervalMs = getListenerPollIntervalMs()

  void pollListenerStats().catch(() => {
    /* ignore — local dev convenience */
  })

  listenerInterval = setInterval(() => {
    void pollListenerStats().catch(() => {
      /* ignore */
    })
  }, intervalMs)
}

export async function rescheduleAllAutoStartShows() {
  const shows = await prisma.show.findMany({
    where: { autoStartEnd: true },
  })
  for (const s of shows) {
    scheduleAutoStartShow(s.id)
  }
}

export async function rescheduleAllStopShows() {
  const shows = await prisma.show.findMany({
    where: { stopOnCalendarEnd: true, showEnd: { not: null } },
  })
  for (const s of shows) {
    scheduleStopShowAtEnd(s.id)
  }
}
