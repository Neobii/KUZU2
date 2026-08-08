import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireLiveShowControl } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const live = await requireLiveShowControl(auth.userId)
  if ('error' in live) return live.error

  await prisma.tracklist.updateMany({
    where: { showId: live.active!.id, isHighlighted: true },
    data: { isHighlighted: false },
  })
  return NextResponse.json({ ok: true })
}
