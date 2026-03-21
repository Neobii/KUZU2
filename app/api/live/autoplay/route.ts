import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoplayNextTrack, pauseAutoplay } from '@/lib/show-actions'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  if (body.action === 'pause') {
    await pauseAutoplay()
  } else {
    await autoplayNextTrack()
  }
  return NextResponse.json({ ok: true })
}
