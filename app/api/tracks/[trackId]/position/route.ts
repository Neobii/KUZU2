import { NextRequest, NextResponse } from 'next/server'
import { incrementPosition, decrementPosition } from '@/lib/show-actions'
import { requireSession } from '@/lib/api-auth'
import { requireTrackAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { trackId } = await params
  const access = await requireTrackAccess(trackId, auth.userId)
  if ('error' in access) return access.error

  const body = await req.json()
  const dir = body.direction as 'up' | 'down'
  if (dir === 'up') await decrementPosition(trackId)
  else if (dir === 'down') await incrementPosition(trackId)
  return NextResponse.json({ ok: true })
}
