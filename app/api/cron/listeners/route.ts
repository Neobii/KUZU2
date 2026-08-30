import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron, cronFetchHeaders, getCronBaseUrl } from '@/lib/cron-auth'
import { runScheduledMaintenance } from '@/lib/cron'
import { pollIcecastTrackLog } from '@/lib/listeners'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron + manual trigger (every 5 min in production).
 * Polls listener stats, re-bootstraps the 1s Icecast track poll chain, and
 * applies durable auto-start arming / calendar-end stops.
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

    // Re-bootstrap the 1s Icecast track poll chain on Vercel serverless.
    if (process.env.VERCEL === '1') {
      const baseUrl = getCronBaseUrl()
      if (baseUrl) {
        void fetch(`${baseUrl}/api/cron/icecast-tracks`, {
          headers: cronFetchHeaders(),
          cache: 'no-store',
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true, ...result, trackStored: track.trackStored, track: track.track })
  } catch (e) {
    console.error('[cron/listeners]', e)
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 })
  }
}
