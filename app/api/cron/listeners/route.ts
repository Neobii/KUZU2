import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { runScheduledMaintenance } from '@/lib/cron'
import { pollIcecastTrackLog } from '@/lib/listeners'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron + manual trigger (every 5 min in production).
 * Polls listener stats and applies durable auto-start arming / calendar-end
 * stops. Icecast now-playing is a 1s setInterval in /api/cron/icecast-tracks.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.ENABLE_CRON === 'false') {
    return NextResponse.json({ ok: true, disabled: true })
  }

  try {
    const result = await runScheduledMaintenance()
    const track = await pollIcecastTrackLog()

    return NextResponse.json({ ok: true, ...result, trackStored: track.trackStored, track: track.track })
  } catch (e) {
    console.error('[cron/listeners]', e)
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 })
  }
}
