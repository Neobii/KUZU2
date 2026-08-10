import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireLiveShowControl } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const live = await requireLiveShowControl(auth.userId)
  if ('error' in live) return live.error

  const body = await req.json()
  const showId = body.showId as string
  if (showId !== live.active!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const useDefaultMeta = !!body.useDefaultMeta
  await prisma.show.update({
    where: { id: showId },
    data: { isShowingDefaultMeta: useDefaultMeta },
  })
  return NextResponse.json({ ok: true })
}
