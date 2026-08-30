import { after, NextRequest, NextResponse } from 'next/server'
import { cronFetchHeaders, getCronBaseUrl, isAuthorizedCron } from '@/lib/cron-auth'
import { getIcecastTrackPollIntervalMs } from '@/lib/icecast'
import { pollIcecastTrackLog } from '@/lib/listeners'

export const dynamic = 'force-dynamic'

function scheduleNextIcecastTrackPoll() {
  if (process.env.ENABLE_CRON === 'false') return
  if (process.env.VERCEL !== '1') return

  const baseUrl = getCronBaseUrl()
  if (!baseUrl) return

  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, getIcecastTrackPollIntervalMs()))
    try {
      await fetch(`${baseUrl}/api/cron/icecast-tracks`, {
        headers: cronFetchHeaders(),
        cache: 'no-store',
      })
    } catch {
      /* next Vercel cron hit will restart the chain */
    }
  })
}

/**
 * Poll Icecast status-json every ICECAST_TRACK_POLL_MS (default 1s) and log
 * now-playing into tracklist for /admin/tracks. On Vercel, each invocation
 * schedules the next poll via after(); /api/cron/listeners re-bootstraps if
 * the chain breaks.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.ENABLE_CRON === 'false') {
    return NextResponse.json({ ok: true, disabled: true })
  }

  try {
    const result = await pollIcecastTrackLog()
    scheduleNextIcecastTrackPoll()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/icecast-tracks]', e)
    scheduleNextIcecastTrackPoll()
    return NextResponse.json({ error: 'Icecast track poll failed' }, { status: 500 })
  }
}
