import { NextRequest, NextResponse } from 'next/server'
import { startTrack } from '@/lib/show-actions'
import { requireSession } from '@/lib/api-auth'
import { requireLiveTrackStart } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { trackId } = await params
  const access = await requireLiveTrackStart(trackId, auth.userId)
  if ('error' in access) return access.error

  try {
    await startTrack(trackId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    )
  }
}
