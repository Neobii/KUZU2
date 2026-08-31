import { NextRequest, NextResponse } from 'next/server'
import { holdIcecastTrackPolling } from '@/lib/cron'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { getIcecastTrackPollIntervalMs } from '@/lib/icecast'
import { pollIcecastTrackLog } from '@/lib/listeners'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
/** Pin this isolate for a Vercel cron window so setInterval(1s) can keep firing. */
export const maxDuration = 300

const HOLD_BUFFER_SEC = 20

/**
 * Production: start a 1s setInterval and keep the isolate awake until just
 * before maxDuration. vercel.json re-invokes this every 5 minutes.
 * Local/tests: one-shot poll (instrumentation already runs the interval).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.ENABLE_CRON === 'false') {
    return NextResponse.json({ ok: true, disabled: true })
  }

  const intervalMs = getIcecastTrackPollIntervalMs()

  try {
    if (process.env.VERCEL === '1') {
      await holdIcecastTrackPolling((maxDuration - HOLD_BUFFER_SEC) * 1000)
      return NextResponse.json({ ok: true, polling: true, intervalMs })
    }

    const result = await pollIcecastTrackLog()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/icecast-tracks]', e)
    return NextResponse.json({ error: 'Icecast track poll failed' }, { status: 500 })
  }
}
