import { NextRequest, NextResponse } from 'next/server'
import { runScheduledMaintenance } from '@/lib/cron'

export const dynamic = 'force-dynamic'

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  // When CRON_SECRET is configured, only the Bearer token is trusted.
  // `x-vercel-cron` is spoofable by any client and must not bypass the secret.
  if (cronSecret) {
    return req.headers.get('authorization') === `Bearer ${cronSecret}`
  }
  return req.headers.get('x-vercel-cron') === '1'
}

/**
 * Vercel Cron + manual trigger (every 5 min in production).
 * Polls Icecast listener/track stats and applies durable auto-start arming /
 * calendar-end stops (in-process node-schedule does not survive serverless).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runScheduledMaintenance()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/listeners]', e)
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 })
  }
}
