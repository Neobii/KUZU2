import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireTrackAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { trackId } = await params
  const access = await requireTrackAccess(trackId, auth.userId)
  if ('error' in access) return access.error

  await prisma.tracklist.update({
    where: { id: trackId },
    data: { playDate: null },
  })
  return NextResponse.json({ ok: true })
}
