import schedule from 'node-schedule'
import moment from 'moment'
import { prisma } from '@/lib/prisma'

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
  const url =
    process.env.ICECAST_STATUS_URL ?? 'http://138.197.2.189:8000/status-json.xsl'
  const intervalMs = parseInt(process.env.LISTENER_POLL_MS ?? '300000', 10)

  listenerInterval = setInterval(async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const data = (await res.json()) as {
        icestats?: { source?: { listeners?: number } }
      }
      const src = data.icestats?.source
      const numListeners =
        src && typeof src.listeners === 'number' ? src.listeners : null
      if (numListeners != null) {
        await prisma.listenerStat.create({
          data: { numListeners },
        })
      }
    } catch {
      /* ignore */
    }
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
