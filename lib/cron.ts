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
