import { NextRequest, NextResponse } from 'next/server'
import { deactivateShow } from '@/lib/show-actions'
import { requireSession } from '@/lib/api-auth'
import { requireShowAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { showId } = await params
  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  await deactivateShow(showId)
  return NextResponse.json({ ok: true })
}
