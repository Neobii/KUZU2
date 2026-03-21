import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const showId = body.showId as string
  const useDefaultMeta = !!body.useDefaultMeta
  await prisma.show.update({
    where: { id: showId },
    data: { isShowingDefaultMeta: useDefaultMeta },
  })
  return NextResponse.json({ ok: true })
}
