import schedule from 'node-schedule'
import moment from 'moment'
import { prisma } from '@/lib/prisma'
import { getIcecastTrackPollIntervalMs, getListenerPollIntervalMs } from '@/lib/icecast'
import { pollIcecastTrackLog, pollListenerCount } from '@/lib/listeners'

const scheduledJobs = new Map<string, schedule.Job>()

export function scheduleAutoStartShow(showId: string) {
  cancelAutoStartShow(showId)
  void prisma.show.findUnique({ where: { id: showId } }).then((show) => {
    if (!show?.showStart || !show.autoStartEnd) return
    const armTime = moment(show.showStart).subtract(5, 'minutes').toDate()
    if (armTime.getTime() <= Date.now()) {
      // Re-check autoStartEnd so a concurrent remove/cancel cannot arm after
      // opt-out (cancel may have run before this job was registered).
      void prisma.show.updateMany({
        where: { id: showId, autoStartEnd: true },
        data: { isArmedForAutoStart: true },
      })
      return
    }
    const job = schedule.scheduleJob(armTime, async () => {
      await prisma.show.updateMany({
        where: { id: showId, autoStartEnd: true },
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

/** Minutes before showStart when auto-start becomes armed (matches scheduleAutoStartShow). */
export const AUTO_START_ARM_MINUTES = 5

/**
 * How far past showStart we still arm. Prevents permanently re-arming abandoned
 * autoStartEnd rows from months ago when the durable cron runs.
 */
export const AUTO_START_ARM_LOOKBACK_MS = 24 * 60 * 60 * 1000

/**
 * Durable arming for Vercel (and any host where in-process node-schedule jobs
 * die with the isolate). Same predicate as scheduleAutoStartShow's job callback:
 * autoStartEnd still true and arm time (showStart − 5m) has been reached.
 */
export async function armDueAutoStartShows(now = new Date()): Promise<{ armed: number }> {
  const armHorizon = new Date(now.getTime() + AUTO_START_ARM_MINUTES * 60 * 1000)
  const lookback = new Date(now.getTime() - AUTO_START_ARM_LOOKBACK_MS)
  const result = await prisma.show.updateMany({
    where: {
      autoStartEnd: true,
      isArmedForAutoStart: false,
      // Do not arm a show that is already live (null/false both mean not live).
      isActive: { not: true },
      showStart: {
        lte: armHorizon,
        gte: lookback,
      },
    },
    data: { isArmedForAutoStart: true },
  })
  return { armed: result.count }
}

/**
 * Durable calendar-end stop for serverless. Mirrors scheduleStopShowAtEnd's job:
 * live shows with stopOnCalendarEnd whose showEnd is past are deactivated.
 */
export async function stopDueCalendarEndShows(now = new Date()): Promise<{ stopped: number }> {
  const due = await prisma.show.findMany({
    where: {
      stopOnCalendarEnd: true,
      isActive: true,
      showEnd: { lte: now },
    },
    select: { id: true },
  })
  if (due.length === 0) return { stopped: 0 }

  const { deactivateShow } = await import('@/lib/show-actions')
  for (const show of due) {
    await deactivateShow(show.id)
  }
  return { stopped: due.length }
}

/** Listener stats + durable show schedule catch-up (Vercel cron / local interval). */
export async function runScheduledMaintenance() {
  const listeners = await pollListenerCount()
  let autoStart = { armed: 0 }
  let calendarStop = { stopped: 0 }
  try {
    autoStart = await armDueAutoStartShows()
  } catch (e) {
    console.error('[cron] armDueAutoStartShows', e)
  }
  try {
    calendarStop = await stopDueCalendarEndShows()
  } catch (e) {
    console.error('[cron] stopDueCalendarEndShows', e)
  }
  return {
    stored: listeners.stored,
    numListeners: listeners.numListeners,
    autoStart,
    calendarStop,
  }
}

let icecastTrackInterval: NodeJS.Timeout | null = null
let listenerInterval: NodeJS.Timeout | null = null

export function startListenerPolling() {
  if (!icecastTrackInterval) {
    void pollIcecastTrackLog().catch(() => {
      /* ignore — local dev convenience */
    })

    icecastTrackInterval = setInterval(() => {
      void pollIcecastTrackLog().catch(() => {
        /* ignore */
      })
    }, getIcecastTrackPollIntervalMs())
  }

  if (!listenerInterval) {
    void runScheduledMaintenance().catch(() => {
      /* ignore — local dev convenience */
    })

    listenerInterval = setInterval(() => {
      void runScheduledMaintenance().catch(() => {
        /* ignore */
      })
    }, getListenerPollIntervalMs())
  }
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
