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

  await prisma.message.updateMany({
    where: { showId: live.active!.id },
    data: { isRead: true },
  })
  return NextResponse.json({ ok: true })
}
