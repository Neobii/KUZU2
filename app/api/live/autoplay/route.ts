import { NextRequest, NextResponse } from 'next/server'
import { autoplayNextTrack, pauseAutoplay } from '@/lib/show-actions'
import { requireSession } from '@/lib/api-auth'
import { requireLiveShowControl } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const live = await requireLiveShowControl(auth.userId)
  if ('error' in live) return live.error

  const body = await req.json().catch(() => ({}))
  if (body.action === 'pause') {
    await pauseAutoplay()
  } else {
    await autoplayNextTrack()
  }
  return NextResponse.json({ ok: true })
}
