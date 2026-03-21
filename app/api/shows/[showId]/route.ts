import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { showId } = await params
  const body = await req.json()
  const show = await prisma.show.update({
    where: { id: showId },
    data: {
      ...(body.showName != null && { showName: String(body.showName) }),
      ...(body.showStart != null && { showStart: new Date(body.showStart) }),
      ...(body.showEnd != null && { showEnd: new Date(body.showEnd) }),
      ...(body.defaultMeta != null && { defaultMeta: String(body.defaultMeta) }),
      ...(body.description != null && { description: String(body.description) }),
      ...(body.hasRadioLogikTracking != null && {
        hasRadioLogikTracking: Boolean(body.hasRadioLogikTracking),
      }),
      ...(body.hasMessagingEnabled != null && {
        hasMessagingEnabled: Boolean(body.hasMessagingEnabled),
      }),
      ...(body.isShowingDescription != null && {
        isShowingDescription: Boolean(body.isShowingDescription),
      }),
      ...(body.isShowingDefaultMeta != null && {
        isShowingDefaultMeta: Boolean(body.isShowingDefaultMeta),
      }),
    },
  })
  return NextResponse.json(show)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { showId } = await params
  await prisma.tracklist.deleteMany({ where: { showId } })
  await prisma.message.deleteMany({ where: { showId } })
  await prisma.show.delete({ where: { id: showId } })
  return NextResponse.json({ ok: true })
}
